const User = require('../models/User');

async function findByEmail(email) {
  return User.findOne({ email: email.toLowerCase(), deletedAt: null });
}

async function createUser(userData) {
  const user = new User(userData);
  return user.save();
}

async function findById(id) {
  return User.findOne({ _id: id, deletedAt: null }).lean();
}

module.exports = {
  findByEmail,
  createUser,
  findById,
};
