export const SERVICE_CATALOG = [
  {
    id: 'MOBILE',
    name: 'Mobile Recharge',
    identifierLabel: 'Mobile Number',
    identifierPattern: /^[6-9]\d{9}$/,
    identifierPlaceholder: 'e.g. 9876543210',
    identifierHint: 'Enter the 10-digit prepaid mobile number you want to recharge.',
    amountLabel: 'Plan amount',
    icon: '📱',
    planRequired: true,
  },
  {
    id: 'DTH',
    name: 'DTH Recharge',
    identifierLabel: 'Subscriber ID',
    identifierPattern: /^\d{6,12}$/,
    identifierPlaceholder: 'e.g. 1234567890',
    identifierHint: 'Enter the numeric subscriber ID registered with your DTH operator.',
    amountLabel: 'Recharge amount',
    icon: '📡',
    planRequired: false,
  },
  {
    id: 'BILL',
    name: 'Bill Payments',
    identifierLabel: 'Account / Consumer Number',
    identifierPattern: /^[A-Z0-9]{6,18}$/i,
    identifierPlaceholder: 'e.g. EB12345',
    identifierHint: 'Enter the account / consumer number exactly as it appears on your bill.',
    amountLabel: 'Bill amount',
    icon: '🧾',
    planRequired: false,
  },
  {
    id: 'DATA',
    name: 'Data Packs',
    identifierLabel: 'Mobile Number',
    identifierPattern: /^[6-9]\d{9}$/,
    identifierPlaceholder: 'e.g. 9876543210',
    identifierHint: 'Enter the prepaid number to top up with a data pack.',
    amountLabel: 'Data pack amount',
    icon: '📶',
    planRequired: true,
  },
];

export const SERVICE_TYPE_IDS = SERVICE_CATALOG.map((service) => service.id);

export const getServiceDefinition = (serviceType) =>
  SERVICE_CATALOG.find((service) => service.id === serviceType);
