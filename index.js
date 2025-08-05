const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv").config();
const { errorHandler } = require("./middlewares/errormiddleware");
const { connectDB, ensureAdminExists, deleteAllUsers, changePassword } = require("./connectDB");


connectDB();
// deleteAllUsers();
// changePassword()

const app = express();

app.use(cors());
// app.use(cors({
//   origin: 'https://your-frontend.vercel.app', 
// }));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/klaviyo", require("./routes/klaviyoRoutes"));


app.use(errorHandler);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
