require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stock');
const productRoutes = require('./routes/products');
const transactionRoutes = require('./routes/transactions');
const physicalCountRoutes = require('./routes/physicalCount');
const errorHandler = require('./middleware/errorHandler');
const { isAllowedCorsOrigin } = require('./utils/network');

const app = express();
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: function (origin, callback) {
      if (isAllowedCorsOrigin(origin) || origin === clientOrigin) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin || 'undefined'}`));
    },
    credentials: true,
  }),
);
app.use(morgan('dev'));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/physical-counts', physicalCountRoutes);
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'acdi-inventory-backend' });
});

app.use(errorHandler);

module.exports = app;
