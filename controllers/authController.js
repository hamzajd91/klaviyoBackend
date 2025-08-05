const Campaign = require("../models/campaign");
const User = require("../models/users");
const {
  generateCodes,
} = require("../services/klaviyoService");
const asyncHandler = require("express-async-handler");

// const installUrl = new URL("https://www.klaviyo.com/oauth/authorize");

const KLAVIYO_AUTHORIZATION_URL = "https://www.klaviyo.com/oauth/authorize";
const KLAVIYO_TOKEN_URL = "https://a.klaviyo.com/oauth/token";

const client_id = "09392ff5-8ebd-4f22-af3d-7f120a62c857";
const client_secret =
  "xRA-NJ-LfyGzfUXO5a5-Jr--JvCXKd_hQeb6BcjfmD6bhXZ4OcWME6DYvVCS0T0FZg54IcoAC89CaRLHSz-4rw";

// const redirect_uri = 'http://localhost:5000/oauth/klaviyo/callback'
const NODE_ENV = process.env.NODE_ENV || "development";

// const redirect_uri =
//   NODE_ENV === "development"
//     ? "http://localhost:3000/Oauth"
//     : "https://klaviyo-frontend.vercel.app/Oauth";

    redirect_uri = "https://klaviyo-frontend.vercel.app/Oauth"

const scope = "list:read campaigns:read metrics:read";

const auth = asyncHandler(async (req, res) => {
  const { codeVerifier, codeChallenge } = await generateCodes();

  try {
    const customer_id = req.params ? req.params.userId : "1234";

    if (!customer_id) {
      return res.status(400).json({ message: "userId required" });
    }

    try {
      const user = await User.findById(customer_id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user) {
        user.set("klaviyo.code_verifier", codeVerifier);
        // user.klaviyo.code_verifier = codeVerifier;
        await user.save();
      }
    } catch (err) {
      console.log("did not save");
      res.status(500).json({ error: err });
    }

    const auth_url =
      `${KLAVIYO_AUTHORIZATION_URL}?response_type=code&client_id=${client_id}` +
      `&redirect_uri=${encodeURIComponent(
        redirect_uri
      )}&scope=${encodeURIComponent(scope)}` +
      `&code_challenge_method=S256&code_challenge=${codeChallenge}&state=${customer_id}`;

    res.status(200).json({ url: auth_url });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate authorization URL" });
  }
});

// const callback = asyncHandler(async (req, res) => {
//   const { userId, code } = req.body;

//   const user = await User.findById(userId);

//   if (!user || !user.klaviyo || !user.klaviyo.code_verifier) {
//     return res.status(400).json({ error: "Code verifier not found for user" });
//   }

//   const code_verifier = user.klaviyo.code_verifier;
//   console.log(" ---------------------------- ");
//   console.log("code_verifier", code_verifier);
//   console.log("userId", userId);
//   console.log("code", code);
//   console.log(" ----------------------------2222 ");

//   try {
//     // Exchange code for token
//     const tokenResponse = await fetch(KLAVIYO_TOKEN_URL, {
//       method: "POST",
//       headers: {
//         Authorization:
//           "Basic " +
//           Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
//         "Content-Type": "application/x-www-form-urlencoded",
//       },
//       body: new URLSearchParams({
//         grant_type: "authorization_code",
//         code: code,
//         code_verifier: code_verifier,
//         redirect_uri: redirect_uri,
//       }),
//     });
//     const tokenData = await tokenResponse.json();

//     if (user && tokenData) {
//       user.klaviyo.accessToken = tokenData.access_token;
//       user.klaviyo.refreshToken = tokenData.refresh_token;
//       // user.klaviyo.refreshToken = newTokens.refresh_token || user.klaviyo.refreshToken;
//       user.klaviyo.tokenExpiry = new Date(
//         Date.now() + tokenData.expires_in * 1000
//       );
//       await user.save();

//       console.log(" -------- new user -------- ");
//       console.log(user);

//       res.status(200).json({ user: user });
//     }
//   } catch (error) {
//     console.log(error);

//     //     res.status(500).json({ error: "Failed to exchange authorization code for token" });
//   }
// });



const callback = asyncHandler(async (req, res) => {
  const { userId, code } = req.body;
  const user = await User.findById(userId);
  if (!user || !user.klaviyo || !user.klaviyo.code_verifier) {
    return res.status(400).json({ error: "Code verifier not found for user" });
  }

  const code_verifier = user.klaviyo.code_verifier;

  const tokenResponse = await fetch(KLAVIYO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      code_verifier,
      redirect_uri,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) {
    return res.status(tokenResponse.status).json(tokenData);
  }

  user.klaviyo.accessToken = tokenData.access_token;
  user.klaviyo.refreshToken = tokenData.refresh_token;
  user.klaviyo.tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
  await user.save();

  res.json({ message: "Tokens saved", user: user });
});

const refreshToken = async (userId) => {
  const user = await User.findById(userId);

  const refreshResponse = await fetch(KLAVIYO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: user.klaviyo.refreshToken,
    }),
  });
  const newTokens = await refreshResponse.json();

  console.log(" ------------- new token ------------");

  console.log(newTokens);

  if (user) {
    user.klaviyo.accessToken = newTokens.access_token;
    user.klaviyo.refreshToken =
      newTokens.refresh_token || user.klaviyo.refreshToken;
    user.klaviyo.tokenExpiry = new Date(
      Date.now() + newTokens.expires_in * 1000
    );
    await user.save();

    console.log(" ------------- new yser ------------");
    console.log(user);
  }
};

async function getValidAccessToken(userId) {
  const user = await User.findById(userId);
  if (!user || !user.klaviyo || !user.klaviyo.accessToken) {
    throw new Error("No access token found for user");
  }

  const now = Date.now();
  const expiry = new Date(user.klaviyo.tokenExpiry).getTime();

  // ✅ If still valid, return it
  if (expiry - now > 60000) {
    // 1 minute buffer
    return user.klaviyo.accessToken;
  }

  // ✅ Otherwise refresh
  console.log("Refreshing Klaviyo access token...");

  const refreshResponse = await fetch(KLAVIYO_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
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
  user.klaviyo.tokenExpiry = new Date(
    Date.now() + refreshData.expires_in * 1000
  );
  if (refreshData.refresh_token) {
    user.klaviyo.refreshToken = refreshData.refresh_token; // in case it's rotated
  }
  await user.save();

  return user.klaviyo.accessToken;
}

module.exports = {
  auth,
  callback,
  refreshToken,
  // getValidAccessToken
};

