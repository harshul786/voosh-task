const jwt = require("jsonwebtoken");
const User = require("../models/users");
require("dotenv").config();
const jwt_secret = process.env.JWTSECRET;

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, jwt_secret);
    console.log(decoded)

    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      throw new Error("User not found");
    }

    req.token = token;
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: e.message });
  }
};

module.exports = auth;
