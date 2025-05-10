const axios = require('axios');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');

exports.initiatePayment = async (req, res) => {
  const { billId, phoneNumber, amount } = req.body;

  try {
    const bill = await Bill.findById(billId);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    // Generate M-Pesa access token
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const { data } = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` },
    });

    const accessToken = data.access_token;

    // Initiate STK Push
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: 'https://your-backend-url/callback',
        AccountReference: `KodiPay-${billId}`,
        TransactionDesc: 'Rent Payment',
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    res.json({ message: 'Payment initiated', data: stkResponse.data });
  } catch (error) {
    res.status(500).json({ message: 'Payment initiation failed', error: error.message });
  }
};

exports.paymentCallback = async (req, res) => {
  const { Body } = req.body;
  const { ResultCode, CheckoutRequestID, Amount, MpesaReceiptNumber } = Body.stkCallback;

  if (ResultCode === 0) {
    // Payment successful
    const payment = new Payment({
      tenant: req.user.id,
      bill: CheckoutRequestID.split('-')[1], // Extract billId from AccountReference
      amount: Amount,
      transactionId: MpesaReceiptNumber,
    });

    await payment.save();

    const bill = await Bill.findById(payment.bill);
    bill.status = 'paid';
    await bill.save();
  }

  res.status(200).json({ message: 'Callback received' });
};