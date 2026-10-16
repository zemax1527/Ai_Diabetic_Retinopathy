const userModel = require('../models/user.model');
const AppError = require('../utils/app.error');
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token || (
      req.headers?.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null
    );
    if (!token) {
      throw new AppError('Authentication required', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await userModel.findById(decoded._id);

    if (!user) {
      throw new AppError('User not found', 401);
    }

    // Paths that an authenticated user can access even if verification is pending or profile is incomplete
    const allowInactivePaths = ['/me', '/profile', '/complete-profile', '/logout'];
    const currentPath = req.path.toLowerCase();
    const isAllowedInactive = allowInactivePaths.some(p => currentPath === p || currentPath.endsWith(p));

    if (!user.isActive && !isAllowedInactive) {
      throw new AppError('User account is pending verification or inactive', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;