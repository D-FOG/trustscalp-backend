const jwt = require('jsonwebtoken');
const Admin = require('../models/admin.model');

const authAdmin = async (req, res, next) => {
    const token = req.header('Authorization').split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        const id = decoded.id.toString();
        const admin = await Admin.findOne({ _id: id });
        console.log(decoded.id);
        console.log(id);
        console.log(admin);

        if (!admin) {
            return res.status(403).json({ message: 'Access denied, admin only' });
        }

        req.adminId = decoded.id;
        console.log(req.adminId);
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authAdmin;
