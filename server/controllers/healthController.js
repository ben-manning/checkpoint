const healthCheck = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'ok',
      message: 'API is healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  healthCheck,
};
