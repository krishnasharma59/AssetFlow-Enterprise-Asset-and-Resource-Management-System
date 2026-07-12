// Central error handler - keeps controllers free of try/catch boilerplate noise
// Controllers call next(err) or we wrap async routes with the asyncHandler below.

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `Duplicate value for ${field}` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid id: ${err.value}` });
  }

  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Something went wrong on the server' });
};

module.exports = { asyncHandler, notFound, errorHandler };
