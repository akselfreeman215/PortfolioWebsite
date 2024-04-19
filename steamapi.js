// steamSearch.js
const express = require('express');
const axios = require('axios');

const app = express();
const port = 5000; // Use the same port as the main website

// Set up a route for the Steam search page
app.get('/SteamSearch', async (req, res) => {
  try {
    // Fetch data from the Steam Web API
    const response = await axios.get(`https://api.steampowered.com/ISteamApps/GetAppList/v2/`);
    const apps = response.data.applist.apps;

    // Render a template with the fetched data
    res.send(`Steam Search Results: ${apps.length} games found.`);
  } catch (error) {
    console.error('Error fetching top games:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Steam search server is running at http://localhost:${port}/SteamSearch`);
});
