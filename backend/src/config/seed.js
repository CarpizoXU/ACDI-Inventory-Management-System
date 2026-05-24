const userRepository = require('../repositories/userRepository');
const authService = require('../services/authService');

async function createDefaultAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'ACDI Admin';

  if (!adminEmail || !adminPassword) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD is not configured. Skipping default admin creation.');
    return;
  }

  const existingAdmin = await userRepository.findByEmail(adminEmail);
  if (existingAdmin) {
    console.log(`Default admin already exists: ${adminEmail}`);
    return;
  }

  await authService.registerUser({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
  });

  console.log(`Default admin account created: ${adminEmail}`);
}

module.exports = {
  createDefaultAdmin,
};
