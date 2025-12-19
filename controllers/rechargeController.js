import { nanoid } from 'nanoid';
import Recharge from '../models/Recharge.js';
import Operator from '../models/Operator.js';
import { getServiceDefinition } from '../constants/services.js';
import {
  determineRechargeStatus,
  determineRetryStatus,
  assignFailureReason,
  simulateNetworkDelay,
  schedulePendingResolution,
} from '../utils/simulator.js';

const DUPLICATE_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

const buildRechargeResponse = (recharge) => ({
  transactionId: recharge.transactionId,
  serviceType: recharge.serviceType || 'MOBILE',
  identifier: recharge.identifier || recharge.mobileNumber,
  mobileNumber: recharge.mobileNumber,
  operator: recharge.operator,
  plan: recharge.plan,
  amount: recharge.amount,
  status: recharge.status,
  paymentMethod: recharge.paymentMethod,
  failureReason: recharge.failureReason,
  createdAt: recharge.createdAt,
  updatedAt: recharge.updatedAt,
  resolvedAt: recharge.resolvedAt,
  retryCount: recharge.retryCount,
  parentTransactionId: recharge.parentTransactionId,
});

export const initiateRecharge = async (req, res, next) => {
  try {
    await simulateNetworkDelay();
    let { serviceType, identifier, operator, plan, amount, paymentMethod, mobileNumber } = req.body;
    // Backward compatibility for older clients sending mobileNumber only
    if (!serviceType && mobileNumber) {
      serviceType = 'MOBILE';
      identifier = mobileNumber;
    }
    const serviceDefinition = getServiceDefinition(serviceType);
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!serviceDefinition) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported service type',
      });
    }

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: `${serviceDefinition.identifierLabel || 'Identifier'} is required`,
      });
    }

    identifier = identifier.trim();
    amount = Number(amount);

    const operatorDoc = await Operator.findOne({ code: operator.code }).lean();
    if (!operatorDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid operator selected',
      });
    }

    if (operatorDoc.serviceType !== serviceDefinition.id) {
      return res.status(400).json({
        success: false,
        message: 'Operator does not support selected service type',
      });
    }

    let selectedPlan = null;
    if (serviceDefinition.planRequired) {
      selectedPlan = operatorDoc.plans.find((item) => item.id === plan?.id);
      if (!selectedPlan) {
        return res.status(400).json({
          success: false,
          message: 'Invalid plan selected for the operator',
        });
      }
    }

    if (serviceDefinition.planRequired && Number(amount) !== Number(selectedPlan.amount)) {
      return res.status(400).json({
        success: false,
        message: 'Amount does not match selected plan',
      });
    }

    const duplicateSince = new Date(Date.now() - DUPLICATE_WINDOW_MS);
    const duplicateCriteria = {
      serviceType: serviceDefinition.id,
      identifier,
      userId,
      createdAt: { $gte: duplicateSince },
      'operator.code': operatorDoc.code,
    };
    if (selectedPlan?.id) {
      duplicateCriteria['plan.id'] = selectedPlan.id;
    } else {
      duplicateCriteria.amount = amount;
    }

    const duplicate = await Recharge.findOne(duplicateCriteria).lean();

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate recharge detected. Please wait 2 minutes before retrying.',
      });
    }

    const status = determineRechargeStatus();
    const transactionId = `TXN${nanoid(10).toUpperCase()}`;
    const rechargePayload = {
      transactionId,
      serviceType: serviceDefinition.id,
      identifier,
      mobileNumber:
        serviceDefinition.id === 'MOBILE' || serviceDefinition.id === 'DATA'
          ? identifier
          : mobileNumber && /^[6-9]\d{9}$/.test(mobileNumber)
          ? mobileNumber
          : undefined,
      operator: {
        name: operatorDoc.name,
        code: operatorDoc.code,
      },
      plan: selectedPlan
        ? {
            id: selectedPlan.id,
            name: selectedPlan.name,
            validity: selectedPlan.validity,
            data: selectedPlan.data,
            description: selectedPlan.description,
          }
        : undefined,
      amount: serviceDefinition.planRequired ? Number(selectedPlan.amount) : amount,
      paymentMethod,
      status,
      userId,
    };

    if (status === 'FAILED') {
      rechargePayload.failureReason = assignFailureReason();
      rechargePayload.resolvedAt = new Date();
    }

    if (status === 'SUCCESS') {
      rechargePayload.resolvedAt = new Date();
    }

    const recharge = await Recharge.create(rechargePayload);

    if (status === 'PENDING') {
      schedulePendingResolution(transactionId, false);
    }

    return res.status(201).json({
      success: true,
      message: 'Recharge initiated successfully',
      data: {
        transactionId,
        status,
        estimatedTime: status === 'PENDING' ? '30 seconds' : undefined,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getRechargeStatus = async (req, res, next) => {
  try {
    await simulateNetworkDelay();
    const { transactionId } = req.params;
    const recharge = await Recharge.findOne({
      transactionId,
      userId: req.user?.id,
    }).lean();

    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: 'Recharge not found',
      });
    }

    return res.json({ success: true, data: buildRechargeResponse(recharge) });
  } catch (error) {
    return next(error);
  }
};

