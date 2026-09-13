const jwt = require('jsonwebtoken');

exports.signOwnerToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), role: 'owner', studioId: user.studio.toString(), type: 'owner' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_OWNER_EXPIRES || '7d' }
  );

exports.signStaffToken = (staff) =>
  jwt.sign(
    { sub: staff._id.toString(), role: 'staff', studioId: staff.studio.toString(), type: 'staff' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_STAFF_EXPIRES || '12h' }
  );