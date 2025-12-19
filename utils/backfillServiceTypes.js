import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Operator from '../models/Operator.js';
import connectDB from '../config/db.js';
import { SERVICE_TYPE_IDS } from '../constants/services.js';

dotenv.config();

const FALLBACK_SERVICE_TYPE = 'MOBILE';

const deriveServiceType = (operator) => {
  const code = operator?.code?.toUpperCase();
  if (!code) return FALLBACK_SERVICE_TYPE;
  if (['AIR', 'JIO', 'VI', 'BSN'].includes(code)) return 'MOBILE';
  return FALLBACK_SERVICE_TYPE;
};

const backfill = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/recharge_app';
  await connectDB(uri);

  const operators = await Operator.find({ $or: [{ serviceType: { $exists: false } }, { serviceType: { $nin: SERVICE_TYPE_IDS } }] });

  if (!operators.length) {
    console.log('All operators already have a serviceType. No changes required.');
    await mongoose.disconnect();
    return process.exit(0);
  }

  const bulkOps = operators.map((operator) => ({
    updateOne: {
      filter: { _id: operator._id },
      update: {
        $set: {
          serviceType: deriveServiceType(operator),
        },
      },
    },
  }));

  await Operator.bulkWrite(bulkOps);
  console.log(`Updated ${bulkOps.length} operator records with serviceType.`);
  await mongoose.disconnect();
  process.exit(0);
};

backfill().catch((error) => {
  console.error('Failed to backfill service types:', error);
  mongoose.disconnect().finally(() => process.exit(1));
});
