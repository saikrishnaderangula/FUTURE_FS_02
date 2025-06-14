const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for frontend requests
app.use(express.json()); // Parse JSON bodies

// Load API key from environment variables
const API_KEY = process.env.OPENWEATHER_API_KEY;

// Check if API key is available
if (!API_KEY) {
    console.error('Error: OPENWEATHER_API_KEY is not set in the environment variables.');
    process.exit(1); // Exit the process if API key is missing
}

// Endpoint to fetch current weather data (includes wind, pressure, sunrise/sunset)
app.get('/weather/:city', async (req, res) => {
    const city = req.params.city;
    try {
        // Validate city parameter
        if (!city || typeof city !== 'string' || city.trim() === '') {
            return res.status(400).json({ error: 'Invalid city name' });
        }

        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        console.log(`Fetched current weather for ${city}`);
        res.status(200).json(response.data);
    } catch (error) {
        console.error(`Error fetching weather data for ${city}:`, error.message);
        if (error.response && error.response.status === 404) {
            res.status(404).json({ error: 'City not found' });
        } else {
            res.status(500).json({ error: 'Error fetching weather data' });
        }
    }
});

// Endpoint to fetch 5-day forecast data (includes hourly data for "Chance of Rain")
app.get('/forecast/:city', async (req, res) => {
    const city = req.params.city;
    try {
        // Validate city parameter
        if (!city || typeof city !== 'string' || city.trim() === '') {
            return res.status(400).json({ error: 'Invalid city name' });
        }

        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        console.log(`Fetched forecast for ${city}`);
        res.status(200).json(response.data);
    } catch (error) {
        console.error(`Error fetching forecast data for ${city}:`, error.message);
        if (error.response && error.response.status === 404) {
            res.status(404).json({ error: 'City not found' });
        } else {
            res.status(500).json({ error: 'Error fetching forecast data' });
        }
    }
});

// Endpoint to fetch UV index (requires lat/lon from the weather response)
app.get('/uv/:lat/:lon', async (req, res) => {
    const { lat, lon } = req.params;
    try {
        // Validate lat and lon parameters
        if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({ error: 'Invalid latitude or longitude' });
        }

        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        console.log(`Fetched UV index for lat:${lat}, lon:${lon}`);
        res.status(200).json(response.data);
    } catch (error) {
        console.error(`Error fetching UV data for lat:${lat}, lon:${lon}:`, error.message);
        res.status(500).json({ error: 'Error fetching UV data' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Handle uncaught errors
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});