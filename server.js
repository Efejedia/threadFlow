require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');

const start = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
  app.listen(process.env.PORT || 5000, () => {
    console.log(`ThreadFlow API on :${process.env.PORT || 5000}`);
  });
};

start().catch((e) => {
  console.error(e);
  process.exit(1);
});