const express = require("express");
const http = require("http");
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./api-docs.yaml');
const User = require("./models/users");
const session = require('express-session');

const app = express();

const userRoutes = require("./routes/userRoutes");
const oauthRoutes = require("./routes/oauthRoutes")

require("./mongoose/index").connect();

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use('/public', express.static('public'));

const options = {
  customJs: '/public/custom.js'
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, options));

app.get("/api/test", (req, res) => {
  res.send("testing");
});

app.use("/api/", userRoutes);

//-------- oauth -------------

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, cb) => {
    // Here, you would find or create a user in your database
    // Example:
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
        // Set additional fields as needed
      });
      await user.save();
    }
    return cb(null, user);
  }
));

// Serialize and deserialize user instances to and from the session.
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

app.use(session({ secret: 'secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use("", oauthRoutes);


// ------------------ Deployment ----------------------

app.listen(3000, () => {
  console.log("server started on port 3000");
});
