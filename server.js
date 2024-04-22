// server.js
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 443;

// SSL certificate options
const options = {
    key: fs.readFileSync('/etc/pki/tls/private/your_private_key.key'),
    cert: fs.readFileSync('/etc/pki/tls/certs/your_ssl_certificate.crt')
};

app.use(express.static(path.join(__dirname, 'Portfolio'), { extensions: ['html'] }));

// Serve static files from the 'Portfolio' directory
app.use(express.static(path.join(__dirname, 'Portfolio')));

// Set up a route for the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Portfolio', 'home.html'));
});

// Create HTTPS server
https.createServer(options, app).listen(port, () => {
  console.log(`Main server is running at https://www.aksel.dev`);
});
