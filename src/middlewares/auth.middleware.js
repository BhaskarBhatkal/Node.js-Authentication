import { User } from "../models/user.model.js";

import jwt from "jsonwebtoken";

export const verifyJWT = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.send("You cannot logout");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRETE);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return res.send("Invalid User");
    }
    console.log("User from authentication: ", user);

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(500, error?.message || "Something went wrong");
  }
};
