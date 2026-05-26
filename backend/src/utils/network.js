const os = require('os');

function isPrivateIPv4(address) {
  return /^10\./.test(address)
    || /^192\.168\./.test(address)
    || /^172\.(1[6-9]|2\d|3[0-1])\./.test(address);
}

function getLocalIPv4Addresses() {
  const addresses = new Set();

  const networkInterfaces = os.networkInterfaces();

  Object.values(networkInterfaces).forEach((interfaces) => {
    (interfaces || []).forEach((entry) => {
      if (entry.family === 'IPv4' && !entry.internal && isPrivateIPv4(entry.address)) {
        addresses.add(entry.address);
      }
    });
  });

  return [...addresses];
}

function getPrimaryLocalIPv4() {
  return getLocalIPv4Addresses()[0] || 'localhost';
}

function getAllowedOrigins() {
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const localOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

  const networkOrigins = getLocalIPv4Addresses().map((address) => `http://${address}:5173`);

  return [...new Set([...configuredOrigins, ...localOrigins, ...networkOrigins])];
}

function getLocalNetworkUrls(frontendPort = 5173, backendPort = 5000) {
  const host = getPrimaryLocalIPv4();

  return {
    backend: `http://${host}:${backendPort}`,
    frontend: `http://${host}:${frontendPort}`,
  };
}

function isAllowedCorsOrigin(origin) {
  if (!origin) {
    return true;
  }

  try {
    const parsedOrigin = new URL(origin);
    const host = parsedOrigin.hostname;

    if (host === 'localhost' || host === '127.0.0.1') {
      return true;
    }

    if (isPrivateIPv4(host)) {
      return true;
    }

    return getAllowedOrigins().includes(origin);
  } catch (error) {
    return false;
  }
}

module.exports = {
  getAllowedOrigins,
  getLocalIPv4Addresses,
  getLocalNetworkUrls,
  getPrimaryLocalIPv4,
  isAllowedCorsOrigin,
};
