import mongoose from 'mongoose';
import { SERVICE_TYPE_IDS } from '../constants/services.js';

const planDetailsSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String },
    validity: { type: String },
    data: { type: String },
    description: { type: String },
  },
  { _id: false }
);

const rechargeSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    serviceType: {
      type: String,
      enum: SERVICE_TYPE_IDS,
      required: true,
      default: 'MOBILE',
      index: true,
    },
    identifier: {
      type: String,
      required: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      match: /^[6-9]\d{9}$/,
    },
    operator: {
      name: {
        type: String,
        required: true,
      },
      code: {
        type: String,
        required: true,
        uppercase: true,
      },
    },
    plan: planDetailsSchema,
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILED', 'PENDING'],
      default: 'PENDING',
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Card', 'Wallet'],
      required: true,
    },
    failureReason: {
      type: String,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    parentTransactionId: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);


const Recharge = mongoose.model('Recharge', rechargeSchema);

export default Recharge;
