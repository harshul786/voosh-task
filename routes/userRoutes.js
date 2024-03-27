const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const adminCheck = require("../middleware/adminCheck");
const User = require("../models/users");
const multer = require("multer");

// SignUp Route
router.post("/signup", async (req, res) => {
  try {
    const user = new User(req.body);
    if(req.body.role) user.role = req.body.role;
    if(req.body.isProfilePublic !== undefined) user.isProfilePublic = req.body.isProfilePublic;
    await user.save();
    const token = await user.generateAuthToken();
    res.status(201).send({ user: user.getPublicObject(), token });
  } catch (error) {
    res.status(400).send({error: error.message});
  }
});

// SignIn Route
router.post("/signin", async (req, res) => {
  try {
    const user = await User.authenticateByCredentials(req.body.email, req.body.password);
    const token = await user.generateAuthToken();
    res.send({ user: user.getPublicObject(), token });
  } catch (error) {
    res.status(400).send({error: error.message});
  }
});

// SignOut Route
router.post("/signout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();
    res.send({ message: "Signed out successfully" });
  } catch (error) {
    res.status(500).send({error: error.message});
  }
});

// SignOut from all sessions
router.post("/signout-all", auth, adminCheck, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send({ message: "Signed out from all sessions successfully" });
  } catch (error) {
    res.status(500).send({error: error.message});
  }
});

router.put("/reset-password", auth, async (req, res) => {
  try {
    req.user.password = req.body.password;
    await req.user.save();
    res.send({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).send({error: error.message});
  }
});

router.get("/user-profile", auth, async (req, res) => {
  const publicObject = req.user.getPublicObject();
  res.send({ user: publicObject });
});

// Delete User Profile
router.delete("/user-profile", auth, adminCheck, async (req, res) => {
  try {
    await req.user.remove();
    res.send({ message: "User profile deleted successfully" });
  } catch (error) {
    res.status(500).send({error: error.message});
  }
});

// Update User Profile
router.put("/edit-profile", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "bio", "isProfilePublic"];
  const isValidOperation = updates.every(update => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();
    res.send(req.user.getPublicObject());
  } catch (error) {
    res.status(400).send({error: error.message});
  }
});

// ------------ Avatar api -------------------

const upload = multer({
  limits: {
    fileSize: 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
      return cb(new Error("Please upload correct format image!"));
    }
    cb(undefined, true);
  },
});


async function avatarUpload(file) {
  try {
    const data = new FormData();
    const fileBlob = base64ToBlob(file.buffer.toString("base64"), file.mimeType);
    data.append("file", fileBlob);
    data.append("upload_preset", "chat-nexa");

    // Await the fetch call to ensure the promise resolves
    const response = await fetch("https://api.cloudinary.com/v1_1/harshul/image/upload", {
      method: "POST",
      body: data,
      credentials: 'omit'
    });

    const responseData = await response.json(); 
    return responseData.secure_url; 

  } catch (error) {
    console.error('Upload to Cloudinary failed:', error);
    throw error;
  }
}


function base64ToBlob(base64, mimeType) {
  const byteString = atob(base64);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

router.post("/upload-avatar", auth, upload.single("avatar"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send({ error: "Please provide an image to upload" });
  }

  try {
    const url = await avatarUpload(req.file);
    req.user.avatar = url;
    await req.user.save();

    res.send({
      url: url,
      message: "Avatar uploaded successfully!",
    });
  } catch (error) {
    console.error("Failed to upload avatar:", error);
    res.status(500).send({ error: "Failed to upload Avatar!" });
  }
});


router.delete("/delete-avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.send({ message: "Avatar deleted successfully" });
});

// Fetch User Avatar
router.get("/avatars/fetch/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.avatar) {
      throw new Error();
    }
    res.set('Content-Type', 'image/jpeg');
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send({ error: "Avatar not found." });
  }
});

// Fetch Public Profiles
router.get("/public-profiles", async (req, res) => {
  try {
    const users = await User.find({ isProfilePublic: true });
    const publicProfiles = users.map(user => user.getPublicObject());
    res.send(publicProfiles);
  } catch (e) {
    res.status(500).send({error: e.message});
  }
});

// Fetch User Profile - Adjusted for Public/Private Profiles
router.get("/user-profile/:id", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send({ message: "User from id not found." });
    }
    if (user.isProfilePublic || req.user.role === 'admin' || req.user._id.toString() === user._id.toString()) {
      res.send(user.getPublicObject());
    } else {
      res.status(403).send({ message: "Access denied." });
    }
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;

// | Endpoint                 | Method | Role         | Description                                                        | Is Public    |
// |--------------------------|--------|--------------|--------------------------------------------------------------------|--------------|
// | `/signup`                | POST   | Anyone       | Allows a new user to register.                                     | Yes          |
// | `/signin`                | POST   | Anyone       | Authenticates a user and returns a token.                          | Yes          |
// | `/signout`               | POST   | User/Admin   | Signs out a user from the current session.                         | No           |
// | `/signout-all`           | POST   | User/Admin   | Signs out a user from all sessions. Admins can sign out any user.  | No           |
// | `/user-profile`          | DELETE | Admin        | Deletes a user profile. Admins can delete any user.                | No           |
// | `/edit-profile`          | PUT    | User         | Allows a user to edit their profile details.                       | No           |
// | `/upload-avatar`         | POST   | User         | Allows a user to upload an avatar image.                           | No           |
// | `/delete-avatar`         | DELETE | User         | Allows a user to delete their avatar.                              | No           |
// | `/avatars/fetch/:id`     | GET    | Anyone       | Retrieves the avatar image for a user if the profile is public.    | Yes          |
// | `/public-profiles`       | GET    | Anyone       | Lists all user profiles that are set to public.                    | Yes          |
// | `/user-profile/:id`      | GET    | User/Admin   | Fetches a user profile. Admins can access any, users only public.  | Conditional  |
