const User = require('../models/User');
const Staff = require('../models/Staff');
const Studio = require('../models/Studio');
const { signOwnerToken, signStaffToken } = require('../utils/tokens');
const { generateStudioCode } = require('../utils/studioCode');

// POST /api/auth/owner/register
exports.registerOwner = async (req, res) => {
  try {
    const { name, email, password, studioName } = req.body;
    if (!name || !email || !password || !studioName) {
      return res.status(400).json({ message: 'name, email, password, studioName required' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    let code = generateStudioCode();
    while (await Studio.findOne({ code })) code = generateStudioCode();

    const studio = await Studio.create({ name: studioName, code });
    const user = await User.create({
      name,
      email,
      password,
      studio: studio._id,
    });

    const token = signOwnerToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studioId: studio._id,
        studioCode: studio.code,
        studioName: studio.name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/owner/login
exports.loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const studio = await Studio.findById(user.studio);
    const token = signOwnerToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studioId: user.studio,
        studioCode: studio?.code,
        studioName: studio?.name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/owner/me
exports.ownerMe = async (req, res) => {
  const studio = await Studio.findById(req.user.studio);
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      studioId: req.user.studio,
      studioCode: studio?.code,
      studioName: studio?.name,
    },
  });
};

// POST /api/auth/staff/login
exports.loginStaff = async (req, res) => {
  try {
    const { studioCode, name, pin } = req.body;
    if (!studioCode || !name || !pin) {
      return res.status(400).json({ message: 'studioCode, name and pin required' });
    }
    if (!/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({ message: 'PIN must be 4 digits' });
    }

    const studio = await Studio.findOne({ code: studioCode.toUpperCase() });
    if (!studio) return res.status(401).json({ message: 'Invalid studio code' });

    const staff = await Staff.findOne({
      studio: studio._id,
      name: name.trim(),
      isActive: true,
    }).select('+pin');

    if (!staff || !(await staff.matchPin(pin))) {
      return res.status(401).json({ message: 'Invalid name or PIN' });
    }

    const token = signStaffToken(staff);
    res.json({
      token,
      staff: {
        id: staff._id,
        name: staff.name,
        skills: staff.skills,
        studioId: studio._id,
        studioCode: studio.code,
        studioName: studio.name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/auth/staff/me
exports.staffMe = async (req, res) => {
  const studio = await Studio.findById(req.staff.studio);
  res.json({
    staff: {
      id: req.staff._id,
      name: req.staff.name,
      skills: req.staff.skills,
      studioId: req.staff.studio,
      studioCode: studio?.code,
      studioName: studio?.name,
    },
  });
};