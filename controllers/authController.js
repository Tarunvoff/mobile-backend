import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';

const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '7d';

const buildUserResponse = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  mobileNumber: user.mobileNumber,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const createToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret not configured');
  }

  return jwt.sign({ sub: userId }, secret, { expiresIn: TOKEN_EXPIRY });
};

export const signup = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((error) => ({ field: error.param, message: error.msg })),
      });
    }

    const { name, email, mobileNumber, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { mobileNumber }],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Account with provided email or mobile already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      mobileNumber,
      passwordHash,
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: buildUserResponse(user),
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map((error) => ({ field: error.param, message: error.msg })),
      });
    }

    const { identifier, password } = req.body;

    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { mobileNumber: identifier };

    const user = await User.findOne(query);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = createToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: buildUserResponse(user),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const me = async (req, res) => {
  return res.json({
    success: true,
    data: req.user,
  });
};
