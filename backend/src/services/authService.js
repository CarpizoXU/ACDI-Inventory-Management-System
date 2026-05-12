const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || 'acdi-local-jwt-secret';
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production');
  }
  return secret;
}

function generateToken(user) {
  const payload = {
    sub: user._id,
    email: user.email,
    role: user.role,
  };
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';
  return jwt.sign(payload, secret, { expiresIn });
}

async function registerUser({ name, email, password, role }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    const error = new Error('Email is already registered');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  return userRepository.createUser({ name, email, passwordHash, role });
}

async function authenticateUser({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user || user.status !== 'active') {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);
  return { user, token };
}

function verifyToken(token) {
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}

module.exports = {
  authenticateUser,
  registerUser,
  verifyToken,
};
