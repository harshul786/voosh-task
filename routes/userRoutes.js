const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const User = require("../models/users");

const upload = multer({
  limits: {
    fileSize: 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload correct format image!"));
    }
    cb(undefined, true);
  },
});

// ----------- start Authentication/Authorization ------------------
router.post("/signup", (req, res) => {
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  user
    .save()
    .then(async function () {
      const token = await user.generateAuthToken();
      // Response with token in body instead of cookie
      res.send({ user: user.getPublicObject(), token });
    })
    .catch((err) => res.status(400).send(err));
});

router.post("/signin", async function (req, res) {
  try {
    const user = await User.authenticateByCredentials(
      req.body.email,
      req.body.password
    );
    const token = await user.generateAuthToken();
    // Response with token in body instead of cookie
    res.send({ user: user.getPublicObject(), token });
  } catch (err) {
    res.status(400).send();
  }
});

router.post("/signout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(
      (token) => token.token != req.token
    );
    await req.user.save();
    // Direct message response, no cookie clearing
    res.send({ message: "Signed out successfully" });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/signout-all", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    // Direct message response, no cookie clearing
    res.send({ message: "Signed out from all sessions" });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/user-profile", auth, async (req, res) => {
  try {
    await User.deleteOne({ _id: req.user._id });
    res.send({ user: req.user.getPublicObject() });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.put("/reset-password", auth, async (req, res) => {
  try {
    req.user.password = req.body.password;
    await req.user.save();
    res.send({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/user-profile", auth, async (req, res) => {
  const publicObject = req.user.getPublicObject();
  res.send({ user: publicObject });
});

router.put("/edit-profile", auth, async (req, res) => {
  try {
    const updateFields = {};
    if (req.body.name) updateFields.name = req.body.name;
    if (req.body.bio) updateFields.bio = req.body.bio;
    if (req.body.email) updateFields.email = req.body.email;

    await User.findByIdAndUpdate(req.user._id, updateFields);
    res.send({ message: "Profile updated successfully" });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.post("/upload-avatar", auth, async (req, res) => {
  const url = req.body.avatarURL;
  try {
    if (!url) throw new Error("Please upload an image!");
    req.user.avatar = url;
    await req.user.save();
    res.send({
      user: req.user.getPublicObject(),
      message: "Avatar uploaded successfully!",
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

router.post("/delete-avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send({ message: "Avatar deleted successfully" });
});

router.get("/avatars/fetch", async (req, res) => {
  const { userId } = req.body;
  try {
    const userData = await User.findById(userId);
    const imageSrc = userData.avatar;
    res.send({ img: imageSrc });
  } catch (err) {
    res.status(404).send(err.message);
  }
});

module.exports = router;
