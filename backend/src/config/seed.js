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
    // continue to ensure extra admin accounts are present
  }

  if (!existingAdmin) {
    await authService.registerUser({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });
    console.log(`Default admin account created: ${adminEmail}`);
  }


  // Create two additional admin accounts requested by the user if they don't exist
  try {
    const extraAccounts = [
      { email: 'user1@acdi.local', password: 'Acdi1Coffee', name: 'User One' },
      { email: 'user2@acdi.local', password: 'Acdi2Winter', name: 'User Two' },
    ];

    for (const acct of extraAccounts) {
      try {
        const exists = await userRepository.findByEmail(acct.email);
        if (exists) {
          console.log(`Account already exists: ${acct.email}`);
          continue;
        }

        await authService.registerUser({
          name: acct.name,
          email: acct.email,
          password: acct.password,
          role: 'admin',
        });

        console.log(`Created admin account: ${acct.email}`);
      } catch (acctErr) {
        console.warn(`Failed to create account ${acct.email}:`, acctErr.message || acctErr);
        // continue with next account
      }
    }
  } catch (err) {
    console.warn('Failed to create extra admin accounts:', err.message || err);
  }
}

module.exports = {
  createDefaultAdmin,
};
