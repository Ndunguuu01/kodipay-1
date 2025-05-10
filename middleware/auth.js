const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.header('Authorization');
  console.log('Auth middleware - Authorization header:', authHeader);

  if (!authHeader) {
    console.log('No Authorization header provided');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('Extracted token:', token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); 
    console.log('Token decoded successfully:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};