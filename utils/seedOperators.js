import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import Operator from '../models/Operator.js';
import connectDB from '../config/db.js';

dotenv.config();

const operators = [
  {
    name: 'Airtel',
    code: 'AIR',
    serviceType: 'MOBILE',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Airtel_logo.svg/512px-Airtel_logo.svg.png',
    plans: [
      {
        amount: 199,
        validity: '28 days',
        data: '1GB/day',
        description: 'Truly unlimited calls with 100 SMS/day and 1GB daily data.',
        benefits: ['Unlimited Calls', '100 SMS/day', 'Apollo 24x7'],
      },
      {
        amount: 299,
        validity: '28 days',
        data: '1.5GB/day',
        description: 'Daily 1.5GB high-speed data with unlimited calls and 100 SMS/day.',
        benefits: ['Unlimited Calls', '100 SMS/day', 'Airtel Xstream'],
      },
      {
        amount: 499,
        validity: '56 days',
        data: '1.5GB/day',
        description: 'Long validity pack with 1.5GB daily data and unlimited calls.',
        benefits: ['Unlimited Calls', '100 SMS/day'],
      },
      {
        amount: 719,
        validity: '84 days',
        data: '1.5GB/day',
        description: 'Extended pack with 1.5GB/day data and unlimited calls.',
        benefits: ['Unlimited Calls', 'Hello Tunes'],
      },
    ],
  },
  {
    name: 'Jio',
    code: 'JIO',
    serviceType: 'MOBILE',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Reliance_Jio_Logo_%282015%29.svg/512px-Reliance_Jio_Logo_%282015%29.svg.png',
    plans: [
      {
        amount: 209,
        validity: '28 days',
        data: '1GB/day',
        description: 'Unlimited calls with 1GB/day high-speed data.',
        benefits: ['Unlimited Calls', '100 SMS/day', 'JioTV'],
      },
      {
        amount: 299,
        validity: '28 days',
        data: '2GB/day',
        description: 'Double data pack with 2GB/day and unlimited voice.',
        benefits: ['Unlimited Calls', '100 SMS/day', 'JioCinema'],
      },
      {
        amount: 555,
        validity: '56 days',
        data: '1.5GB/day',
        description: 'Long validity with 1.5GB/day and unlimited voice.',
        benefits: ['Unlimited Calls', '100 SMS/day'],
      },
      {
        amount: 666,
        validity: '84 days',
        data: '1.5GB/day',
        description: 'Extended pack with 1.5GB/day plus Jio apps subscription.',
        benefits: ['Unlimited Calls', '100 SMS/day', 'JioCloud'],
      },
    ],
  },
  {
    name: 'Vi',
    code: 'VI',
    serviceType: 'MOBILE',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Vodafone_Idea_logo_white.svg/512px-Vodafone_Idea_logo_white.svg.png',
    plans: [
      {
        amount: 219,
        validity: '28 days',
        data: '1GB/day',
        description: 'Unlimited calls with 1GB/day and Binge All Night benefit.',
        benefits: ['Unlimited Calls', '100 SMS/day', 'Binge All Night'],
      },
      {
        amount: 319,
        validity: '28 days',
        data: '1.5GB/day',
        description: 'Extra data with 1.5GB/day and weekend data rollover.',
        benefits: ['Unlimited Calls', 'Weekend Rollover'],
      },
      {
        amount: 539,
        validity: '56 days',
        data: '1.5GB/day',
        description: 'Long validity with 1.5GB/day and Vi Movies & TV access.',
        benefits: ['Unlimited Calls', 'Vi Movies & TV'],
      },
      {
        amount: 699,
        validity: '84 days',
        data: '1.5GB/day',
        description: 'Extended validity with 1.5GB/day and weekend rollover.',
        benefits: ['Unlimited Calls', 'Weekend Rollover'],
      },
    ],
  },
  {
    name: 'BSNL',
    code: 'BSN',
    serviceType: 'MOBILE',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/BSNL_Logo.svg/512px-BSNL_Logo.svg.png',
    plans: [
      {
        amount: 187,
        validity: '28 days',
        data: '2GB/day',
        description: 'Value pack with 2GB/day and 100 SMS/day.',
        benefits: ['Unlimited Calls', '100 SMS/day'],
      },
      {
        amount: 297,
        validity: '54 days',
        data: '1GB/day',
        description: '54-day pack with 1GB/day and PRBT service.',
        benefits: ['Unlimited Calls', 'PRBT'],
      },
      {
        amount: 397,
        validity: '70 days',
        data: '1GB/day',
        description: 'Longer validity with 1GB daily data and 100 SMS/day.',
        benefits: ['Unlimited Calls', '100 SMS/day'],
      },
      {
        amount: 485,
        validity: '90 days',
        data: '1GB/day',
        description: '90-day pack with 1GB/day and unlimited calls.',
        benefits: ['Unlimited Calls', '100 SMS/day'],
      },
    ],
  },
  {
    name: 'Tata Play DTH',
    code: 'TPD',
    serviceType: 'DTH',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Tata_Play_Logo.svg/512px-Tata_Play_Logo.svg.png',
    plans: [],
  },
  {
    name: 'Dish TV',
    code: 'DST',
    serviceType: 'DTH',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Dish_TV_logo.svg/512px-Dish_TV_logo.svg.png',
    plans: [],
  },
  {
    name: 'Sun Direct',
    code: 'SND',
    serviceType: 'DTH',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Sun_Direct_logo.svg/512px-Sun_Direct_logo.svg.png',
    plans: [],
  },
  {
    name: 'BESCOM Electricity',
    code: 'BES',
    serviceType: 'BILL',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Lightning_icon.svg/512px-Lightning_icon.svg.png',
    plans: [],
  },
  {
    name: 'Bangalore Water Board',
    code: 'BWSSB',
    serviceType: 'BILL',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Water_drop_icon.svg/512px-Water_drop_icon.svg.png',
    plans: [],
  },
  {
    name: 'ACT Fibernet',
    code: 'ACTF',
    serviceType: 'BILL',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/ACT_Fibernet_logo.svg/512px-ACT_Fibernet_logo.svg.png',
    plans: [],
  },
  {
    name: 'Jio Data Booster',
    code: 'JIOD',
    serviceType: 'DATA',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Reliance_Jio_Logo_%282015%29.svg/512px-Reliance_Jio_Logo_%282015%29.svg.png',
    plans: [
      {
        amount: 61,
        validity: '30 days',
        data: '6GB total',
        description: 'Add-on data booster for high-speed usage.',
        benefits: ['High-speed data'],
      },
      {
        amount: 121,
        validity: '30 days',
        data: '12GB total',
        description: 'Double the data with 12GB add-on pack.',
        benefits: ['High-speed data'],
      },
      {
        amount: 222,
        validity: '30 days',
        data: '50GB total',
        description: 'Heavy usage data booster for streaming and gaming.',
        benefits: ['High-speed data'],
      },
    ],
  },
  {
    name: 'Airtel Data Booster',
    code: 'AIRD',
    serviceType: 'DATA',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Airtel_logo.svg/512px-Airtel_logo.svg.png',
    plans: [
      {
        amount: 58,
        validity: '28 days',
        data: '3GB total',
        description: 'Quick top-up for extra browsing data.',
        benefits: ['High-speed data'],
      },
      {
        amount: 98,
        validity: '28 days',
        data: '12GB total',
        description: 'Extended data for social media and streaming.',
        benefits: ['High-speed data'],
      },
      {
        amount: 301,
        validity: '90 days',
        data: '50GB total',
        description: 'Bulk data pack for remote work and learning.',
        benefits: ['High-speed data'],
      },
    ],
  },
];

const withPlanIds = (plan) => ({
  ...plan,
  id: `plan_${nanoid(8)}`,
  type: 'Prepaid',
});

const seedOperators = async () => {
  try {
    await connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/recharge_app');
    await Operator.deleteMany({});

    const operatorsWithIds = operators.map((operator) => ({
      ...operator,
      plans: operator.plans.map(withPlanIds),
    }));

    await Operator.insertMany(operatorsWithIds);
    console.log('Operator data seeded successfully');
  } catch (error) {
    console.error('Seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedOperators();