export const getRechargeHistory = async (req, res, next) => {
  try {
    await simulateNetworkDelay();
    const {
      page = 1,
      limit = 10,
      status,
      serviceType,
      identifier,
      mobileNumber,
      transactionId,
      startDate,
      endDate,
    } = req.query;

    const pageNumber = Number.parseInt(page, 10) || 1;
    const limitNumber = Number.parseInt(limit, 10) || 10;
    const filters = {
      userId: req.user?.id,
    };

    if (status) {
      filters.status = status.toUpperCase();
    }

    if (serviceType) {
      filters.serviceType = serviceType.toUpperCase();
    }

    if (identifier) {
      filters.identifier = identifier.trim();
    }

    if (mobileNumber) {
      filters.$or = [
        { mobileNumber },
        { identifier: mobileNumber.trim() },
      ];
    }

    if (transactionId) {
      filters.transactionId = transactionId.trim().toUpperCase();
    }

    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) {
        filters.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filters.createdAt.$lte = new Date(endDate);
      }
    }

    const [recharges, totalRecords] = await Promise.all([
      Recharge.find(filters)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean(),
      Recharge.countDocuments(filters),
    ]);

    const totalPages = Math.ceil(totalRecords / limitNumber) || 1;

    return res.json({
      success: true,
      data: {
        recharges: recharges.map((item) => buildRechargeResponse(item)),
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalRecords,
          hasNext: pageNumber < totalPages,
          hasPrev: pageNumber > 1,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const retryRecharge = async (req, res, next) => {
  try {
    await simulateNetworkDelay();
    const { transactionId } = req.params;
    const original = await Recharge.findOne({
      transactionId,
      userId: req.user?.id,
    });

    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Original transaction not found',
      });
    }

    if (original.status !== 'FAILED') {
      return res.status(400).json({
        success: false,
        message: 'Only failed transactions can be retried',
      });
    }

    const status = determineRetryStatus();
    const newTransactionId = `TXN${nanoid(10).toUpperCase()}`;

    const retryPayload = {
      transactionId: newTransactionId,
      serviceType: original.serviceType,
      identifier: original.identifier,
      mobileNumber: original.mobileNumber,
      operator: original.operator,
      plan: original.plan,
      amount: original.amount,
      paymentMethod: original.paymentMethod,
      status,
      parentTransactionId: original.parentTransactionId || original.transactionId,
      retryCount: original.retryCount + 1,
      userId: original.userId,
    };

    if (status === 'FAILED') {
      retryPayload.failureReason = assignFailureReason();
      retryPayload.resolvedAt = new Date();
    }

    if (status === 'SUCCESS') {
      retryPayload.resolvedAt = new Date();
    }

    const retryRechargeDoc = await Recharge.create(retryPayload);

    original.retryCount += 1;
    await original.save();

    if (status === 'PENDING') {
      schedulePendingResolution(newTransactionId, true);
    }

    return res.status(201).json({
      success: true,
      message: 'Retry initiated',
      data: {
        newTransactionId,
        parentTransactionId: retryPayload.parentTransactionId,
        status,
        estimatedTime: status === 'PENDING' ? '30 seconds' : undefined,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getRechargeSummary = async (req, res, next) => {
  try {
    await simulateNetworkDelay();

    const userFilter = { userId: req.user?.id };

    const [totalRecharges, recentRecharges, statusBreakdown, aggregates, serviceBreakdown] = await Promise.all([
      Recharge.countDocuments(userFilter),
      Recharge.find(userFilter).sort({ createdAt: -1 }).limit(5).lean(),
      Recharge.aggregate([
        { $match: userFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Recharge.aggregate([
        { $match: userFilter },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
          },
        },
      ]),
      Recharge.aggregate([
        { $match: userFilter },
        {
          $group: {
            _id: '$serviceType',
            totalTransactions: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            success: {
              $sum: {
                $cond: [{ $eq: ['$status', 'SUCCESS'] }, 1, 0],
              },
            },
            failed: {
              $sum: {
                $cond: [{ $eq: ['$status', 'FAILED'] }, 1, 0],
              },
            },
            pending: {
              $sum: {
                $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0],
              },
            },
          },
        },
        { $sort: { totalTransactions: -1 } },
      ]),
    ]);

    const totalAmount = aggregates?.[0]?.totalAmount || 0;
    const statusMap = statusBreakdown.reduce(
      (acc, bucket) => ({
        ...acc,
        [bucket._id]: bucket.count,
      }),
      {}
    );

    const successCount = statusMap.SUCCESS || 0;
    const failedCount = statusMap.FAILED || 0;
    const pendingCount = statusMap.PENDING || 0;
    const successRate = totalRecharges ? Math.round((successCount / totalRecharges) * 100) : 0;

    const services = serviceBreakdown.map((bucket) => {
      const key = bucket._id || 'MOBILE';
      const definition = getServiceDefinition(key);
      return {
        id: key,
        name: definition?.name || key,
        totalTransactions: bucket.totalTransactions,
        totalAmount: bucket.totalAmount,
        status: {
          success: bucket.success,
          failed: bucket.failed,
          pending: bucket.pending,
        },
      };
    });

    return res.json({
      success: true,
      data: {
        totalRecharges,
        totalAmount,
        successRate,
        services,
        status: {
          success: successCount,
          failed: failedCount,
          pending: pendingCount,
        },
        lastRecharge: recentRecharges[0] ? buildRechargeResponse(recentRecharges[0]) : null,
        recentRecharges: recentRecharges.map((item) => buildRechargeResponse(item)),
      },
    });
  } catch (error) {
    return next(error);
  }
};
