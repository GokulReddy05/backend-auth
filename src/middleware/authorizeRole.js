const authorizeRole = (roles) => {
    return (req, res, next) => {
        const userRole = req.user.role;

        if(!roles.includes(userRole)){
            return res.status(403).json({
                message: "Forbidden: You don't have permission to access this resource"
            });
        }
        next();
    };
};


module.exports = authorizeRole;