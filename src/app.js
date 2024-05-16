import dotenv from "dotenv";
import express from "express";
import { User } from "./models/user.model.js";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import { verifyJWT } from "./middlewares/auth.middleware.js";

dotenv.config({
  path: "./env",
});

const app = express();

app.use(express.static("public"));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded());
app.use(cookieParser());
app.set("view engine", "ejs");

const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById({ _id: userId?._id });
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};

app.get("/", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
});

// Register router
app.post("/", async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log("username :", username);
    if (!username) {
      res.send("username required");
    }
    if (!password) {
      res.send("password required");
    }

    const existedUser = await User.findOne({ username: username });

    if (existedUser) {
      return res.send("User already exist choose different username");
    }

    const user = await User.create({
      username: username.toLowerCase(),
      password,
    });
    if (user) {
      return res.render("login");
    } else {
      return res.send("Something went wrong");
    }
  } catch (error) {
    console.log("Error in register router: ", error);
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username) {
      res.send("username required");
    }

    if (!password) {
      res.send("password required");
    }

    const user = await User.findOne({ username });
    if (!user) {
      res.send("user does not exist");
    }
    console.log("user: ", user);
    const isValidPassword = await user.isPasswordCorrect(password);

    if (!isValidPassword) {
      return res.send("You have entered wrong password");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    res.cookie("accessToken", accessToken, options);
    res.cookie("refreshToken", refreshToken, options);
    res.render("home");
  } catch (error) {
    console.log("Error in login router: ", error);
  }
});

app.post("/logout", verifyJWT, async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $unset: {
      refreshToken: 1, //this removes the field from the document
    },
  });

  // cookie securities
  const options = {
    httpOnly: true,
    secure: true,
  };

  res.clearCookie("accessToken", options);
  res.clearCookie("refreshToken", options);
  res.render("login");
});

export default app;
