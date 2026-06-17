const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/database');
const logger = require('../config/logger');

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

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return res.render('auth/login', { error: 'Invalid email or password', success: null });
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    return res.render('auth/login', { error: 'Invalid email or password', success: null });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email };
  res.redirect('/portfolio');
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

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return res.render('auth/register', { error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { error } = await supabase
    .from('users')
    .insert([{ name, email, password_hash: passwordHash }]);

  if (error) {
    logger.error(`Registration DB error: ${error.message}`);
    return res.render('auth/register', { error: 'Registration failed. Please try again.' });
  }

  res.redirect('/auth/login?registered=true');
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) logger.error(`Session destroy error: ${err}`);
    res.redirect('/');
  });
});

// GET /auth/logout (for link clicks)
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) logger.error(`Session destroy error: ${err}`);
    res.redirect('/');
  });
});

module.exports = router;
