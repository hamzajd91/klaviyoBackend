// services/klaviyoAuthService.js
const User = require("../models/users");
const KLAVIYO_TOKEN_URL =  "https://a.klaviyo.com/oauth/token";
const CLIENT_ID =  "09392ff5-8ebd-4f22-af3d-7f120a62c857";
const CLIENT_SECRET = "xRA-NJ-LfyGzfUXO5a5-Jr--JvCXKd_hQeb6BcjfmD6bhXZ4OcWME6DYvVCS0T0FZg54IcoAC89CaRLHSz-4rw";


async function getValidAccessToken(userId) {
console.log(userId , '---------------');


  const user = await User.findById(userId);
//   const user = await User.findOne({ _id: userId });

  if (!user || !user.klaviyo || !user.klaviyo.accessToken) {
    throw new Error("No access token found for user");
  }

  const now = Date.now();
  const expiry = new Date(user.klaviyo.tokenExpiry).getTime();

  // ✅ If still valid, return it
  if (expiry - now > 60000) {
    return user.klaviyo.accessToken;
  }

  // ✅ Otherwise refresh
  console.log("Refreshing Klaviyo access token...");

  const refreshResponse = await fetch(KLAVIYO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: user.klaviyo.refreshToken,
    }),
  });

  const refreshData = await refreshResponse.json();
  if (!refreshResponse.ok) {
    throw new Error(`Refresh failed: ${JSON.stringify(refreshData)}`);
  }

  // ✅ Save new tokens
  user.klaviyo.accessToken = refreshData.access_token;
  user.klaviyo.tokenExpiry = new Date(Date.now() + refreshData.expires_in * 1000);
  if (refreshData.refresh_token) {
    user.klaviyo.refreshToken = refreshData.refresh_token;
  }
  await user.save();

  return user.klaviyo.accessToken;
}

module.exports = { getValidAccessToken };
