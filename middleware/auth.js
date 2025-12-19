import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT secret not configured');
    }

    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.sub || decoded.id).lean();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token',
      });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: user.role,
    };
    req.token = token;

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

export default auth;
