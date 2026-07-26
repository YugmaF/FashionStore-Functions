const express = require('express');
const router = express.Router();

const {getUserAuditLogs, getAllAuditLogs, getAuditStats} = require('../controllers/userAudit');
const {getUserById} = require('../controllers/user');
const {requiredSignin, isAuth, isAdmin} = require('../controllers/auth');

// Get audit logs for a specific user (user themselves or admin)
router.get('/audit/user/:userId', requiredSignin, getUserById, isAuth, getUserAuditLogs);

// Get all audit logs (admin only)
router.get('/audit/logs', requiredSignin, getUserById, isAdmin, getAllAuditLogs);

// Get audit statistics (admin only)
router.get('/audit/stats', requiredSignin, getUserById, isAdmin, getAuditStats);

module.exports = router;
