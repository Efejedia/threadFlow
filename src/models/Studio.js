const mongoose = require('mongoose');

const studioSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
  },
  { timestamps: true }
);

const Studio = mongoose.model('Studio', studioSchema);

module.exports = Studio;