const express = require('express');
const cors = require('cors');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/allocations', require('./routes/allocationRoutes'));
app.use('/api/transfers', require('./routes/transferRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/maintenance', require('./routes/maintenanceRoutes'));
app.use('/api/audits', require('./routes/auditRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/activity-logs', require('./routes/activityLogRoutes'));

app.use(notFound);
app.use(errorHandler);
module.exports = app;
