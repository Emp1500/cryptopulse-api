// Authentication middleware

// Check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  res.redirect('/auth/login');
};

// Check if user is NOT logged in (for login/register pages)
const isNotAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  res.redirect('/portfolio');
};

module.exports = {
  isAuthenticated,
  isNotAuthenticated
};
