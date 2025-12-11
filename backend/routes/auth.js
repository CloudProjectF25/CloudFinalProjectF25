const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

// @route   GET /api/auth/test
// @desc    Test auth route
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Auth route is working',
        timestamp: new Date().toISOString()
    });
});

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', [
    check('username', 'Username is required').not().isEmpty(),
    check('username', 'Username must be 3-30 characters').isLength({ min: 3, max: 30 }),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
    console.log('📝 Registration request received');
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.status(400).json({ 
            success: false,
            errors: errors.array().map(err => ({ 
                field: err.param, 
                message: err.msg 
            }))
        });
    }

    const { username, email, password } = req.body;

    try {
        console.log('🔵 Attempting to register user:', { username, email });
        
        // Check if user exists by email
        let existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            console.log('❌ Email already exists:', email);
            return res.status(400).json({ 
                success: false,
                message: 'A user with this email already exists',
                field: 'email'
            });
        }

        // Check if user exists by username
        existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('❌ Username already exists:', username);
            return res.status(400).json({ 
                success: false,
                message: 'This username is already taken',
                field: 'username'
            });
        }

        // Hash password
        console.log('Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        console.log('Creating user document...');
        const user = new User({
            username,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        // Save user to database
        console.log('Saving user to database...');
        await user.save();
        console.log('✅ User saved successfully:', user.username);

        // Create JWT payload
        const payload = {
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        };

        // Check if JWT_SECRET exists
        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET is not set in environment variables');
            return res.status(500).json({ 
                success: false,
                message: 'Server configuration error' 
            });
        }

        // Sign token
        console.log('Generating JWT token...');
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) {
                    console.error('❌ JWT signing error:', err);
                    return res.status(500).json({ 
                        success: false,
                        message: 'Error generating authentication token' 
                    });
                }
                
                console.log('✅ Registration successful for:', user.username);
                res.status(201).json({ 
                    success: true,
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        createdAt: user.createdAt
                    },
                    message: 'Registration successful!' 
                });
            }
        );

    } catch (err) {
        console.error('❌ Registration error:', err.message);
        console.error('Full error:', err);
        
        // Handle specific errors
        if (err.name === 'MongoError' && err.code === 11000) {
            // Duplicate key error
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ 
                success: false,
                message: `${field} already exists`,
                field
            });
        }
        
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(e => e.message);
            return res.status(400).json({ 
                success: false,
                message: messages.join(', ')
            });
        }
        
        // Generic server error
        res.status(500).json({ 
            success: false,
            message: 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    console.log('📝 Login request received');
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array().map(err => ({ 
                field: err.param, 
                message: err.msg 
            }))
        });
    }

    const { email, password } = req.body;

    try {
        console.log('🔵 Attempting login for email:', email);
        
        // Check if user exists
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            console.log('❌ User not found for email:', email);
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email or password',
                field: 'email'
            });
        }

        // Check password
        console.log('Checking password...');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('❌ Invalid password for user:', user.email);
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email or password',
                field: 'password'
            });
        }

        // Create JWT payload
        const payload = {
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        };

        // Check if JWT_SECRET exists
        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET is not set in environment variables');
            return res.status(500).json({ 
                success: false,
                message: 'Server configuration error' 
            });
        }

        // Sign token
        console.log('Generating JWT token...');
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) {
                    console.error('❌ JWT signing error:', err);
                    return res.status(500).json({ 
                        success: false,
                        message: 'Error generating authentication token' 
                    });
                }
                
                console.log('✅ Login successful for:', user.username);
                res.json({ 
                    success: true,
                    token,
                    user: {
                        id: user._id,
                        username: user.username,
                        email: user.email,
                        createdAt: user.createdAt
                    },
                    message: 'Login successful!' 
                });
            }
        );

    } catch (err) {
        console.error('❌ Login error:', err.message);
        console.error('Full error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error during login',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// @route   GET /api/auth/verify
// @desc    Verify token and get user data
router.get('/verify', async (req, res) => {
    const token = req.header('x-auth-token');
    
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'No token provided' 
        });
    }

    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ 
                success: false,
                message: 'Server configuration error' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        res.json({ 
            success: true,
            user 
        });
    } catch (err) {
        console.error('❌ Token verification error:', err.message);
        res.status(401).json({ 
            success: false,
            message: 'Invalid token' 
        });
    }
});

// @route   GET /api/auth/check-email/:email
// @desc    Check if email is available
router.get('/check-email/:email', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email.toLowerCase() });
        res.json({
            success: true,
            available: !user,
            email: req.params.email
        });
    } catch (err) {
        console.error('Check email error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

// @route   GET /api/auth/check-username/:username
// @desc    Check if username is available
router.get('/check-username/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        res.json({
            success: true,
            available: !user,
            username: req.params.username
        });
    } catch (err) {
        console.error('Check username error:', err);
        res.status(500).json({ 
            success: false,
            message: 'Server error' 
        });
    }
});

module.exports = router;