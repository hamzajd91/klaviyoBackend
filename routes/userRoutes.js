const express = require('express');
const router = express.Router();
const asyncHandler = require("express-async-handler");
const { protect } = require('../middlewares/authMiddleware');


const {
  registerUser,
  loginUser,
  updateUserProfile,
  deleteUser,
  deleteAllUsers,
  getUsers,
  resetPassword
} = require('../controllers/usercontrollers');


router.post('/signup', registerUser);
router.post('/signin', loginUser);
router.post('/reset-password', resetPassword);
router.get('/all', getUsers);
router.put('/:id', protect, updateUserProfile);
router.delete('/:id', protect, deleteUser);
router.delete('/deleteUsers',protect, asyncHandler(deleteAllUsers));

module.exports = router;
