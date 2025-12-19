import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import operatorRoutes from './routes/operators.js';
import rechargeRoutes from './routes/recharge.js';
import servicesRoutes from './routes/services.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/recharge', rechargeRoutes);
app.use('/api/services', servicesRoutes);

app.use((err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/recharge_app';

connectDB(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Failed to connect to MongoDB', error.message);
    process.exit(1);
  });
