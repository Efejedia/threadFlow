const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Staff = require('../models/Staff');

exports.protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    req.auth = decoded;

    // Prefer role; fall back to type for older tokens
    const kind = decoded.role || decoded.type;

    if (kind === 'owner') {
      req.user = await User.findById(decoded.sub);
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
    } else if (kind === 'staff') {
      req.staff = await Staff.findById(decoded.sub);
      if (!req.staff || !req.staff.isActive) {
        return res.status(401).json({ message: 'Staff not found or inactive' });
      }
    } else {
      return res.status(401).json({ message: 'Invalid token type' });
    }

    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

exports.requireOwner = (req, res, next) => {
  const kind = req.auth?.role || req.auth?.type;
  if (kind !== 'owner') {
    return res.status(403).json({ message: 'Owners only' });
  }
  next();
};

exports.requireStaff = (req, res, next) => {
  const kind = req.auth?.role || req.auth?.type;
  if (kind !== 'staff') {
    return res.status(403).json({ message: 'Staff only' });
  }
  next();
};