const express = require("express");
const {registerUser,loginUser,refreshToken,logOutUser} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const {getProfile} = require("../controllers/authController");
const authorizeRole = require("../middleware/authorizeRole");
const {getAllUsers} = require("../controllers/adminController");
const { rateLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post('/register', registerUser);
router.post('/login',rateLimiter,loginUser);
router.get('/profile', authMiddleware, getProfile);
router.post('/refresh',refreshToken);
router.post('/logout',logOutUser);
router.get('/admin',authMiddleware,authorizeRole('admin'),getAllUsers);





module.exports = router;