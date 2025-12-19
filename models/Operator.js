import mongoose from 'mongoose';
import { SERVICE_TYPE_IDS } from '../constants/services.js';

const planSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String },
    amount: { type: Number, required: true },
    validity: { type: String },
    data: { type: String },
    type: {
      type: String,
      enum: ['Prepaid', 'Postpaid'],
      default: 'Prepaid',
    },
    description: { type: String },
    benefits: [{ type: String }],
  },
  { _id: false }
);

const operatorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      unique: true,
      trim: true,
    },
    serviceType: {
      type: String,
      enum: SERVICE_TYPE_IDS,
      required: true,
      default: 'MOBILE',
      index: true,
    },
    logo: {
      type: String,
      required: true,
    },
    plans: {
      type: [planSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

operatorSchema.index({ code: 1 });

const Operator = mongoose.model('Operator', operatorSchema);

export default Operator;
