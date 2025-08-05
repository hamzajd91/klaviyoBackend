const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.Mongo_URI;

const mongoose = require("mongoose");
const User = require("./models/users");
const Campaign = require("./models/campaign");
const bcrypt = require("bcryptjs");

const connectDB = async () => {

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");

  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
};

const ensureAdminExists = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin", salt);

    const adminExists = await User.findOne({ email: "admin@admin.com" });
    if (!adminExists) {
      await User.create({
        email: "admin@admin.com",
        password: hashedPassword,
        name: "Admin",
        active: true,
        companyName: "Admin Company",
        about: "This is the admin user.",
      });
    }
  } catch (err) {
    console.error("Error ensuring admin user exists:", err);
  }
};

// delete all users
const deleteAllUsers = async () => {
  try {
    await User.deleteMany({});
    console.log("All users deleted successfully");
  } catch (err) {
    console.error("Error deleting all users:", err);
  }
};

const changePassword = async () => {
    const newPasswordPlain = `Admin@admin123!`;
      const hashedPassword = await bcrypt.hash(newPasswordPlain, 12);
    
  try {
     await User.findByIdAndUpdate('687a9a0f524b07cb6a612be6', {
        ChangePassword: true,
        password: hashedPassword,
      });
    console.log(`Password updated ${newPasswordPlain} `);
  } catch (err) {
    console.error("Error in testDev:", err);
  }

};


module.exports = { 
  connectDB, 
  ensureAdminExists, 
  deleteAllUsers,
  changePassword
 };
