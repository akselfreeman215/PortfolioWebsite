const express = require('express');
const path = require('path');

//PO request module
const poreqRoutes = require('./poreq');

//secrets
const { getSecret, sendEmail } = require('./SecretsManager.js');

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
app.post('/submit-form', async (req, res) => {
  const { name, email, message } = req.body;
    console.log(`Form submitted: Name - ${name}, Email - ${email}, Message - ${message}`);

    try {
        await sendEmail(name, email, message);
        res.redirect('/'); // Redirect back to the homepage
    } catch (err) {
        console.error("Error sending email:", err);
        res.status(500).send("Error sending email");
    }
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Merge the functionality from poreq.js here
// Include the PO request routes under the /porequest prefix
app.use('/porequest', poreqRoutes);

// Start the server
app.listen(port, () => {
  console.log(`Main server is running at https://aksel.dev`);
});
