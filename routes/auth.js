const express = require('express');
const router = express.Router();

// Mock users (will be replaced by database in Phase 5)
const mockUsers = [
  {
    id: 1,
    name: 'Demo User',
    email: 'demo@cryptopulse.com',
    password: 'demo123'
  }
];

// GET /auth/login - Login page
router.get('/login', (req, res) => {
  // Redirect if already logged in
  if (req.session.user) {
    return res.redirect('/portfolio');
  }
  res.render('auth/login', {
    error: null,
    success: req.query.registered ? 'Account created successfully! Please login.' : null
  });
});

// POST /auth/login - Handle login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Find user in mock data
  const user = mockUsers.find(u => u.email === email && u.password === password);

  if (user) {
    // Set session
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };
    return res.redirect('/portfolio');
  }

  // Invalid credentials
  res.render('auth/login', {
    error: 'Invalid email or password',
    success: null
  });
});

// GET /auth/register - Register page
router.get('/register', (req, res) => {
  // Redirect if already logged in
  if (req.session.user) {
    return res.redirect('/portfolio');
  }
  res.render('auth/register', { error: null });
});

// POST /auth/register - Handle registration
router.post('/register', (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  // Validation
  if (!name || !email || !password || !confirmPassword) {
    return res.render('auth/register', { error: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.render('auth/register', { error: 'Passwords do not match' });
  }

  if (password.length < 6) {
    return res.render('auth/register', { error: 'Password must be at least 6 characters' });
  }

  // Check if email already exists
  const existingUser = mockUsers.find(u => u.email === email);
  if (existingUser) {
    return res.render('auth/register', { error: 'Email already registered' });
  }

  // Add new user to mock data (in Phase 5, this will be saved to database)
  const newUser = {
    id: mockUsers.length + 1,
    name,
    email,
    password // In Phase 5, this will be hashed
  };
  mockUsers.push(newUser);

  // Redirect to login with success message
  res.redirect('/auth/login?registered=true');
});

// POST /auth/logout - Handle logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

// GET /auth/logout - Handle logout (for link clicks)
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;
