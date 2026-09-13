const Staff = require('../models/Staff');

// POST /api/staff
exports.createStaff = async (req, res) => {
  try {
    const { name, pin, skills } = req.body;
    if (!name || !pin) {
      return res.status(400).json({ message: 'name and pin required' });
    }
    if (!/^\d{4}$/.test(String(pin))) {
      return res.status(400).json({ message: 'PIN must be 4 digits' });
    }

    const staff = await Staff.create({
      studio: req.auth.studioId,
      name: name.trim(),
      pin,
      skills: skills || [],
    });

    res.status(201).json({
      staff: {
        id: staff._id,
        name: staff.name,
        skills: staff.skills,
        isActive: staff.isActive,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Staff name already exists in this studio' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/staff
exports.listStaff = async (req, res) => {
  const list = await Staff.find({ studio: req.auth.studioId }).select('-pin');
  res.json({
    staff: list.map((s) => ({
      id: s._id,
      name: s.name,
      skills: s.skills,
      isActive: s.isActive,
    })),
  });
};

// PATCH /api/staff/:id
exports.updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findOne({
      _id: req.params.id,
      studio: req.auth.studioId,
    }).select('+pin');

    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    if (req.body.name) staff.name = req.body.name.trim();
    if (req.body.skills) staff.skills = req.body.skills;
    if (typeof req.body.isActive === 'boolean') staff.isActive = req.body.isActive;
    if (req.body.pin) {
      if (!/^\d{4}$/.test(String(req.body.pin))) {
        return res.status(400).json({ message: 'PIN must be 4 digits' });
      }
      staff.pin = req.body.pin; // pre-save hashes
    }

    await staff.save();
    res.json({
      staff: {
        id: staff._id,
        name: staff.name,
        skills: staff.skills,
        isActive: staff.isActive,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Staff name already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};