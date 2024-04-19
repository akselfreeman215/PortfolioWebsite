// main.js
const express = require('express');
const path = require('path');

const app = express();
const port = 5000;

app.use(express.static(path.join(__dirname, 'Portfolio'), {extensions: ['html']}))

// Serve static files from the 'Portfolio' directory
app.use(express.static(path.join(__dirname, 'Portfolio')));

// Set up a route for the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Portfolio', 'home.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Main server is running at http://localhost:${port}`);
});
