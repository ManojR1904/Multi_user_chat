const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/user.js');




const router = express.Router();

// Render Login Page
router.get('/login', (req, res) => {
    res.render('login');
});

// Render Register Page
router.get('/register', (req, res) => {
    res.render('register');
});

// Handle Register Form Submission
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }

        const newUser = new User({ username, password });
        await newUser.save();
        req.session.user = newUser; // Automatically log in after registration
        res.redirect('/chat');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

// Handle Login Form Submission
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).send('Invalid credentials');
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        req.session.user = user; // Log the user in
        res.redirect('/chat');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

// Handle Logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.redirect('/login');
    });
});

module.exports = router;
