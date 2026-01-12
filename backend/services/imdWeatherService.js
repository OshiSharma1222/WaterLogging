const axios = require('axios');
const supabase = require('../config/supabase');
const { getWardCoordinates } = require('../data/wardCoordinates');

/**
 * Weather Service
 * Integrates with OpenWeather API (primary) and IMD API (optional) for real-time weather data
 */
class WeatherService {
    constructor(io) {
        this.io = io;
        this.updateInterval = null;
        
        // Primary: OpenWeather API (faster, easier to get)
        this.openWeatherApiKey = process.env.OPENWEATHER_API_KEY;
        this.openWeatherUrl = 'https://api.openweathermap.org/data/2.5';
        
        // Optional: IMD API (can be used as backup)
        this.imdApiKey = process.env.IMD_API_KEY;
        this.imdApiUrl = process.env.IMD_API_URL || 'https://api.mausam.imd.gov.in';
        
        // Cache for weather data by grid cell to reduce API calls
        this.weatherCache = new Map();
        this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
    }

    /**
     * Start fetching real weather data
     */
    start() {
        console.log('Weather Service started (Primary: OpenWeather API)');
        
        // Initial update
        this.updateWeatherData();
        
        // Update every 15 minutes (IMD data typically updates every 15-30 minutes)
        this.updateInterval = setInterval(() => {
            this.updateWeatherData();
        }, 15 * 60 * 1000); // 15 minutes
    }

    /**
     * Fetch and update weather data from IMD or OpenWeather
     */
    async updateWeatherData() {
        try {
            console.log('Fetching weather data from API...');
            
            // Use OpenWeather API as primary source (faster and reliable)
            // Falls back to IMD if OpenWeather fails, then simulation if both fail
            const weatherData = this.openWeatherApiKey 
                ? await this.fetchOpenWeatherData()
                : this.imdApiKey 
                ? await this.fetchIMDData()
                : this.generateSimulatedData();
            
            if (weatherData) {
                await this.updateWardsWithWeatherData(weatherData);
            }
        } catch (error) {
            console.error('Error updating weather data:', error.message);
            this.io.emit('error', { 
                type: 'weather_update_failed', 
                message: error.message 
            });
        }
    }

    /**
     * Fetch data from IMD API
     */
    async fetchIMDData() {
        if (!this.imdApiKey) {
            console.warn('IMD API key not configured');
            return null;
        }

        try {
            // IMD API endpoint for Delhi region
            // Note: Actual IMD API structure may vary - adjust based on documentation
            const response = await axios.get(`${this.imdApiUrl}/rainfall/current`, {
                headers: {
                    'Authorization': `Bearer ${this.imdApiKey}`,
                    'Content-Type': 'application/json'
                },
                params: {
                    region: 'Delhi',
                    city: 'New Delhi'
                },
                timeout: 10000
            });

            console.log('IMD data fetched successfully');
            
            return {
                source: 'IMD',
                rainfall: response.data.rainfall_mm || 0,
                forecast_3h: response.data.forecast_3h || 0,
                forecast_24h: response.data.forecast_24h || 0,
                humidity: response.data.humidity,
                temperature: response.data.temperature,
                timestamp: new Date(response.data.timestamp || Date.now())
            };
        } catch (error) {
            console.error('IMD API error:', error.message);
            return null;
        }
    }

