require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');

app.use('/api', require('./src/routes/agent'));

const start = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`ThreadFlow API on :${port}`);
  });
};

start().catch((e) => {
  console.error(e);
  process.exit(1);
});