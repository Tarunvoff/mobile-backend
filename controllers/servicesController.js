import { SERVICE_CATALOG } from '../constants/services.js';
import { simulateNetworkDelay } from '../utils/simulator.js';

export const listServices = async (req, res, next) => {
  try {
    await simulateNetworkDelay();
    const services = SERVICE_CATALOG.map(
      ({ id, name, icon, identifierLabel, identifierPlaceholder, identifierHint, amountLabel, planRequired }) => ({
        id,
        name,
        icon,
        identifierLabel,
        identifierPlaceholder,
        identifierHint,
        amountLabel,
        planRequired,
      })
    );
    return res.json({ success: true, data: services });
  } catch (error) {
    return next(error);
  }
};

export default { listServices };
