// One-off seed runner: connect to DB and run createDefaultAdmin
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const connectDatabase = require('../src/config/db');
const { createDefaultAdmin } = require('../src/config/seed');

(async () => {
  try {
    await connectDatabase();
    await createDefaultAdmin();
    console.log('Seed runner finished.');
    process.exit(0);
  } catch (err) {
    console.error('Seed runner failed:', err);
    process.exit(1);
  }
})();