    /**
     * Fetch data from OpenWeather API (fallback)
     */
    async fetchOpenWeatherData() {
        if (!this.openWeatherApiKey) {
            console.warn('No weather API keys configured. Using simulation mode.');
            return this.generateSimulatedData();
        }

        try {
            // Current weather
            const currentResponse = await axios.get(`${this.openWeatherUrl}/weather`, {
                params: {
                    q: 'Delhi,IN',
                    appid: this.openWeatherApiKey,
                    units: 'metric'
                },
                timeout: 10000
            });

            // Forecast data
            const forecastResponse = await axios.get(`${this.openWeatherUrl}/forecast`, {
                params: {
                    q: 'Delhi,IN',
                    appid: this.openWeatherApiKey,
                    units: 'metric'
                },
                timeout: 10000
            });

            // Extract rainfall from current and forecast
            const currentRain = currentResponse.data.rain?.['1h'] || 0;
            const forecast3h = forecastResponse.data.list[0]?.rain?.['3h'] || 0;

            console.log('OpenWeather data fetched successfully');

            return {
                source: 'OpenWeather',
                rainfall: currentRain,
                forecast_3h: forecast3h,
                humidity: currentResponse.data.main.humidity,
                temperature: currentResponse.data.main.temp,
                clouds: currentResponse.data.clouds.all,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('OpenWeather API error:', error.message);
            // Try IMD as fallback if available
            if (this.imdApiKey) {
                console.log('🔄 Trying IMD API as fallback...');
                return await this.fetchIMDData();
            }
            return this.generateSimulatedData();
        }
    }

    /**
     * Fetch weather for specific lat/lon coordinates
     * Uses caching to reduce API calls
     */
    async fetchWeatherForLocation(lat, lon) {
        const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
        
        // Check cache first
        if (this.weatherCache.has(cacheKey)) {
            const cached = this.weatherCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }
        
        try {
            const response = await axios.get(`${this.openWeatherUrl}/weather`, {
                params: {
                    lat: lat,
                    lon: lon,
                    appid: this.openWeatherApiKey,
                    units: 'metric'
                },
                timeout: 5000
            });
            
            const weatherData = {
                source: 'OpenWeather',
                rainfall: response.data.rain?.['1h'] || 0,
                forecast_3h: response.data.rain?.['3h'] || response.data.rain?.['1h'] || 0,
                humidity: response.data.main.humidity,
                temperature: response.data.main.temp,
                clouds: response.data.clouds?.all || 0,
                description: response.data.weather?.[0]?.description || '',
                timestamp: new Date()
            };
            
            // Cache the result
            this.weatherCache.set(cacheKey, {
                data: weatherData,
                timestamp: Date.now()
            });
            
            return weatherData;
        } catch (error) {
            // Return null to use fallback
            return null;
        }
    }

    /**
     * Generate simulated data when no API is available
     */
    generateSimulatedData() {
        console.log('🔄 Using simulated weather data');
        
        const baseRainfall = Math.random() * 10;
        return {
            source: 'Simulation',
            rainfall: baseRainfall,
            forecast_3h: baseRainfall + (Math.random() * 20),
            humidity: 60 + Math.random() * 30,
            temperature: 25 + Math.random() * 10,
            timestamp: new Date()
        };
    }

    /**
     * Update all wards with weather data
     */
    async updateWardsWithWeatherData(weatherData) {
        try {
            // Get all wards
            const { data: wards, error } = await supabase
                .from('wards')
                .select('*');

            if (error) throw error;

            if (!wards || wards.length === 0) {
                console.warn('No wards found in database');
                return;
            }

            let updatedCount = 0;
            
            // Group wards by approximate grid cells to reduce API calls
            const gridCells = new Map();
            
            for (const ward of wards) {
                const coords = getWardCoordinates(ward.name, ward.zone);
                // Round to 1 decimal place for grid cell
                const gridKey = `${coords.lat.toFixed(1)},${coords.lon.toFixed(1)}`;
                
                if (!gridCells.has(gridKey)) {
                    gridCells.set(gridKey, {
                        lat: coords.lat,
                        lon: coords.lon,
                        wards: []
                    });
                }
                gridCells.get(gridKey).wards.push(ward);
            }
            
            console.log(`Grouped ${wards.length} wards into ${gridCells.size} grid cells`);

            // Fetch weather for each grid cell
            for (const [gridKey, cell] of gridCells) {
                let cellWeather = weatherData; // Use base weather as fallback
                
                // Try to fetch weather for this specific location
                if (this.openWeatherApiKey) {
                    try {
                        const gridWeather = await this.fetchWeatherForLocation(cell.lat, cell.lon);
                        if (gridWeather) {
                            cellWeather = gridWeather;
                        }
                    } catch (err) {
                        // Use base weather data
                    }
                }
                
                // Update all wards in this grid cell
                for (const ward of cell.wards) {
                    // Add variation within grid cell based on ward characteristics
                    const variation = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
                    let wardRainfall = cellWeather.rainfall * variation;
                    let wardForecast = cellWeather.forecast_3h * variation;
                    
                    // Create a hash based on ward name for consistent calculations
                    let wardHash = 0;
                    for (let i = 0; i < ward.name.length; i++) {
                        wardHash = ((wardHash << 5) - wardHash) + ward.name.charCodeAt(i);
                        wardHash = wardHash & wardHash;
                    }
                    const normalizedHash = Math.abs(wardHash % 100) / 100;

                    // Calculate base risk level and MPI score locally first
                    const threshold = ward.failure_threshold || 60;
                    const riskPercent = Math.max(wardRainfall, wardForecast) / threshold;
                    const waterLoggingReports = ward.drainage_stress_index || Math.floor(Math.abs(wardHash) % 15);
                    const potholeCount = ward.pothole_density || Math.floor(Math.abs(wardHash) % 10);
                    
                    let newRiskLevel = 'safe';
                    let newMpiScore = 100;
                    
                    // Try to get MPI prediction from ML model API (with rate limiting)
                    // Only call API for wards with significant rainfall to avoid overloading
                    if (wardRainfall > 1 || wardForecast > 5) {
                        try {
                            const mpiPrediction = await this.getMPIPrediction(
                                Math.max(wardRainfall, wardForecast),
                                waterLoggingReports,
                                potholeCount
                            );
                            
                            if (mpiPrediction) {
                                // API returns mpi_score as risk indicator (0-1), convert to preparedness (0-100)
                                newMpiScore = Math.round((1 - mpiPrediction.mpi_score) * 100);
                                
                                // Map risk level from API
                                const apiRiskLevel = mpiPrediction.risk_level.toLowerCase();
                                if (apiRiskLevel === 'high' || apiRiskLevel === 'critical') {
                                    newRiskLevel = 'critical';
                                } else if (apiRiskLevel === 'medium' || apiRiskLevel === 'moderate') {
                                    newRiskLevel = 'alert';
                                } else {
                                    newRiskLevel = 'safe';
                                }
                            }
                        } catch (mpiError) {
                            // Use fallback calculation
                        }
                    }
                    
                    // Fallback: If API didn't provide data, use local calculation
                    if (newMpiScore === 100 && (wardRainfall > 0.1 || wardForecast > 0.1)) {
                        if (riskPercent > 0.7 || wardRainfall > 40) {
                            newRiskLevel = 'critical';
                            newMpiScore = Math.max(10, 30 - Math.round(riskPercent * 20));
                        } else if (riskPercent > 0.3 || wardRainfall > 15) {
                            newRiskLevel = 'alert';
                            newMpiScore = Math.max(30, 70 - Math.round(riskPercent * 30));
                        } else if (wardRainfall > 0.1) {
                            newMpiScore = Math.max(70, 100 - Math.round(riskPercent * 30));
                        }
                    }

                    // Update database
                    const { error: updateError } = await supabase
                        .from('wards')
                        .update({
                            current_rainfall: Math.round(wardRainfall * 10) / 10,
                            forecast_rainfall_3h: Math.round(wardForecast * 10) / 10,
                            risk_level: newRiskLevel,
                            mpi_score: Math.round(newMpiScore),
                            last_updated: new Date()
                        })
                        .eq('id', ward.id);

                    if (!updateError) {
                        updatedCount++;
                        
                        // Emit individual ward update
                        this.io.emit('ward-update', {
                            wardId: ward.id,
                            wardName: ward.name,
                            rainfall: Math.round(wardRainfall * 10) / 10,
                            forecast: Math.round(wardForecast * 10) / 10,
                            riskLevel: newRiskLevel,
                            mpiScore: Math.round(newMpiScore),
                            temperature: cellWeather.temperature,
                            humidity: cellWeather.humidity,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }

            console.log(`Weather data updated: ${updatedCount}/${wards.length} wards`);
            console.log(`Source: ${weatherData.source} | Base Rainfall: ${weatherData.rainfall.toFixed(1)}mm | Temperature: ${weatherData.temperature?.toFixed(1) || 'N/A'}°C`);
            
            // Emit bulk refresh event
            this.io.emit('data-refresh', {
                type: 'weather',
                source: weatherData.source,
                count: updatedCount,
                rainfall: weatherData.rainfall,
                forecast: weatherData.forecast_3h,
                timestamp: new Date().toISOString()
            });

            // Check for critical conditions and create alerts
            await this.checkAndCreateAlerts(wards, weatherData);

        } catch (error) {
            console.error('Error updating wards:', error.message);
            throw error;
        }
    }

    /**
     * Get MPI prediction from ML model API
     * @param {number} rainfall - Current/forecast rainfall in mm
     * @param {number} waterLoggingReports - Number of waterlogging reports
     * @param {number} potholeCount - Number of potholes in the ward
     * @returns {Object} - { mpi_score, risk_level }
     */
    async getMPIPrediction(rainfall, waterLoggingReports, potholeCount) {
        try {
            const response = await axios.post(
                'https://delhi-flood-api.onrender.com/predict',
                {
                    rainfall: rainfall,
                    water_logging_reports: waterLoggingReports,
                    pothole_count: potholeCount
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 8000
                }
            );
            
            if (response.data && response.data.mpi_score !== undefined) {
                console.log(`🤖 MPI API: rainfall=${rainfall.toFixed(1)}, score=${response.data.mpi_score.toFixed(2)}, risk=${response.data.risk_level}`);
                return {
                    mpi_score: response.data.mpi_score,
                    risk_level: response.data.risk_level
                };
            }
            return null;
        } catch (error) {
            // Don't log every error to avoid spam - API might be slow for many requests
            return null;
        }
    }

    /**
     * Check conditions and create alerts if needed
     */
    async checkAndCreateAlerts(wards, weatherData) {
        try {
            const criticalWards = wards.filter(w => w.risk_level === 'critical');
            
            if (criticalWards.length > 0 && weatherData.forecast_3h > 30) {
                const wardNames = criticalWards.map(w => w.name).join(', ');
                
                // Create alert in database
                const { error } = await supabase
                    .from('alerts')
                    .insert({
                        severity: 'high',
                        message: `Heavy rainfall alert: ${weatherData.forecast_3h.toFixed(1)}mm expected. Critical risk in ${criticalWards.length} wards.`,
                        affected_wards: criticalWards.map(w => w.id),
                        expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000) // 3 hours
                    });

                if (!error) {
                    this.io.emit('alert-new', {
                        severity: 'high',
                        message: `Heavy rainfall expected in: ${wardNames}`,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        } catch (error) {
            console.error('Error creating alerts:', error.message);
        }
    }

    /**
     * Stop the weather service
     */
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            console.log('Weather Service stopped');
        }
    }

    /**
     * Get current weather status
     */
    async getStatus() {
        return {
            configured: !!(this.openWeatherApiKey || this.imdApiKey),
            primary: this.openWeatherApiKey ? 'OpenWeather' : (this.imdApiKey ? 'IMD' : 'Simulation'),
            fallback: this.imdApiKey ? 'IMD' : 'Simulation',
            updateInterval: '15 minutes',
            lastUpdate: new Date()
        };
    }
}

module.exports = WeatherService;
