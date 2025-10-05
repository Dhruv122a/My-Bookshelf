// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const client = require('../db');
const auth = require('../middleware/auth');
require('dotenv').config();

// --- Register a new user ---
router.post('/register', async (req, res) => {
    try {
        const { name, password } = req.body;
        const email = req.body.email ? req.body.email.trim().toLowerCase() : '';

        if (!name || !email || !password) {
            return res.status(400).json({ msg: "Name, email, and password are required." });
        }

        const userExistsResult = await client.postFind({
            db: 'users',
            selector: { email: email }
        });

        if (userExistsResult.result.docs.length > 0) {
            return res.status(400).json({ msg: "User with this email already exists." });
        }

        await client.postDocument({
            db: 'users',
            document: { name, email, password: password }
        });

        res.status(201).json({ msg: "User registered successfully." });

    } catch (err) {
        console.error("Registration error:", err);
        return res.status(500).send("Server error during registration.");
    }
});

// --- Login a user ---
router.post('/login', async (req, res) => {
    try { // <-- The missing brace was added here
        const { password } = req.body;
        const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
        
        if (!email || !password) {
            return res.status(400).json({ msg: "Email and password are required." });
        }

        const findResult = await client.postFind({
            db: 'users',
            selector: { email: email }
        });

        const user = findResult.result.docs[0];
        
        if (!user) {
            return res.status(400).json({ msg: "Invalid credentials." });
        }
        
        const isMatch = (password === user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials." });
        }

        const payload = { user: { id: user._id } };
        
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );
        
        res.json({ token });

    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).send("Server error during login.");
    }
});

// --- GET LOGGED IN USER'S INFO (PROTECTED ROUTE) ---
router.get('/me', auth, async (req, res) => {
    try {
        const userResult = await client.getDocument({
            db: 'users',
            docId: req.user.id
        });

        const user = {
            id: userResult.result._id,
            name: userResult.result.name,
            email: userResult.result.email
        };

        res.json(user);

    } catch (err) {
        console.error("Error fetching user data:", err);
        return res.status(500).send("Server Error");
    }
});

module.exports = router;