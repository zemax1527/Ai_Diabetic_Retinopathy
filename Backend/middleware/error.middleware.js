function errorMiddleware(err, req, res, next) {
    let statusCode = err.statusCode || 500;

    if (err.name === 'ValidationError' || err.name === 'CastError') {
        statusCode = 400;
    }

    res.status(statusCode).json({
        status: err.status || 'failed',
        message: err.message || 'Internal Server Error'
    });
}

module.exports = errorMiddleware;
