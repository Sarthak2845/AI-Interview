const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/signup', authController.RegisterUser);
router.post('/login', authController.LoginUser);
router.post('/logout', authController.logOut);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;