const express = require('express');
const router = express.Router();
const passport = require('passport');

// Trigger Google OAuth flow
router.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

// Google OAuth callback URL
router.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    // Successful authentication, redirect home.
    try {
      // Assuming req.user is the authenticated user instance
      // Generate JWT token for the user
      const token = await req.user.generateAuthToken();
      
      // Assuming your User model has a method to get a sanitized public user object
      const userObject = req.user.getPublicObject();
      
      // Send the user object and token in response
      res.json({ user: userObject, token });
    } catch (error) {
      console.error('Error generating token or fetching user object', error);
      res.status(500).send('Internal Server Error');
    }
  });

module.exports = router;
