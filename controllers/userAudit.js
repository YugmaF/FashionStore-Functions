const UserAudit = require('../models/userAudit');
const User = require('../models/users');

// Helper function to create audit log entries
// This function should be called from other controllers
exports.createAuditLog = async (userId, userEmail, action, req, metadata = {}, status = 'SUCCESS', errorMessage = null) => {
    try {
        const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        const auditLog = new UserAudit({
            userId,
            userEmail,
            action,
            ipAddress,
            userAgent,
            metadata,
            status,
            errorMessage
        });

        await auditLog.save();
        console.log(`Audit log created: ${action} for user ${userEmail}`);
    } catch (err) {
        // Don't throw error - audit logging should not break the main operation
        console.error('Error creating audit log:', err);
    }
};

// Get audit logs for a specific user
// Accessible by admin or the user themselves
exports.getUserAuditLogs = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Check if user is accessing their own logs or is an admin
        const isOwnLogs = req.auth && req.auth._id == userId;
        const isAdmin = req.profile && (req.profile.role === "1");

        if (!isOwnLogs && !isAdmin) {
            return res.status(403).json({
                error: 'Access denied. You can only view your own audit logs.'
            });
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Filter by action if provided
        const filter = {userId};
        if (req.query.action) {
            filter.action = req.query.action;
        }

        const auditLogs = await UserAudit.find(filter)
            .sort({createdAt: -1})
            .limit(limit)
            .skip(skip)
            .select('-__v');

        const total = await UserAudit.countDocuments(filter);

        res.json({
            logs: auditLogs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching user audit logs:', err);
        res.status(400).json({
            error: 'Unable to fetch audit logs'
        });
    }
};

// Get all audit logs (admin only)
exports.getAllAuditLogs = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};
        if (req.query.action) {
            filter.action = req.query.action;
        }
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.userId) {
            filter.userId = req.query.userId;
        }
        if (req.query.userEmail) {
            filter.userEmail = new RegExp(req.query.userEmail, 'i');
        }

        // Date range filter
        if (req.query.startDate || req.query.endDate) {
            filter.createdAt = {};
            if (req.query.startDate) {
                filter.createdAt.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                filter.createdAt.$lte = new Date(req.query.endDate);
            }
        }

        const auditLogs = await UserAudit.find(filter)
            .sort({createdAt: -1})
            .limit(limit)
            .skip(skip)
            .select('-__v')
            .populate('userId', 'name email role');

        const total = await UserAudit.countDocuments(filter);

        res.json({
            logs: auditLogs,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching all audit logs:', err);
        res.status(400).json({
            error: 'Unable to fetch audit logs'
        });
    }
};

// Get audit log statistics (admin only)
exports.getAuditStats = async (req, res) => {
    try {
        const stats = await UserAudit.aggregate([
            {
                $group: {
                    _id: '$action',
                    count: {$sum: 1}
                }
            },
            {
                $sort: {count: -1}
            }
        ]);

        const statusStats = await UserAudit.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: {$sum: 1}
                }
            }
        ]);

        res.json({
            actionStats: stats,
            statusStats: statusStats
        });
    } catch (err) {
        console.error('Error fetching audit statistics:', err);
        res.status(400).json({
            error: 'Unable to fetch audit statistics'
        });
    }
};
