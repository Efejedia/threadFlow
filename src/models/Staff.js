const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const staffSchema = new mongoose.Schema(
  {
    studio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Studio',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    pin: { type: String, required: true, select: false }, // hashed 4-digit
    skills: [{ type: String, trim: true }], // ['cutting','sewing','finishing']
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// unique name per studio
staffSchema.index({ studio: 1, name: 1 }, { unique: true });

staffSchema.pre('save', async function (next) {
  if (!this.isModified('pin')) return next();
  this.pin = await bcrypt.hash(String(this.pin), 10);
  next();
});

staffSchema.methods.matchPin = function (plain) {
  return bcrypt.compare(String(plain), this.pin);
};

module.exports = mongoose.model('Staff', staffSchema);