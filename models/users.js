const mongoose = require("mongoose");
const { getMatrixKey } = require("../services/klaviyoService");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    companyName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    active: { type: Boolean, default: false },
    // userType: { type: String, enum: ["admin", "user"], default: "user" },
    klaviyo: {
      accessToken: String,
      matrixKey: String,
      tokenExpiry: Date,
      integrationStatus: Boolean,
    },
    profilePicture: { type: String },
    about: { type: String },
    newsletterSub: { type: Boolean, required: false },
    cookies: { type: Boolean, required: false },
    planType: { type: String, required: false },
    timezone: { type: String, required: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
