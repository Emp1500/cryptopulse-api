const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Mock users (will be replaced by Supabase in Layer 2)
const mockUsers = [
  {
    id: 1,
    name: 'Demo User',
    email: 'demo@cryptopulse.com',
    password: '$2b$10$nyybSbK1Cg3Pz3Qu4C4d3eAP6QcxI0rfdcxkSqRlAWfLvISlmOvYq' // bcrypt hash of 'demo123'
  }
];

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' }
});

const loginValidation = [
  body('email').trim().normalizeEmail().isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').trim().normalizeEmail().isEmail().withMessage('A valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  })
];

// GET /auth/login
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/portfolio');
  res.render('auth/login', {
    error: null,
    success: req.query.registered ? 'Account created successfully! Please login.' : null
  });
});

// POST /auth/login
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/login', { error: errors.array()[0].msg, success: null });
  }

  const { email, password } = req.body;
  const user = mockUsers.find(u => u.email === email);
  const passwordMatch = user ? await bcrypt.compare(password, user.password) : false;

  if (user && passwordMatch) {
    req.session.user = { id: user.id, name: user.name, email: user.email };
    return res.redirect('/portfolio');
  }

  res.render('auth/login', { error: 'Invalid email or password', success: null });
});

// GET /auth/register
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/portfolio');
  res.render('auth/register', { error: null });
});

// POST /auth/register
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('auth/register', { error: errors.array()[0].msg });
  }

  const { name, email, password } = req.body;

  const existingUser = mockUsers.find(u => u.email === email);
  if (existingUser) {
    return res.render('auth/register', { error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = { id: mockUsers.length + 1, name, email, password: passwordHash };
  mockUsers.push(newUser);

  res.redirect('/auth/login?registered=true');
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Error destroying session:', err);
    res.redirect('/');
  });
});

// GET /auth/logout (for link clicks)
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Error destroying session:', err);
    res.redirect('/');
  });
});

module.exports = router;
