import Operator from '../models/Operator.js';
import { SERVICE_TYPE_IDS, getServiceDefinition } from '../constants/services.js';
import { simulateNetworkDelay } from '../utils/simulator.js';

export const getOperators = async (req, res, next) => {
  try {
    await simulateNetworkDelay();
    const { serviceType } = req.query;
    const filter = {};
    if (serviceType) {
      const normalized = serviceType.toString().toUpperCase();
      if (!SERVICE_TYPE_IDS.includes(normalized)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid service type filter',
        });
      }
      filter.serviceType = normalized;
    }

    const operators = await Operator.find(filter).lean();
    const payload = operators.map((operator) => ({
      ...operator,
      service: getServiceDefinition(operator.serviceType) || null,
    }));
    return res.json({ success: true, data: payload });
  } catch (error) {
    return next(error);
  }
};

export const getOperatorPlans = async (req, res, next) => {
  try {
    await simulateNetworkDelay();
    const { code } = req.params;
    const operator = await Operator.findOne({ code: code.toUpperCase() }).lean();

    if (!operator) {
      return res.status(404).json({
        success: false,
        message: 'Operator not found',
      });
    }

    return res.json({
      success: true,
      data: operator.plans,
      meta: {
        serviceType: operator.serviceType,
        service: getServiceDefinition(operator.serviceType) || null,
      },
    });
  } catch (error) {
    return next(error);
  }
};
