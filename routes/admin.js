const express = require('express');
const router = express.Router();
const { requiredSignin, isAuth, isAdmin } = require('../controllers/auth');
const { getUserById } = require('../controllers/user');
const { deleteDatabase } = require('../controllers/admin');

router.delete('/admin/database/:userId', requiredSignin, isAuth, isAdmin, deleteDatabase);

router.param('userId', getUserById);

module.exports = router;
