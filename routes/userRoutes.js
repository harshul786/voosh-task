const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/users");
const multer = require("multer");

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

const avatarUpload = async (file) => {
  if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
    throw new Error("Unsupported file type");
  }

  try {
    const data = new FormData();
    data.append("file", fs.createReadStream(file.path));
    data.append("upload_preset", "chat-nexa");
    const { default: fetch } = await import("node-fetch");
    const response = await fetch(
      "https://api.cloudinary.com/v1_1/harshul/image/upload",
      {
        method: "POST",
        body: data,
      }
    );

    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.message || "Failed to upload image");
    }
    return json.url;
  } catch (error) {
    throw error; // Re-throw the error to be caught by the calling function
  }
};

router.post(
  "/upload-avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    try {
      if (!req.file) {
        throw new Error("Please provide an image to upload");
      }
      console.log(req.file);
      const url = await avatarUpload(req.file);
      req.user.avatar = url;
      await req.user.save();
      res.send({
        user: req.user.getPublicObject(),
        message: "Avatar uploaded successfully!",
      });
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  }
);

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
