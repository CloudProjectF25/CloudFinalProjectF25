const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // get token from header
    const token = req.header('x-auth-token');

    // check if no token
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'No authentication token, access denied' 
        });
    }

    try {
        // verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token has expired, please login again' 
            });
        }
        res.status(401).json({ 
            success: false,
            message: 'Invalid authentication token' 
        });
    }
};

module.exports = auth;