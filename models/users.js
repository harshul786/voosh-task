const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const jwt_secret = process.env.JWTSECRET;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate(val) {
        if (!validator.isEmail(val)) {
          throw Error("Not a valid Email Address!");
        }
      },
    },
    bio: {
      type: String,
    },
    password: {
      type: String,
      required: true,
      validate(val) {
        if (val.length < 6) {
          throw Error("Password too short!");
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

userSchema.methods.getPublicObject = function () {
  const userObject = this.toObject();

  delete userObject.password;
  delete userObject.tokens;

  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;

  const token = jwt.sign({ _id: user._id.toString() }, "jwt-auth", {
    expiresIn: "7 days",
  });
  user.tokens = user.tokens.concat({ token });
  user.save();

  return token;
};

userSchema.statics.authenticateByCredentials = async (email, password) => {
  const user = await User.findOne({ email: email });

  if (!user) {
    throw new Error("Invalid Email or Password!");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid Email or Password!");
  }

  return user;
};

// middleware
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    try {
      user.password = await bcrypt.hash(user.password, 8);
    } catch (err) {
      console.log(err);
    }
  }

  next();
});

const User = mongoose.model("Users", userSchema);

module.exports = User;
