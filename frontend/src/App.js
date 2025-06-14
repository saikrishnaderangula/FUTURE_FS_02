import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
    const [city, setCity] = useState('');
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [dailyForecast, setDailyForecast] = useState([]);
    const [uvIndex, setUvIndex] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [error, setError] = useState('');
    const [showFavorites, setShowFavorites] = useState(false);

    useEffect(() => {
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }, [favorites]);

    const fetchWeather = async () => {
        try {
            const weatherResponse = await axios.get(`http://localhost:5000/weather/${city}`);
            setWeather(weatherResponse.data);

            const { lat, lon } = weatherResponse.data.coord;
            const uvResponse = await axios.get(`http://localhost:5000/uv/${lat}/${lon}`);
            setUvIndex(uvResponse.data.value);

            const forecastResponse = await axios.get(`http://localhost:5000/forecast/${city}`);
            const forecastList = forecastResponse.data.list;

            const hourlyForecast = forecastList.slice(0, 4).map(item => ({
                ...item,
                pop: Math.round(item.pop * 100)
            }));
            setForecast(hourlyForecast);

            const dailyForecastData = [];
            let currentDate = null;
            for (let item of forecastList) {
                const itemDate = new Date(item.dt_txt).toLocaleDateString();
                if (itemDate !== currentDate) {
                    dailyForecastData.push(item);
                    currentDate = itemDate;
                }
                if (dailyForecastData.length === 5) break;
            }
            setDailyForecast(dailyForecastData);
            setError('');
        } catch (err) {
            setError('City not found. Please try again.');
            setWeather(null);
            setForecast([]);
            setDailyForecast([]);
            setUvIndex(null);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (city) fetchWeather();
    };

    const addToFavorites = () => {
        if (weather && !favorites.includes(weather.name)) {
            setFavorites([...favorites, weather.name]);
        }
    };

    const removeFromFavorites = (cityToRemove) => {
        setFavorites(favorites.filter((fav) => fav !== cityToRemove));
    };

    const fetchFavoriteWeather = (favCity) => {
        setCity(favCity);
        fetchWeather();
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };

    const getWeatherIcon = (iconCode) => {
        switch (iconCode) {
            case '01d':
            case '01n':
                return '☀️';
            case '02d':
            case '02n':
                return '⛅';
            case '03d':
            case '03n':
            case '04d':
            case '04n':
                return '☁️';
            case '09d':
            case '09n':
            case '10d':
            case '10n':
                return '🌧️';
            case '11d':
            case '11n':
                return '⛈️';
            case '13d':
            case '13n':
                return '❄️';
            case '50d':
            case '50n':
                return '🌫️';
            default:
                return '🌤️';
        }
    };

    // Convert wind direction (degrees) to cardinal direction
    const getWindDirection = (degrees) => {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    };

    return (
        <div className="App">
            {/* Heading and Subtitle */}
            <div className="app-header">
                <h1 className="app-title">Weather Dashboard</h1>
                <p className="app-subtitle">Your Daily Weather Insights</p>
            </div>

            <div className="header">
                <div className="date">
                    <h1>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h1>
                    <p>{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <form onSubmit={handleSearch} className="search-container">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        placeholder="Search location here"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="search-input"
                    />
                </form>
                {weather && (
                    <div className="location">
                        <h2>{weather.name}, {weather.sys.country}</h2>
                        <p>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                    </div>
                )}
            </div>

            {error && <p className="error">{error}</p>}

            <div className="main-content">
                {/* Today Overview */}
                {weather && (
                    <div className="card overview">
                        <h3>Today Overview</h3>
                        <div className="overview-content">
                            <div className="overview-item">
                                <span className="icon">🌬️</span>
                                <p>Wind Speed</p>
                                <h4>{(weather.wind.speed * 3.6).toFixed(0)}km/h</h4>
                                <p className="change">-{((weather.wind.speed * 3.6) - 10).toFixed(0)}km/h</p>
                            </div>
                            <div className="overview-item">
                                <span className="icon">💧</span>
                                <p>Rain Chance</p>
                                <h4>{weather.clouds.all}%</h4>
                                <p className="change">-{weather.clouds.all - 10}%</p>
                            </div>
                            <div className="overview-item">
                                <span className="icon">💦</span>
                                <p>Humidity</p>
                                <h4>{weather.main.humidity}%</h4>
                                <p className="change">-{weather.main.humidity - 5}%</p>
                            </div>
                            <div className="overview-item">
                                <span className="icon">🌡️</span>
                                <p>Feels Like</p>
                                <h4>{Math.round(weather.main.feels_like)}°C</h4>
                                <p className="change">-{Math.round(weather.main.feels_like) - 2}°C</p>
                            </div>
                            <div className="temp">
                                <h2>{Math.round(weather.main.temp)}°C</h2>
                                <p>{weather.weather[0].description}</p>
                                <button className="fav-button" onClick={addToFavorites}>
                                    Add to Favorites
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Additional Details */}
                {weather && uvIndex && (
                    <div className="card details">
                        <h3>Details</h3>
                        <div className="details-content">
                            <div className="details-item">
                                <span className="icon">🌊</span>
                                <p>Pressure</p>
                                <h4>{weather.main.pressure} hpa</h4>
                                <p className="change">-{weather.main.pressure - 700} hpa</p>
                            </div>
                            <div className="details-item">
                                <span className="icon">☀️</span>
                                <p>UV Index</p>
                                <h4>{uvIndex}</h4>
                                <p className="change">-{uvIndex - 2}</p>
                            </div>
                            <div className="details-item">
                                <span className="icon">👁️‍🗨️</span>
                                <p>Visibility</p>
                                <h4>{(weather.visibility / 1000).toFixed(1)} km</h4>
                                <p className="change">-{((weather.visibility / 1000) - 1).toFixed(1)} km</p>
                            </div>
                            <div className="details-item">
                                <span className="icon">🧭</span>
                                <p>Wind Direction</p>
                                <h4>{getWindDirection(weather.wind.deg)}</h4>
                                <p className="change">No change</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Chance of Rain */}
                {forecast.length > 0 && (
                    <div className="card rain-chance">
                        <h3>Chance of Rain</h3>
                        <div className="rain-list">
                            {forecast.map((item, index) => (
                                <div key={index} className="rain-item">
                                    <p className="rain-time">{new Date(item.dt_txt).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}</p>
                                    <div className="rain-circle">
                                        <svg className="progress-ring" width="80" height="80">
                                            <circle
                                                className="progress-ring-bg"
                                                cx="40"
                                                cy="40"
                                                r="36"
                                                stroke="#e0e0e0"
                                                strokeWidth="8"
                                                fill="transparent"
                                            />
                                            <circle
                                                className="progress-ring-fill"
                                                cx="40"
                                                cy="40"
                                                r="36"
                                                stroke="url(#gradient)"
                                                strokeWidth="8"
                                                fill="transparent"
                                                strokeDasharray={`${2 * Math.PI * 36}`}
                                                strokeDashoffset={`${2 * Math.PI * 36 * (1 - item.pop / 100)}`}
                                            />
                                            <defs>
                                                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#007bff" />
                                                    <stop offset="100%" stopColor="#00ddeb" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="rain-percentage">{item.pop}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Next 5 Days Weather Conditions */}
                {dailyForecast.length > 0 && (
                    <div className="card forecast">
                        <h3>Next 5 Days Weather Conditions</h3>
                        <div className="forecast-list">
                            {dailyForecast.map((item, index) => (
                                <div key={index} className="forecast-item">
                                    <div className="forecast-date">
                                        <p>{new Date(item.dt_txt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '\/')}</p>
                                    </div>
                                    <div className="forecast-icon">
                                        <span>{getWeatherIcon(item.weather[0].icon)}</span>
                                    </div>
                                    <div className="forecast-details">
                                        <p className="temp">{Math.round(item.main.temp)}°C</p>
                                        <p className="description">{item.weather[0].description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sunrise & Sunset */}
                {weather && (
                    <div className="card sunrise-sunset">
                        <h3>Sunrise & Sunset</h3>
                        <p>{weather ? `${weather.name}, ${weather.sys.country}` : 'Tegal'}</p>
                        <div className="sun-times">
                            <div className="sun-item">
                                <span className="icon">🌅</span>
                                <p>Sunrise</p>
                                <h4>{formatTime(weather.sys.sunrise)}</h4>
                            </div>
                            <div className="sun-item">
                                <span className="icon">🌇</span>
                                <p>Sunset</p>
                                <h4>{formatTime(weather.sys.sunset)}</h4>
                            </div>
                        </div>
                    </div>
                )}

                {/* Favorite Cities */}
                <div className="card favorites">
                    <h3 className="toggle-header" onClick={() => setShowFavorites(!showFavorites)}>
                        Favorite Cities {showFavorites ? '▲' : '▼'}
                    </h3>
                    {showFavorites && favorites.length > 0 && (
                        <ul>
                            {favorites.map((fav, index) => (
                                <li key={index}>
                                    <span onClick={() => fetchFavoriteWeather(fav)}>{fav}</span>
                                    <button onClick={() => removeFromFavorites(fav)}>Remove</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;