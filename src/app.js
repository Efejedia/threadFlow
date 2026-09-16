const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/auth.routes');
const staffRoutes = require('./routes/staff.routes');

const app = express();
app.use(helmet({ contentSecurityPolicy: false })); // easier for Swagger UI locally
app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true }));

// Swagger
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'ThreadFlow API Docs',
}));
app.get('/api/docs.json', (_, res) => res.json(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/steps', require('./routes/step.routes'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

module.exports = app;