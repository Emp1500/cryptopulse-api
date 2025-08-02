const express = require('express');
const app = express();
const path = require('path');

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Always needed for EJS
app.use(express.static(path.join(__dirname, 'public'))); // For serving CSS, images etc.

// Routes
app.get('/', (req, res) => {
  res.render('index');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
