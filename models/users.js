const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const jwt_secret = process.env.JWTSECRET;

// Helper function to validate image URLs
function isValidImageUrl(url) {
  // Basic check for URL structure and common image file extensions
  return validator.isURL(url, {
      protocols: ['http','https'],
      require_protocol: true
  }) && /\.(jpg|jpeg|png|gif)$/.test(url);
}

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
      lowercase: true,
      validate: {
        validator: async function(email) {
          if (!validator.isEmail(email)) {
            throw new Error('Email is invalid');
          }
        },
        message: props => `${props.value} is not a valid email or is already in use!` // Custom message
      },
    },
    bio: {
      type: String,
    },
    password: {
      type: String,
      // required: true,
      // validate(val) {
      //   if (val.length < 6) {
      //     throw Error("Password too short!");
      //   }
      // },
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
      validate: {
        validator: function(v) {
          return v === '' || isValidImageUrl(v); // Allow empty string or valid image URL
        },
        message: props => `${props.value} is not a valid image URL!`
      },
    },
    role: {
      type: String,
      lowercase: true,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isProfilePublic: {
      type: Boolean,
      default: true,
    },
    googleId: {
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

  const token = jwt.sign({ _id: user._id.toString() }, jwt_secret, {
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
