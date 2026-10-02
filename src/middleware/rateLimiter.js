const rateLimit = require("express-rate-limit");

const rateLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 5,
    message: {
        message: "Too many login attempts. Please try again later."
    },
    standardHeaders: "draft-8",
    legacyHeaders: false
});

module.exports = { rateLimiter };