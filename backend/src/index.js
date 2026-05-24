const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDatabase = require('./config/db');
const { createDefaultAdmin } = require('./config/seed');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();
    await createDefaultAdmin();
    app.listen(PORT, () => {
      console.log(`ACDI Inventory backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start backend:', error);
    process.exit(1);
  }
}

startServer();
