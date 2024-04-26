// portfolio.js
const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const port = 80;

// Middleware to parse the body of the request
app.use(express.urlencoded({ extended: true }));

//serve html files without the extension
app.use(express.static(path.join(__dirname, 'Portfolio'), {extensions: ['html']}))

// Set up a route for the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Portfolio', 'home.html'));
});

// Route to handle form submission
app.post('/submit-form', (req, res) => {
  const { name, email, message } = req.body;
  console.log(`Form submitted: Name - ${name}, Email - ${email}, Message - ${message}`);
  res.redirect('/'); // Redirect back to the homepage
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Start the server
app.listen(port, () => {
  console.log(`Main server is running at https://www.aksel.dev`);
});