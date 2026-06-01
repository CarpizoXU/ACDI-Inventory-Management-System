const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDatabase = require('./config/db');
const { createDefaultAdmin } = require('./config/seed');
const { getLocalNetworkUrls, getPrimaryLocalIPv4 } = require('./utils/network');

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT) || 5173;

async function startServer() {
  try {
    await connectDatabase();
    await createDefaultAdmin();

    app.listen(PORT, HOST, () => {
      const localIp = getPrimaryLocalIPv4();
      const urls = getLocalNetworkUrls(FRONTEND_PORT, PORT);

      console.log(`\nACDI Inventory backend running on ${HOST}:${PORT}`);
      console.log(`Backend local URL: http://localhost:${PORT}`);
      console.log(`Backend local network URL: ${urls.backend}`);
      console.log(`Frontend local network URL: ${urls.frontend}`);
      console.log(`Host IPv4 address: ${localIp}`);
      console.log(`Open this on another device: http://${localIp}:${FRONTEND_PORT}`);
      console.log('If the frontend is not reachable from another device, allow inbound traffic on ports 5173 and 5000 in Windows Firewall.\n');
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}

startServer();
