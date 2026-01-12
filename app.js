// ===================================
// DELHI MONSOON DASHBOARD - JavaScript
// Real-time Data Simulation & Interactivity
// ===================================

// === API CONFIGURATION ===
// Backend (incidents, alerts, legacy wards if needed)
const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// New MPI model API (flood prediction + infrastructure)
const MPI_API_BASE_URL = 'https://delhi-flood-api.onrender.com';

// === GLOBAL STATE ===
let currentFilters = {
    ward: 'all',
    risk: 'all',
    incident: 'all',
    time: 'live'
};

let activeLayers = {
    rainfall: true,
    drainage: true,
    incidents: true,
    traffic: false
};

// Map instance
let map = null;
let wardLayer = null;
let incidentLayer = null;
let heatLayer = null;

// WebSocket
let socket = null;

// === MOCK DATA GENERATION ===
const wardNames = [
    'Central Delhi - 1', 'Central Delhi - 2', 'Central Delhi - 3',
    'North Delhi - 1', 'North Delhi - 2', 'North Delhi - 3', 'North Delhi - 4',
    'South Delhi - 1', 'South Delhi - 2', 'South Delhi - 3', 'South Delhi - 4',
    'East Delhi - 1', 'East Delhi - 2', 'East Delhi - 3', 'East Delhi - 4',
    'West Delhi - 1', 'West Delhi - 2', 'West Delhi - 3', 'West Delhi - 4',
    'New Delhi', 'Shahdara', 'Rohini', 'Dwarka', 'Najafgarh', 'Narela'
];

function generateWardData() {
    return wardNames.map((name, index) => {
        const mpiScore = Math.floor(Math.random() * 100);
        const currentRainfall = Math.floor(Math.random() * 80);
        const forecastRainfall = Math.floor(Math.random() * 120);
        const threshold = 50 + Math.floor(Math.random() * 50);

        let status = 'ready';
        if (mpiScore < 40) status = 'critical';
        else if (mpiScore < 70) status = 'risk';

        let riskLevel = 'safe';
        const riskPercentage = (forecastRainfall / threshold) * 100;
        if (riskPercentage > 70) riskLevel = 'critical';
        else if (riskPercentage > 30) riskLevel = 'alert';

        return {
            id: index + 1,
            name: name,
            zone: name.split(' - ')[0],
            mpiScore: mpiScore,
            status: status,
            currentRainfall: currentRainfall,
            forecastRainfall: forecastRainfall,
            threshold: threshold,
            riskLevel: riskLevel,
            drainageStress: Math.floor(Math.random() * 100),
            potholeDensity: Math.floor(Math.random() * 100),
            incidents: Math.floor(Math.random() * 15)
        };
    });
}

let wardsData = generateWardData();

function generateIncidents(count = 12) {
    const types = ['waterlogging', 'pothole', 'drainage'];
    const statuses = ['verified', 'pending', 'verified', 'verified'];
    const incidents = [];

    for (let i = 0; i < count; i++) {
        const ward = wardsData[Math.floor(Math.random() * wardsData.length)];
        const hoursAgo = Math.floor(Math.random() * 3);
        const minutesAgo = Math.floor(Math.random() * 60);

        incidents.push({
            id: i + 1,
            type: types[Math.floor(Math.random() * types.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            ward: ward.name,
            time: hoursAgo === 0 ? `${minutesAgo} min ago` : `${hoursAgo}h ${minutesAgo}m ago`,
            severity: Math.floor(Math.random() * 3) + 1,
            description: 'Field-reported incident'
        });
    }

    return incidents;
}

let incidentsData = generateIncidents();

// === INITIALIZE DASHBOARD ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌧️ Delhi Monsoon Dashboard Initializing...');

    initializeClock();
    initializeFilters();
    initializeLayerToggles();
    initializeTabs();
    initializeMap();
    renderIncidents();
    renderActionCenter();
    initializeExport();

    // Set initial MPI status
    updateMPIStatus('connecting', 'Connecting to MPI Model...');

    // Simulate real-time updates every 30 seconds
    setInterval(() => {
        updateRealTimeData();
    }, 30000);

    console.log('Dashboard Ready!');
});

// === MPI STATUS INDICATOR ===
function updateMPIStatus(status, message) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('mpiStatusText');
    const lastUpdate = document.getElementById('lastUpdateTime');
    
    if (statusDot) {
        statusDot.className = 'status-dot ' + status;
    }
    if (statusText) {
        statusText.textContent = message;
    }
    if (lastUpdate && status === 'connected') {
        lastUpdate.textContent = 'Updated: ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
}

function updateLastRefreshTime() {
    const lastUpdate = document.getElementById('lastUpdateTime');
    if (lastUpdate) {
        lastUpdate.textContent = 'Updated: ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }
}

// === CLOCK ===
function initializeClock() {
    function updateClock() {
        const now = new Date();
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        document.getElementById('currentTime').textContent = now.toLocaleString('en-IN', options);
    }

    updateClock();
    setInterval(updateClock, 1000);
    
    // Also fetch current weather
    fetchCurrentWeather();
    setInterval(fetchCurrentWeather, 5 * 60 * 1000); // Update every 5 minutes
}

// === FETCH CURRENT DELHI WEATHER ===
async function fetchCurrentWeather() {
    // Set default/fallback values immediately
    document.getElementById('currentTemp').textContent = '16°C';
    document.getElementById('currentHumidity').textContent = '23%';
    
    try {
        console.log('Fetching current weather for Delhi...');
        const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=Delhi,IN&appid=ddde8ef4269b37e3e15bbb3c0ad027791&units=metric', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) {
            console.warn(`Weather API returned ${response.status} - using fallback data`);
            return; // Keep default values
        }
        
        const data = await response.json();
        console.log(' Weather data received:', data);
        
        if (data.main) {
            document.getElementById('currentTemp').textContent = `${Math.round(data.main.temp)}°C`;
            document.getElementById('currentHumidity').textContent = `${data.main.humidity}%`;
            
            // Update weather icon based on conditions - select first icon in live-weather
            const weatherIcon = document.querySelector('.live-weather i:first-child');
            if (weatherIcon && data.weather && data.weather[0]) {
                const weatherMain = data.weather[0].main.toLowerCase();
                if (weatherMain.includes('rain')) {
                    weatherIcon.className = 'fas fa-cloud-rain';
                } else if (weatherMain.includes('cloud')) {
                    weatherIcon.className = 'fas fa-cloud';
                } else if (weatherMain.includes('clear')) {
                    weatherIcon.className = 'fas fa-sun';
                } else {
                    weatherIcon.className = 'fas fa-cloud-sun';
                }
            }
        }
    } catch (error) {
        console.warn('Weather fetch error:', error.message, '- using fallback data');
        // Keep default values already set
    }
}

// === FILTERS ===
function initializeFilters() {
    const filterIds = ['wardFilter', 'riskFilter', 'incidentFilter', 'timeFilter'];

    filterIds.forEach(id => {
        const filter = document.getElementById(id);
        if (filter) {
            filter.addEventListener('change', (e) => {
                const filterType = id.replace('Filter', '');
                currentFilters[filterType] = e.target.value;
                applyFilters();
            });
        }
    });
}

function applyFilters() {
    console.log('Applying filters:', currentFilters);

    // Filter wards data
    let filteredWards = wardsData;

    if (currentFilters.ward !== 'all') {
        filteredWards = filteredWards.filter(w => w.zone.toLowerCase().includes(currentFilters.ward));
    }

    if (currentFilters.risk !== 'all') {
        filteredWards = filteredWards.filter(w => w.riskLevel === currentFilters.risk);
    }

    // Re-render with filtered data
    renderMPIDashboard(filteredWards);
}

// === LAYER TOGGLES ===
function initializeLayerToggles() {
    const layers = ['rainfall', 'drainage', 'incidents', 'traffic'];

    layers.forEach(layer => {
        const toggle = document.getElementById(`${layer}Layer`);
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                activeLayers[layer] = e.target.checked;
                updateMapLayers();
            });
        }
    });
}

function updateMapLayers() {
    console.log('Active layers:', activeLayers);
    // In a real app, this would show/hide map layers
    // For now, just log the state
}

// === TABS ===
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const panelName = btn.getAttribute('data-panel');
            switchPanel(panelName);
        });
    });
}

function switchPanel(panelName) {
    // Remove active class from all tabs and panels
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.panel-content').forEach(panel => panel.classList.remove('active'));

    // Add active class to selected tab and panel
    document.querySelector(`[data-panel="${panelName}"]`).classList.add('active');
    document.getElementById(`panel-${panelName}`).classList.add('active');
}

// === MAP INITIALIZATION ===
function initializeMap() {
    const mapElement = document.getElementById('riskMap');

    // Remove loading message
    mapElement.innerHTML = '';

    // Initialize Leaflet map centered on Delhi
    map = L.map('riskMap', {
        center: [28.6139, 77.2090], // Delhi coordinates
        zoom: 11,
        zoomControl: false,
        minZoom: 10,
        maxZoom: 16
    });

    // Add base tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        opacity: 0.7
    }).addTo(map);

    // Add zoom control to top right
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // Initialize layers
    wardLayer = L.layerGroup().addTo(map);
    incidentLayer = L.layerGroup().addTo(map);

    // Load ward data and render
    loadWardData();

    // Set up real-time updates
    initializeWebSocket();

    // Map controls
    document.getElementById('zoomIn')?.addEventListener('click', () => map.zoomIn());
    document.getElementById('zoomOut')?.addEventListener('click', () => map.zoomOut());
    document.getElementById('resetView')?.addEventListener('click', () => {
        map.setView([28.6139, 77.2090], 11);
    });
}

// === LOAD WARD DATA FROM MPI MODEL API ===
async function loadWardData() {
    try {
        console.log(' Loading ward data from MPI model API...');
        updateMPIStatus('refreshing', 'Fetching MPI Data...');
        
        // First, try to get current weather data from local backend
        let weatherData = { rain_1h: 0, rain_3h: 0, rain_6h: 0, rain_24h: 0, rain_forecast_3h: 0 };
        try {
            const weatherRes = await fetch(`${API_BASE_URL}/wards`);
            if (weatherRes.ok) {
                const wards = await weatherRes.json();
                if (wards && wards.length > 0) {
                    // Aggregate rainfall from local backend wards
                    const avgRainfall = wards.reduce((sum, w) => sum + (w.current_rainfall || 0), 0) / wards.length;
                    weatherData = {
                        rain_1h: avgRainfall,
                        rain_3h: avgRainfall * 2,
                        rain_6h: avgRainfall * 3,
                        rain_24h: avgRainfall * 5,
                        rain_forecast_3h: avgRainfall * 1.5
                    };
                    console.log('📦 Weather data from local backend:', weatherData);
                }
            }
        } catch (e) {
            console.log('⚠️ Local weather not available, using defaults:', e.message);
        }

        const url = `${MPI_API_BASE_URL}/api/predict/all`;
        console.log('MPI API URL:', url);

        // POST request with actual or default rainfall values with 30 second timeout
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rainfall: weatherData
            }),
            signal: AbortSignal.timeout(30000) // 30 second timeout for initial request
        });

        if (!response.ok) {
            throw new Error(`HTTP error from MPI API! status: ${response.status}`);
        }

        const result = await response.json();

        console.log(' MPI API Response:', result);
        console.log(' Wards array length:', result.wards?.length);

        if (!result.wards || !Array.isArray(result.wards) || result.wards.length === 0) {
            throw new Error('No wards data received from MPI API');
        }

        // Fetch detailed ward info for each ward (static features, historical, infra)
        // Fetch details for all wards in parallel batches
        const wardDetailsMap = new Map();
        const wardIds = result.wards.map(w => w.ward_id);
        
        // Fetch all ward details (in batches to avoid overwhelming the API)
        const batchSize = 50;
        for (let i = 0; i < wardIds.length; i += batchSize) {
            const batch = wardIds.slice(i, i + batchSize);
            const detailPromises = batch.map(async (wardId) => {
                try {
                    const detailRes = await fetch(`${MPI_API_BASE_URL}/api/wards/${wardId}`);
                    if (detailRes.ok) {
                        const detail = await detailRes.json();
                        wardDetailsMap.set(wardId, detail);
                    }
                } catch (e) {
                    // Silent fail for individual ward details
                }
            });
            await Promise.all(detailPromises);
        }
        
        console.log(`📋 Fetched details for ${wardDetailsMap.size} wards`);

        // Map MPI API wards into the internal wardsData structure used by the UI
        wardsData = result.wards.map((w, index) => {
            const riskLevel = (w.risk_level || '').toLowerCase();
            const probability = Number(w.probability ?? 0);

            // Get detailed ward info if available
            const details = wardDetailsMap.get(w.ward_id) || {};
            const staticFeatures = details.static_features || {};
            const historicalFeatures = details.historical_features || {};

            // Use MPI score from API if available, otherwise derive from probability
            // The ML model returns probability (0-1), which represents flood risk
            // MPI Score = probability * 100 (0-100 scale)
            const mpiScore = w.mpi_score !== undefined 
                ? Math.round(w.mpi_score) 
                : Math.round(probability * 100);

            // Map risk label from API directly
            let mappedRiskLevel = 'safe';
            if (riskLevel === 'critical') mappedRiskLevel = 'critical';
            else if (riskLevel === 'high') mappedRiskLevel = 'critical';
            else if (riskLevel === 'moderate') mappedRiskLevel = 'alert';
            else if (riskLevel === 'low') mappedRiskLevel = 'safe';

            // Format ward name nicely - use ward_id with zone prefix
            const wardId = w.ward_id || '';
            const zoneCode = wardId.slice(-1); // Last character (E, N, S, W, C)
            const zoneMap = { 'E': 'East Delhi', 'N': 'North Delhi', 'S': 'South Delhi', 'W': 'West Delhi', 'C': 'Central Delhi' };
            const zone = zoneMap[zoneCode] || 'Delhi';
            
            // Create a meaningful ward name from ID
            const wardNumber = wardId.replace(/[A-Z]/g, '');
            const wardName = `${zone} - Ward ${wardNumber}`;

            // Get infrastructure metrics from static/historical features
            // Use actual data when available, otherwise generate realistic values based on probability
            const drainDensity = staticFeatures.drain_density ?? (0.3 + Math.random() * 0.5);
            const lowLyingPct = staticFeatures.low_lying_pct ?? (probability * 50 + Math.random() * 20);
            
            // Drainage stress inversely related to drain density, higher for high-risk wards
            const drainageStress = Math.max(0, Math.min(100, Math.round(
                (1 - drainDensity) * 60 + probability * 40 + (Math.random() * 10 - 5)
            )));

            // Pothole/complaint density from historical data or based on risk
            const floodFreq = historicalFeatures.hist_flood_freq ?? (probability * 10);
            const complaintBaseline = historicalFeatures.complaint_baseline ?? 0;
            const potholes = Math.max(5, Math.min(100, Math.round(
                complaintBaseline > 0 ? complaintBaseline : 
                (floodFreq * 8 + probability * 30 + Math.random() * 15)
            )));

            // Get rainfall values - use from prediction response or weather data
            const currentRainfall = Number(w.rain_1h ?? weatherData.rain_1h ?? 0);
            const forecastRainfall = Number(w.rain_3h ?? weatherData.rain_3h ?? 0);

            // Calculate failure threshold based on ward characteristics
            const failureThreshold = lowLyingPct > 30 
                ? Math.max(30, Math.round(50 - lowLyingPct / 4))
                : Math.max(40, Math.round(70 - (lowLyingPct / 3)));

            return {
                // Preserve existing fields that UI expects
                id: wardId || index + 1,
                name: wardName,
                zone: zone,

                // Core MPI / risk
                mpi_score: mpiScore,
                risk_level: mappedRiskLevel,
                probability: probability,

                // Rainfall from prediction or weather service
                current_rainfall: currentRainfall,
                forecast_rainfall_3h: forecastRainfall,

                // Explanation text from model
                explanation: w.explanation || '',

                // Static features from ward details
                area_sqkm: staticFeatures.area_sqkm || null,
                drain_density: drainDensity,
                mean_elevation: staticFeatures.mean_elevation || null,
                low_lying_pct: lowLyingPct,

                // Historical features
                hist_flood_freq: floodFreq,
                monsoon_risk_score: historicalFeatures.monsoon_risk_score || (probability * 80),

                // Infrastructure metrics - now with realistic values
                drainage_stress_index: drainageStress,
                pothole_density: potholes,

                // Failure threshold based on ward characteristics
                failure_threshold: failureThreshold,

                // Timestamp
                last_updated: result.timestamp || new Date().toISOString()
            };
        });

        console.log(`✅ Loaded ${wardsData.length} wards from MPI model API`);
        console.log('Sample ward data (mapped):', wardsData[0]);

        updateMapWithWards(wardsData);
        updateStatistics(wardsData);

        console.log(' Rendering UI components...');
        console.log(' WardsData count:', wardsData.length);
        console.log(' Sample ward:', JSON.stringify(wardsData[0], null, 2));

        // Render MPI dashboard, alerts, and infrastructure AFTER data is loaded
        renderMPIDashboard();
        console.log(' MPI Dashboard rendered');
        
        renderAlerts();
        console.log(' Alerts rendered');
        
        renderInfrastructure();
        console.log(' Infrastructure rendered');
        
        // Update MPI status to connected
        updateMPIStatus('connected', `MPI Model: ${wardsData.length} wards`);
        updateLastRefreshTime();
    } catch (error) {
        console.error(' Error loading ward data from MPI API:', error);
        console.error('Error details:', error.message);
        
        // Update status to show connecting/retrying
        updateMPIStatus('connecting', 'Waking up MPI Server...');
        
        // Try to wake up the server (Render free tier sleeps after inactivity)
        console.log('MPI API might be sleeping. Waking up server...');
        
        try {
            // Wake up server with multiple attempts
            console.log('⏳ Attempt 1: Pinging health endpoint...');
            await fetch(`${MPI_API_BASE_URL}/api/health`, { 
                method: 'GET',
                signal: AbortSignal.timeout(30000) // 30 second timeout for wake up
            });
            
            console.log('✅ Server is awake! Retrying data fetch in 3 seconds...');
            
            // Wait and retry with longer timeout
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('🔄 Retry attempt: Fetching ward data...');
            const retryResponse = await fetch(`${MPI_API_BASE_URL}/api/predict/all`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rainfall: { rain_1h: 0, rain_3h: 0, rain_6h: 0, rain_24h: 0, rain_forecast_3h: 0 }
                }),
                signal: AbortSignal.timeout(30000) // 30 second timeout
            });
            
            if (retryResponse.ok) {
                const result = await retryResponse.json();
                if (result.wards && result.wards.length > 0) {
                    console.log(`✅ SUCCESS! Loaded ${result.wards.length} wards from MPI API`);
                    
                    // Process and map the wards data
                    wardsData = result.wards.map((w, index) => {
                        const mpiScore = w.mpi_score !== undefined ? Math.round(w.mpi_score) : Math.round((w.probability ?? 0) * 100);
                        const riskLevel = (w.risk_level || '').toLowerCase();
                        let mappedRiskLevel = 'safe';
                        if (riskLevel === 'critical' || riskLevel === 'high') mappedRiskLevel = 'critical';
                        else if (riskLevel === 'moderate') mappedRiskLevel = 'alert';
                        
                        const wardId = w.ward_id || '';
                        const zoneCode = wardId.slice(-1);
                        const zoneMap = { 'E': 'East Delhi', 'N': 'North Delhi', 'S': 'South Delhi', 'W': 'West Delhi', 'C': 'Central Delhi' };
                        const zone = zoneMap[zoneCode] || 'Delhi';
                        const wardNumber = wardId.replace(/[A-Z]/g, '');
                        const wardName = `${zone} - ${wardNumber}`;
                        
                        return {
                            id: wardId || index + 1,
                            name: wardName,
                            zone: zone,
                            mpi_score: mpiScore,
                            risk_level: mappedRiskLevel,
                            probability: w.probability ?? 0,
                            current_rainfall: w.rain_1h ?? 0,
                            forecast_rainfall_3h: w.rain_3h ?? 0,
                            explanation: w.explanation || '',
                            drainage_stress_index: Math.round(Math.random() * 80),
                            pothole_density: Math.round(Math.random() * 60),
                            failure_threshold: 60,
                            last_updated: result.timestamp || new Date().toISOString()
                        };
                    });
                    
                    updateMapWithWards(wardsData);
                    updateStatistics(wardsData);
                    renderMPIDashboard();
                    renderAlerts();
                    renderInfrastructure();
                    
                    // Update MPI status to connected after retry success
                    updateMPIStatus('connected', `MPI Model: ${wardsData.length} wards`);
                    updateLastRefreshTime();
                    return;
                }
            }
            
            throw new Error('Retry failed to get valid data');
            
        } catch (wakeError) {
            console.error('❌ Could not wake up server or fetch data:', wakeError.message);
            console.log('📦 Falling back to demo data...');
            updateMPIStatus('error', 'Using Demo Data');
            useDemoData();
        }
    }
}

// === USE DEMO DATA IF API FAILS ===
function useDemoData() {
    // Create demo data with actual Delhi locations
    wardsData = [
        { id: 1, name: 'Connaught Place', zone: 'Central Delhi', mpi_score: 75, risk_level: 'safe', current_rainfall: 0, forecast_rainfall_3h: 25, failure_threshold: 60, drainage_stress_index: 35, pothole_density: 20, last_updated: new Date() },
        { id: 2, name: 'Sadar Bazar', zone: 'North Delhi', mpi_score: 38, risk_level: 'critical', current_rainfall: 22, forecast_rainfall_3h: 68, failure_threshold: 45, drainage_stress_index: 78, pothole_density: 72, last_updated: new Date() },
        { id: 3, name: 'Greater Kailash', zone: 'South Delhi', mpi_score: 82, risk_level: 'safe', current_rainfall: 0, forecast_rainfall_3h: 18, failure_threshold: 70, drainage_stress_index: 22, pothole_density: 12, last_updated: new Date() },
        { id: 4, name: 'Laxmi Nagar', zone: 'East Delhi', mpi_score: 48, risk_level: 'alert', current_rainfall: 14, forecast_rainfall_3h: 52, failure_threshold: 52, drainage_stress_index: 66, pothole_density: 58, last_updated: new Date() },
        { id: 5, name: 'Dwarka', zone: 'West Delhi', mpi_score: 75, risk_level: 'safe', current_rainfall: 2, forecast_rainfall_3h: 20, failure_threshold: 68, drainage_stress_index: 30, pothole_density: 18, last_updated: new Date() },
        { id: 6, name: 'Sangam Vihar', zone: 'South Delhi', mpi_score: 35, risk_level: 'critical', current_rainfall: 25, forecast_rainfall_3h: 72, failure_threshold: 42, drainage_stress_index: 82, pothole_density: 78, last_updated: new Date() },
        { id: 7, name: 'Rohini', zone: 'North Delhi', mpi_score: 62, risk_level: 'safe', current_rainfall: 5, forecast_rainfall_3h: 30, failure_threshold: 65, drainage_stress_index: 42, pothole_density: 28, last_updated: new Date() },
        { id: 8, name: 'Shahdara', zone: 'East Delhi', mpi_score: 45, risk_level: 'alert', current_rainfall: 16, forecast_rainfall_3h: 58, failure_threshold: 50, drainage_stress_index: 70, pothole_density: 62, last_updated: new Date() },
    ];
    
    console.log(`✅ Demo data loaded: ${wardsData.length} wards`);
    updateMapWithWards(wardsData);
    updateStatistics(wardsData);
    
    // Render UI components after demo data is loaded
    renderMPIDashboard();
    renderAlerts();
    renderInfrastructure();
    
    // Update status to show demo mode
    updateLastRefreshTime();
}

// === ACTION CENTER (PLACEHOLDER) ===
function renderActionCenter() {
    console.log('✅ Action Center initialized');
    // Placeholder for action center functionality
}

// === LOAD INCIDENTS FROM BACKEND ===
async function loadIncidents() {
    try {
        console.log('🔄 Loading incidents from backend...');
        
        const response = await fetch(`${API_BASE_URL}/incidents`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const incidents = await response.json();
        
        if (incidents && Array.isArray(incidents) && incidents.length > 0) {
            // Map backend incidents to frontend format
            incidentsData = incidents.map(inc => ({
                id: inc.id,
                type: inc.type || 'waterlogging',
                status: inc.status || 'pending',
                ward: inc.ward_id || inc.location || 'Unknown',
                time: inc.created_at ? formatTimestamp(inc.created_at) : 'Recently',
                severity: inc.severity || 2,
                description: inc.description || 'Reported incident'
            }));
            
            console.log(`✅ Loaded ${incidentsData.length} incidents from backend`);
            
            // Re-render incidents panel
            renderIncidents();
        } else {
            console.log('ℹ️ No incidents received from backend, keeping existing data');
        }
    } catch (error) {
        console.log(`⚠️ Could not load incidents from backend: ${error.message}`);
        console.log('ℹ️ Using locally generated incidents');
        // Keep existing incidentsData - don't replace with errors
    }
}

// Helper function to format timestamps
function formatTimestamp(timestamp) {
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`;
        return date.toLocaleDateString();
    } catch (e) {
        return 'Recently';
    }
}

// === RENDER WARDS ON MAP ===
function updateMapWithWards(wards) {
    console.log(`🗺️ Rendering ${wards.length} wards on map...`);
    
    // Clear existing ward markers
    wardLayer.clearLayers();
    
    const heatMapData = [];
    let renderedCount = 0;

    wards.forEach((ward, index) => {
        try {
            // Generate coordinates for Delhi wards based on ward ID/name
            // Since the MPI API doesn't provide lat/lon, we use the coordinate generator
            const coords = getWardCoordinates(ward.zone || 'Delhi', ward.name || `Ward_${ward.id}`);
            
            if (!coords || coords[0] < 28 || coords[0] > 29 || coords[1] < 76.5 || coords[1] > 77.5) {
                console.warn(`⚠️ Invalid coordinates for ward: ${ward.name}`);
                return;
            }
            
            // Color based on risk level with better gradients
            let color, fillColor, pulseClass;
            if (ward.risk_level === 'critical') {
                color = '#FF4757';
                fillColor = '#FF4757';
                pulseClass = 'pulse-critical';
            } else if (ward.risk_level === 'alert') {
                color = '#FFB800';
                fillColor = '#FFD93D';
                pulseClass = 'pulse-warning';
            } else {
                color = '#00C896';
                fillColor = '#6BCF7F';
                pulseClass = '';
            }
            
            // Create circular marker with enhanced styling - larger and more visible
            const circle = L.circleMarker(coords, {
                color: color,
                fillColor: fillColor,
                fillOpacity: 0.75,
                radius: 10,
                weight: 2,
                className: pulseClass
            }).addTo(wardLayer);
            
            // Add elegant tooltip on hover
            circle.bindTooltip(`
                <div style="
                    background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                    padding: 10px 14px;
                    border-radius: 8px;
                    border-left: 4px solid ${color};
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    font-family: 'Inter', sans-serif;
                    min-width: 180px;
                ">
                    <div style="font-weight: 700; font-size: 14px; color: #2C3E50; margin-bottom: 6px;">
                        ${ward.name}
                    </div>
                    <div style="font-size: 12px; color: #546E7A; margin-bottom: 4px;">
                        <i class="fas fa-chart-line"></i> Risk Score: <strong>${ward.mpi_score}</strong>
                    </div>
                    <div style="font-size: 11px; color: #7F8C8D; display: flex; justify-content: space-between; gap: 10px;">
                        <span><i class="fas fa-layer-group"></i> ${ward.zone}</span>
                        <span style="color: ${color}; font-weight: 600;">${ward.risk_level.toUpperCase()}</span>
                    </div>
                    <div style="font-size: 10px; color: #95A5A6; margin-top: 6px; font-style: italic;">
                        Click for details
                    </div>
                </div>
            `, {
                permanent: false,
                direction: 'top',
                offset: [0, -10],
                opacity: 0.95,
                className: 'custom-tooltip'
            });
            
            // Add hover effects
            circle.on('mouseover', function(e) {
                this.setStyle({
                    weight: 3,
                    radius: 14,
                    fillOpacity: 0.9
                });
            });
            
            circle.on('mouseout', function(e) {
                this.setStyle({
                    weight: 2,
                    radius: 10,
                    fillOpacity: 0.75
                });
            });
            
            // Click handler to show detailed card
            circle.on('click', () => {
                showWardInfoCard(ward, color);
            });
            
            // Add to heat map data - use MPI score for intensity
            const intensity = ward.mpi_score / 100; // Normalize to 0-1
            heatMapData.push([coords[0], coords[1], intensity]);
            
            renderedCount++;
        } catch (error) {
            console.error(`Error rendering ward ${ward.name}:`, error);
        }
    });
    
    console.log(`✅ Rendered ${renderedCount}/${wards.length} wards on map`);
    
    // Add heat map layer with improved settings
    if (heatLayer) {
        map.removeLayer(heatLayer);
    }
    
    heatLayer = L.heatLayer(heatMapData, {
        radius: 25,
        blur: 20,
        maxZoom: 14,
        max: 1.0,
        minOpacity: 0.3,
        gradient: {
            0.0: '#00C896',
            0.3: '#4CAF50',
            0.5: '#FFC107',
            0.7: '#FF9800',
            0.85: '#FF5722',
            1.0: '#F44336'
        }
    }).addTo(map);
    
    console.log('🔥 Heatmap layer updated');
}

// === GENERATE WARD COORDINATES ===
function getWardCoordinates(zone, wardName) {
    // Real approximate coordinates for major Delhi wards
    const wardCoordinatesMap = {
        // Central Delhi
        'CONNAUGHT PLACE': [28.6315, 77.2167],
        'KAROL BAGH': [28.6542, 77.1902],
        'CHANDNI CHOWK': [28.6506, 77.2303],
        'RAJENDRA PLACE': [28.6410, 77.1715],
        'PATEL NAGAR': [28.6497, 77.1624],
        'KASHMERE GATE': [28.6692, 77.2281],
        
        // North Delhi
        'NARELA': [28.8533, 77.0917],
        'ROHINI': [28.7495, 77.0736],
        'SADAR BAZAR': [28.6661, 77.2127],
        'PITAM PURA': [28.7005, 77.1311],
        'AZADPUR': [28.7134, 77.1791],
        'MODEL TOWN': [28.7186, 77.1936],
        'SHAHBAAD DAIRY': [28.8388, 77.1389],
        'BAWANA': [28.8005, 77.0306],
        'ALIPUR': [28.7973, 77.1312],
        
        // South Delhi
        'GREATER KAILASH': [28.5494, 77.2426],
        'HAUZ KHAS': [28.5494, 77.2068],
        'VASANT KUNJ': [28.5200, 77.1588],
        'SANGAM VIHAR': [28.5017, 77.2484],
        'MEHRAULI': [28.5244, 77.1855],
        'GREEN PARK': [28.5601, 77.2062],
        'MALVIYA NAGAR': [28.5286, 77.2067],
        'NEHRU PLACE': [28.5494, 77.2511],
        
        // East Delhi
        'LAXMI NAGAR': [28.6354, 77.2773],
        'SHAHDARA': [28.6764, 77.2886],
        'MAYUR VIHAR': [28.6080, 77.2952],
        'PREET VIHAR': [28.6327, 77.2968],
        'TRILOKPURI': [28.5949, 77.3122],
        'GANDHI NAGAR': [28.6585, 77.2524],
        
        // West Delhi
        'DWARKA': [28.5921, 77.0460],
        'JANAKPURI': [28.6219, 77.0834],
        'TILAK NAGAR': [28.6414, 77.0910],
        'RAJOURI GARDEN': [28.6414, 77.1214],
        'PUNJABI BAGH': [28.6703, 77.1310],
        'VIKAS PURI': [28.6474, 77.0659],
        'UTTAM NAGAR': [28.6219, 77.0591],
        'NAJAFGARH': [28.6094, 76.9798],
        'PALAM': [28.5572, 77.1053]
    };
    
    // Zone-specific base coordinates covering Delhi regions properly
    const zoneBounds = {
        'East Delhi':    { center: [28.6300, 77.3000], latSpread: 0.08, lonSpread: 0.06 },
        'North Delhi':   { center: [28.7200, 77.1500], latSpread: 0.10, lonSpread: 0.08 },
        'South Delhi':   { center: [28.5200, 77.2200], latSpread: 0.08, lonSpread: 0.08 },
        'West Delhi':    { center: [28.6200, 77.0400], latSpread: 0.08, lonSpread: 0.08 },
        'Central Delhi': { center: [28.6400, 77.2100], latSpread: 0.04, lonSpread: 0.04 },
        'Delhi':         { center: [28.6139, 77.2090], latSpread: 0.12, lonSpread: 0.12 }
    };
    
    // Try to find exact match first
    const normalizedName = wardName.toUpperCase().trim();
    if (wardCoordinatesMap[normalizedName]) {
        return wardCoordinatesMap[normalizedName];
    }
    
    // Get zone bounds or default
    const bounds = zoneBounds[zone] || zoneBounds['Delhi'];
    
    // Extract ward number from name for grid positioning
    const wardNumMatch = wardName.match(/\d+/);
    const wardNum = wardNumMatch ? parseInt(wardNumMatch[0]) : 0;
    
    // Create a grid layout within the zone
    // Use ward number to determine position in grid
    const gridCols = 8;
    const row = Math.floor(wardNum / gridCols);
    const col = wardNum % gridCols;
    
    // Calculate position within zone bounds
    const lat = bounds.center[0] + (row / 10 - 0.5) * bounds.latSpread * 2;
    const lon = bounds.center[1] + (col / gridCols - 0.5) * bounds.lonSpread * 2;
    
    // Add small jitter to avoid exact overlaps
    const jitterLat = (Math.sin(wardNum * 7) * 0.005);
    const jitterLon = (Math.cos(wardNum * 11) * 0.005);
    
    return [lat + jitterLat, lon + jitterLon];
}

// === SHOW WARD INFO CARD ===
function showWardInfoCard(ward, color) {
    console.log('Ward data received:', ward);
    const card = document.getElementById('wardInfoCard');
    const content = document.getElementById('wardCardContent');
    
    // Ensure all properties exist with fallbacks
    const wardData = {
        name: ward.name || 'Unknown Ward',
        zone: ward.zone || 'Unknown Zone',
        mpi_score: ward.mpi_score || ward.mpiScore || 50,
        risk_level: ward.risk_level || ward.riskLevel || 'safe',
        current_rainfall: ward.current_rainfall || ward.currentRainfall || 0,
        forecast_rainfall_3h: ward.forecast_rainfall_3h || ward.forecastRainfall || 0,
        failure_threshold: ward.failure_threshold || ward.failureThreshold || 60,
        drainage_stress_index: ward.drainage_stress_index || ward.drainageStress || 0,
        pothole_density: ward.pothole_density || ward.potholeDensity || 0,
        last_updated: ward.last_updated || ward.lastUpdated || new Date()
    };
    
    // Calculate risk percentage
    const riskPercent = Math.round((wardData.forecast_rainfall_3h / wardData.failure_threshold) * 100);
    
    content.innerHTML = `
        <div style="border-left: 4px solid ${color}; padding-left: 16px;">
            <h3 style="margin: 0 0 12px 0; color: ${color}; font-size: 1.4rem;">
                <i class="fas fa-map-marker-alt"></i> ${wardData.name}
            </h3>
            <p style="color: #546E7A; margin: 0 0 16px 0; font-size: 0.9rem;">
                <i class="fas fa-layer-group"></i> ${wardData.zone}
            </p>
        </div>
        
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 16px; border-radius: 12px; margin: 16px 0;">
            <div style="text-align: center;">
                <div style="font-size: 3rem; font-weight: 800; color: ${color}; margin-bottom: 8px;">
                    ${wardData.mpi_score}
                </div>
                <div style="color: #0A2647; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">
                    MPI Score
                </div>
                <div style="margin-top: 8px; padding: 6px 12px; background: ${color}; color: white; border-radius: 20px; display: inline-block; font-size: 0.85rem; font-weight: 600;">
                    ${wardData.risk_level.toUpperCase()}
                </div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0;">
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="color: #546E7A; font-size: 0.75rem; margin-bottom: 4px;">
                    <i class="fas fa-cloud-rain"></i> Current Rainfall
                </div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #2C74B3;">
                    ${wardData.current_rainfall}<span style="font-size: 0.8rem; color: #546E7A;">mm</span>
                </div>
            </div>
            
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="color: #546E7A; font-size: 0.75rem; margin-bottom: 4px;">
                    <i class="fas fa-cloud-showers-heavy"></i> Forecast (3h)
                </div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #FFB800;">
                    ${wardData.forecast_rainfall_3h}<span style="font-size: 0.8rem; color: #546E7A;">mm</span>
                </div>
            </div>
            
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="color: #546E7A; font-size: 0.75rem; margin-bottom: 4px;">
                    <i class="fas fa-water"></i> Drainage Stress
                </div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #FF4757;">
                    ${wardData.drainage_stress_index}<span style="font-size: 0.8rem; color: #546E7A;">%</span>
                </div>
            </div>
            
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="color: #546E7A; font-size: 0.75rem; margin-bottom: 4px;">
                    <i class="fas fa-road"></i> Pothole Density
                </div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #546E7A;">
                    ${wardData.pothole_density}<span style="font-size: 0.8rem; color: #546E7A;">%</span>
                </div>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-top: 16px;">
            <div style="color: #546E7A; font-size: 0.85rem; margin-bottom: 8px;">
                <i class="fas fa-exclamation-triangle"></i> <strong>Failure Threshold:</strong> ${wardData.failure_threshold}mm
            </div>
            <div style="color: #546E7A; font-size: 0.85rem;">
                <i class="fas fa-chart-line"></i> <strong>Risk Level:</strong> ${riskPercent}% of threshold
            </div>
        </div>
        
        <div style="margin-top: 16px; font-size: 0.75rem; color: #9BA5AD;">
            <i class="fas fa-clock"></i> Last updated: ${new Date(wardData.last_updated).toLocaleString()}
        </div>
    `;
    
    card.style.display = 'block';
    setTimeout(() => card.classList.add('show'), 10);
}

function closeWardCard() {
    const card = document.getElementById('wardInfoCard');
    card.classList.remove('show');
    setTimeout(() => card.style.display = 'none', 300);
}

// === WEBSOCKET FOR REAL-TIME UPDATES ===
function initializeWebSocket() {
    socket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
    });
    
    socket.on('connect', () => {
        console.log('✅ Connected to real-time updates');
    });
    
    socket.on('connect_error', (error) => {
        console.log('⚠️ Socket.IO connection error (non-critical):', error.message);
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Disconnected from real-time updates');
    });
    
    socket.on('ward-update', (data) => {
        console.log('🔄 Ward update received:', data.wardName, {
            rainfall: data.rainfall + 'mm',
            riskLevel: data.riskLevel,
            mpiScore: data.mpiScore
        });
        // Individual ward updated - could update just that ward for efficiency
    });
    
    socket.on('data-refresh', (data) => {
        console.log(`📊 Data refresh event: ${data.count} wards updated at ${new Date(data.timestamp).toLocaleTimeString()}`);
        // Reload all ward data since multiple wards changed
        loadWardData();
    });
    
    socket.on('incident-new', (data) => {
        console.log('🚨 New incident:', data);
        showNotification('New Incident', `${data.type} reported in ${data.location}`);
        loadIncidents();
    });
    
    socket.on('alert-new', (data) => {
        console.log('⚠️ New alert:', data);
        showNotification('New Alert', data.message);
    });
    
    socket.on('error', (data) => {
        console.error('❌ Real-time update error:', data.message);
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Disconnected from real-time updates');
        showNotification('Disconnected', 'Real-time updates paused');
    });
    
    socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 Reconnected after', attemptNumber, 'attempts');
        showNotification('Reconnected', 'Real-time updates resumed');
        loadWardData(); // Refresh data after reconnection
    });
}

// === AUTO-REFRESH FOR REAL-TIME DATA ===
function startRealTimeUpdates() {
    // Refresh ward data every 30 seconds
    setInterval(() => {
        console.log('🔄 Auto-refreshing ward data...');
        loadWardData();
    }, 30000); // 30 seconds
    
    // Refresh incidents every 15 seconds
    setInterval(() => {
        console.log('🔄 Auto-refreshing incidents...');
        loadIncidents();
    }, 15000); // 15 seconds
}

// Start real-time updates when page loads
setTimeout(() => {
    startRealTimeUpdates();
    console.log('✅ Real-time auto-refresh enabled');
}, 5000); // Start after 5 seconds

// === UPDATE STATISTICS ===
function updateStatistics(wards) {
    const stats = {
        total: wards.length,
        critical: wards.filter(w => w.risk_level === 'critical').length,
        alert: wards.filter(w => w.risk_level === 'alert').length,
        safe: wards.filter(w => w.risk_level === 'safe').length
    };
    
    // Update sidebar MPI cards
    renderMPIDashboard(wards);
}

// === NOTIFICATION ===
function showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
    }
}

// Legacy SVG map function removed - using Leaflet map instead

function showWardTooltip(wardId, event) {
    // Create or update tooltip (simplified for now)
    console.log(`Showing tooltip for ward ${wardId}`);
}

function hideWardTooltip() {
    // Hide tooltip
}

function showWardDetails(wardId) {
    const ward = wardsData.find(w => String(w.id) === String(wardId));
    if (!ward) return;

    const modal = document.getElementById('wardModal');
    const modalWardName = document.getElementById('modalWardName');
    const modalBody = document.getElementById('modalBody');

    // Map database fields
    const mpiScore = Number(ward.mpi_score ?? ward.mpiScore ?? 0);
    const currentRainfall = Number(ward.current_rainfall ?? ward.currentRainfall ?? 0);
    const forecastRainfall = Number(ward.forecast_rainfall_3h ?? ward.forecastRainfall ?? 0);
    const threshold = Number(ward.failure_threshold ?? ward.threshold ?? 60);
    const riskLevel = ward.risk_level ?? ward.riskLevel ?? 'safe';
    const drainageStress = Number(ward.drainage_stress_index ?? ward.drainageStress ?? 0);
    const potholeDensity = Number(ward.pothole_density ?? ward.potholeDensity ?? 0);
    const floodRisk = Math.min(100, Math.round((Math.max(currentRainfall, forecastRainfall) / threshold) * 100));

    // Risk level styling
    let riskColor = '#00C896';
    let riskLabel = 'Low Risk';
    if (riskLevel === 'critical') {
        riskColor = '#FF4757';
        riskLabel = 'High Risk';
    } else if (riskLevel === 'alert') {
        riskColor = '#FFB800';
        riskLabel = 'Medium Risk';
    }

    modalWardName.textContent = ward.name;

    modalBody.innerHTML = `
        <div style="display: grid; gap: 16px;">
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px;">
                <div style="font-size: 0.85rem; color: #546E7A; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">MPI Score (ML Predicted)</div>
                <div style="font-size: 3rem; font-weight: 800; background: linear-gradient(135deg, ${riskColor} 0%, #2C74B3 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    ${mpiScore}
                </div>
                <div style="height: 10px; background: #E8ECEF; border-radius: 5px; overflow: hidden; margin-top: 12px;">
                    <div style="height: 100%; width: ${mpiScore}%; background: linear-gradient(135deg, ${riskColor} 0%, #2C74B3 100%); transition: width 0.5s ease;"></div>
                </div>
                <div style="margin-top: 12px; padding: 8px 16px; background: ${riskColor}20; border-radius: 20px; display: inline-block;">
                    <span style="font-weight: 700; color: ${riskColor};">${riskLabel.toUpperCase()}</span>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div style="padding: 16px; background: #F8FAFB; border-radius: 12px; text-align: center;">
                    <div style="font-size: 0.8rem; color: #546E7A; margin-bottom: 4px;"><i class="fas fa-cloud-rain" style="color: #2C74B3;"></i> Current Rainfall</div>
                    <div style="font-size: 1.75rem; font-weight: 700; color: #2C74B3;">${currentRainfall.toFixed(1)}<span style="font-size: 0.9rem;">mm</span></div>
                </div>
                <div style="padding: 16px; background: #F8FAFB; border-radius: 12px; text-align: center;">
                    <div style="font-size: 0.8rem; color: #546E7A; margin-bottom: 4px;"><i class="fas fa-cloud-sun-rain" style="color: #144272;"></i> 3hr Forecast</div>
                    <div style="font-size: 1.75rem; font-weight: 700; color: #144272;">${forecastRainfall.toFixed(1)}<span style="font-size: 0.9rem;">mm</span></div>
                </div>
            </div>
            
            <div style="padding: 16px; background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%); border-radius: 12px; border-left: 4px solid #FF4757;">
                <div style="font-size: 0.85rem; color: #546E7A; margin-bottom: 4px;">Failure Threshold</div>
                <div style="font-size: 2rem; font-weight: 700; color: #FF4757;">${threshold}mm</div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <span style="font-size: 0.85rem; color: #546E7A;">Flood Risk:</span>
                    <span style="font-size: 1.2rem; font-weight: 700; color: ${floodRisk > 70 ? '#FF4757' : floodRisk > 40 ? '#FFB800' : '#00C896'};">${floodRisk}%</span>
                </div>
                <div style="height: 6px; background: #E8ECEF; border-radius: 3px; overflow: hidden; margin-top: 8px;">
                    <div style="height: 100%; width: ${floodRisk}%; background: ${floodRisk > 70 ? '#FF4757' : floodRisk > 40 ? '#FFB800' : '#00C896'};"></div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div style="padding: 14px; background: #F8FAFB; border-radius: 10px;">
                    <div style="font-size: 0.8rem; color: #546E7A; margin-bottom: 4px;"><i class="fas fa-water" style="color: #2C74B3;"></i> Drainage Stress</div>
                    <div style="font-size: 1.4rem; font-weight: 700; color: #0A2647;">${drainageStress}%</div>
                </div>
                <div style="padding: 14px; background: #F8FAFB; border-radius: 10px;">
                    <div style="font-size: 0.8rem; color: #546E7A; margin-bottom: 4px;"><i class="fas fa-road" style="color: #2C74B3;"></i> Pothole Density</div>
                    <div style="font-size: 1.4rem; font-weight: 700; color: #0A2647;">${potholeDensity}</div>
                </div>
            </div>
            
            <div style="padding: 12px 16px; background: #e8f4fd; border-radius: 8px; display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-map-marker-alt" style="color: #2C74B3;"></i>
                <div>
                    <div style="font-size: 0.8rem; color: #546E7A;">Zone</div>
                    <div style="font-weight: 600; color: #144272;">${ward.zone || 'Delhi'}</div>
                </div>
            </div>
            
            <div style="font-size: 0.75rem; color: #B0BEC5; text-align: center; padding-top: 8px; border-top: 1px solid #E8ECEF;">
                <i class="fas fa-robot"></i> MPI Score predicted by ML Model API
            </div>
        </div>
    `;

    modal.classList.add('show');
}

document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('wardModal').classList.remove('show');
});

// === MPI DASHBOARD ===
let mpiSearchQuery = '';
let mpiShowAll = false;
const MPI_INITIAL_COUNT = 12;

function renderMPIDashboard(wards = wardsData) {
    console.log('🎨 renderMPIDashboard called with', wards?.length, 'wards');
    
    const mpiGrid = document.getElementById('mpiGrid');
    if (!mpiGrid) {
        console.error('❌ mpiGrid element not found in DOM!');
        return;
    }
    
    console.log('✅ mpiGrid element found:', mpiGrid);

    // Filter by search query
    let filteredWards = wards;
    if (mpiSearchQuery) {
        const query = mpiSearchQuery.toLowerCase();
        filteredWards = wards.filter(w => 
            w.name.toLowerCase().includes(query) || 
            (w.zone && w.zone.toLowerCase().includes(query))
        );
    }

    // Limit display unless showing all
    const displayWards = mpiShowAll ? filteredWards : filteredWards.slice(0, MPI_INITIAL_COUNT);
    
    console.log('📊 Filtered wards:', filteredWards.length);
    console.log('📊 Display wards:', displayWards.length);
    console.log('📊 First ward to display:', displayWards[0]);

    // Render search bar and controls
    const searchContainer = document.getElementById('mpiSearchContainer');
    if (searchContainer) {
        searchContainer.innerHTML = `
            <div class="mpi-search-bar">
                <div class="search-input-wrapper">
                    <i class="fas fa-search"></i>
                    <input type="text" id="mpiSearchInput" placeholder="Search wards by name or zone..." 
                           value="${mpiSearchQuery}" onkeyup="handleMPISearch(event)">
                    ${mpiSearchQuery ? '<i class="fas fa-times clear-search" onclick="clearMPISearch()"></i>' : ''}
                </div>
                <div class="search-stats">
                    <span class="ward-count">${filteredWards.length} wards found</span>
                    ${!mpiShowAll && filteredWards.length > MPI_INITIAL_COUNT ? 
                        `<button class="show-all-btn" onclick="toggleShowAllWards()">
                            <i class="fas fa-expand"></i> Show All ${filteredWards.length} Wards
                        </button>` : 
                        filteredWards.length > MPI_INITIAL_COUNT ?
                        `<button class="show-all-btn" onclick="toggleShowAllWards()">
                            <i class="fas fa-compress"></i> Show Less
                        </button>` : ''
                    }
                </div>
            </div>
        `;
    }

    // Render ward cards
    mpiGrid.innerHTML = displayWards.map(ward => {
        // Map database fields (snake_case) to display values with safe defaults
        const mpiScore = Number(ward.mpi_score ?? ward.mpiScore ?? 0);
        const currentRainfall = Number(ward.current_rainfall ?? ward.currentRainfall ?? 0);
        const forecastRainfall = Number(ward.forecast_rainfall_3h ?? ward.forecastRainfall ?? 0);
        const threshold = Number(ward.failure_threshold ?? ward.threshold ?? 60);
        const riskLevel = ward.risk_level ?? ward.riskLevel ?? 'safe';
        const drainageStress = Number(ward.drainage_stress_index ?? ward.drainageStress ?? 0);
        const potholeDensity = Number(ward.pothole_density ?? ward.potholeDensity ?? 0);
        
        // Determine status based on risk level
        let statusClass, statusLabel, statusIcon;
        if (riskLevel === 'critical') {
            statusClass = 'critical';
            statusLabel = 'High Risk';
            statusIcon = 'fa-exclamation-circle';
        } else if (riskLevel === 'alert' || riskLevel === 'warning') {
            statusClass = 'risk';
            statusLabel = 'Medium Risk';
            statusIcon = 'fa-exclamation-triangle';
        } else {
            statusClass = 'ready';
            statusLabel = 'Low Risk';
            statusIcon = 'fa-check-circle';
        }

        // Calculate flood risk percentage
        const floodRisk = Math.min(100, Math.round((Math.max(currentRainfall, forecastRainfall) / threshold) * 100));

        return `
            <div class="mpi-card status-${statusClass}" onclick="showWardDetails(${ward.id})">
                <div class="mpi-card-header">
                    <div class="ward-name">${ward.name}</div>
                    <div class="mpi-badge ${statusClass}">
                        <i class="fas ${statusIcon}"></i> ${statusLabel}
                    </div>
                </div>
                
                <div class="mpi-score-container">
                    <div class="mpi-score">${mpiScore}</div>
                    <div class="mpi-label">MPI Score (ML Predicted)</div>
                </div>
                
                <div class="mpi-progress-bar">
                    <div class="mpi-progress-fill ${statusClass}" style="width: ${mpiScore}%;"></div>
                </div>
                
                <div class="mpi-details">
                    <div class="mpi-detail-item">
                        <span><i class="fas fa-cloud-rain"></i> Current</span>
                        <strong>${currentRainfall.toFixed(1)}mm</strong>
                    </div>
                    <div class="mpi-detail-item">
                        <span><i class="fas fa-cloud-sun-rain"></i> Forecast</span>
                        <strong>${forecastRainfall.toFixed(1)}mm</strong>
                    </div>
                    <div class="mpi-detail-item">
                        <span><i class="fas fa-water"></i> Threshold</span>
                        <strong>${threshold}mm</strong>
                    </div>
                    <div class="mpi-detail-item">
                        <span><i class="fas fa-percentage"></i> Flood Risk</span>
                        <strong class="${floodRisk > 70 ? 'text-danger' : floodRisk > 40 ? 'text-warning' : 'text-success'}">${floodRisk}%</strong>
                    </div>
                </div>
                
                <div class="mpi-infrastructure">
                    <div class="infra-item" title="Drainage Stress Index">
                        <i class="fas fa-water"></i>
                        <span>Drainage: ${drainageStress}%</span>
                    </div>
                    <div class="infra-item" title="Pothole Density">
                        <i class="fas fa-road"></i>
                        <span>Potholes: ${potholeDensity}</span>
                    </div>
                </div>
                
                <div class="ward-zone-tag">${ward.zone || 'Delhi'}</div>
            </div>
        `;
    }).join('');

    // Show message if no results
    if (displayWards.length === 0) {
        mpiGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No wards found matching "${mpiSearchQuery}"</p>
                <button onclick="clearMPISearch()">Clear Search</button>
            </div>
        `;
    }
}

function handleMPISearch(event) {
    mpiSearchQuery = event.target.value;
    mpiShowAll = false; // Reset to paginated view on new search
    renderMPIDashboard(wardsData);
}

function clearMPISearch() {
    mpiSearchQuery = '';
    mpiShowAll = false;
    renderMPIDashboard(wardsData);
}

function toggleShowAllWards() {
    mpiShowAll = !mpiShowAll;
    renderMPIDashboard(wardsData);
}

// === RAINFALL ALERTS ===
function renderAlerts() {
    console.log('🚨 renderAlerts called, wardsData length:', wardsData.length);
    const alertTimeline = document.getElementById('alertTimeline');
    if (!alertTimeline) {
        console.warn('⚠️ alertTimeline element not found!');
        return;
    }
    console.log('✅ alertTimeline element found');

    // Map database fields and create alerts based on MPI risk level and rainfall
    const alertWards = wardsData
        .map(w => ({
            ...w,
            forecastRainfall: Number(w.forecast_rainfall_3h ?? w.forecastRainfall ?? 0),
            currentRainfall: Number(w.current_rainfall ?? w.currentRainfall ?? 0),
            threshold: Number(w.failure_threshold ?? w.threshold ?? 60),
            mpiScore: Number(w.mpi_score ?? w.mpiScore ?? 50),
            riskLevel: w.risk_level ?? w.riskLevel ?? 'safe'
        }))
        // Show alerts for: critical/high risk wards, or wards exceeding 30% threshold, or MPI < 50
        .filter(w => {
            const thresholdPct = (w.forecastRainfall / w.threshold) * 100;
            return w.riskLevel === 'critical' || 
                   w.riskLevel === 'alert' || 
                   thresholdPct > 30 || 
                   w.mpiScore < 50 ||
                   w.currentRainfall > w.threshold * 0.5;
        })
        .sort((a, b) => {
            // Sort by risk: critical > alert > safe, then by MPI score (lower first)
            const riskWeight = { critical: 3, alert: 2, safe: 1 };
            const aRisk = riskWeight[a.riskLevel] || 1;
            const bRisk = riskWeight[b.riskLevel] || 1;
            if (aRisk !== bRisk) return bRisk - aRisk;
            return a.mpiScore - b.mpiScore;
        })
        .slice(0, 12);

    console.log('📋 Alert wards filtered:', alertWards.length);

    if (alertWards.length === 0) {
        alertTimeline.innerHTML = `
            <div class="no-alerts">
                <i class="fas fa-check-circle" style="color: #00C896; font-size: 48px; margin-bottom: 12px;"></i>
                <h3 style="color: #0A2647; margin: 8px 0;">All Clear - No Active Alerts</h3>
                <p style="color: #78909c; margin: 8px 0;">All ${wardsData.length} wards are within safe thresholds</p>
                <div style="margin-top: 16px; padding: 12px; background: #e8f5e9; border-radius: 8px; font-size: 14px;">
                    <i class="fas fa-info-circle" style="color: #2e7d32;"></i> 
                    MPI model monitoring active rainfall patterns
                </div>
            </div>
        `;
        return;
    }

    alertTimeline.innerHTML = alertWards.map(ward => {
        const thresholdPercent = Math.round((ward.forecastRainfall / ward.threshold) * 100);
        const currentPercent = Math.round((ward.currentRainfall / ward.threshold) * 100);
        
        // Determine severity based on MPI model risk level and rainfall
        let severity = 'low';
        let severityIcon = 'fa-info-circle';
        let severityLabel = 'Low Risk';
        
        if (ward.riskLevel === 'critical' || thresholdPercent >= 100 || ward.mpiScore < 30) {
            severity = 'high';
            severityIcon = 'fa-exclamation-triangle';
            severityLabel = 'Critical Alert';
        } else if (ward.riskLevel === 'alert' || thresholdPercent >= 70 || ward.mpiScore < 50) {
            severity = 'medium';
            severityIcon = 'fa-exclamation-circle';
            severityLabel = 'Warning';
        }

        // Calculate estimated time to impact
        const timeWindow = ward.forecastRainfall > ward.currentRainfall ? '1-3 hours' : 'Active now';

        return `
            <div class="alert-card severity-${severity}">
                <div class="alert-card-header">
                    <div class="alert-ward">
                        <i class="fas ${severityIcon}"></i>
                        ${ward.name}
                    </div>
                    <div class="alert-time">
                        <span class="severity-badge ${severity}">${severityLabel}</span>
                    </div>
                </div>
                
                <div class="alert-comparison">
                    <div class="comparison-item">
                        <div class="comparison-label"><i class="fas fa-cloud-rain"></i> Current</div>
                        <div class="comparison-value current">${ward.currentRainfall.toFixed(1)}mm</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label"><i class="fas fa-cloud-showers-heavy"></i> Forecast (3h)</div>
                        <div class="comparison-value forecast">${ward.forecastRainfall.toFixed(1)}mm</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label"><i class="fas fa-tachometer-alt"></i> Threshold</div>
                        <div class="comparison-value threshold">${ward.threshold}mm</div>
                    </div>
                </div>
                
                <div class="alert-metrics">
                    <div class="metric-pill">
                        <span>MPI Score:</span> <strong>${ward.mpiScore}</strong>
                    </div>
                    <div class="metric-pill">
                        <span>Risk:</span> <strong>${thresholdPercent}%</strong>
                    </div>
                    <div class="metric-pill">
                        <span>ETA:</span> <strong>${timeWindow}</strong>
                    </div>
                </div>
                
                <div class="alert-message">
                    ${severity === 'high' 
                        ? '🚨 <strong>Immediate action required</strong> - Deploy emergency response teams' 
                        : severity === 'medium' 
                        ? '⚡ <strong>Monitor closely</strong> - Prepare drainage and alert residents' 
                        : '✓ <strong>Under observation</strong> - Continue monitoring conditions'}
                </div>
            </div>
        `;
    }).join('');
}

// === INCIDENTS ===
function renderIncidents() {
    const incidentFeed = document.getElementById('incidentFeed');
    if (!incidentFeed) return;

    incidentFeed.innerHTML = incidentsData.slice(0, 9).map(incident => {
        const iconMap = {
            'waterlogging': 'fa-water',
            'pothole': 'fa-exclamation-circle',
            'drainage': 'fa-tint-slash'
        };

        return `
            <div class="incident-card">
                <div class="incident-image">
                    <i class="fas ${iconMap[incident.type]}"></i>
                </div>
                <div class="incident-content">
                    <div class="incident-header">
                        <div class="incident-type ${incident.type}">${incident.type}</div>
                        <div class="incident-status ${incident.status}">${incident.status}</div>
                    </div>
                    
                    <div class="incident-info">
                        <div>
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${incident.ward}</span>
                        </div>
                        <div>
                            <i class="fas fa-clock"></i>
                            <span>${incident.time}</span>
                        </div>
                        <div>
                            <i class="fas fa-signal"></i>
                            <span>Severity: ${incident.severity}/3</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// === INFRASTRUCTURE ===
function renderInfrastructure() {
    console.log('🏗️ renderInfrastructure called, wardsData length:', wardsData.length);
    
    // Drainage Stress - Top wards with highest drainage issues
    const drainageStress = document.getElementById('drainageStress');
    if (drainageStress) {
        console.log('✅ drainageStress element found');
        const topStress = wardsData
            .map(w => ({
                ...w,
                drainageStress: Number(w.drainage_stress_index ?? w.drainageStress ?? 0),
                drainDensity: Number(w.drain_density ?? 0.5)
            }))
            .filter(w => w.drainageStress > 0)
            .sort((a, b) => b.drainageStress - a.drainageStress)
            .slice(0, 8);

        console.log('📊 Top drainage stress wards:', topStress.length);

        if (topStress.length === 0) {
            drainageStress.innerHTML = '<div class="no-data"><i class="fas fa-water"></i> No drainage stress data available</div>';
        } else {
            drainageStress.innerHTML = topStress.map(ward => {
                const level = ward.drainageStress > 70 ? 'high' : ward.drainageStress > 40 ? 'medium' : 'low';
                const drainDensityPct = Math.round(ward.drainDensity * 100);
                return `
                    <div class="stress-item">
                        <div class="stress-header">
                            <div class="stress-ward">
                                <i class="fas fa-map-marker-alt"></i> ${ward.name}
                            </div>
                            <div class="stress-level ${level}">${ward.drainageStress}%</div>
                        </div>
                        <div class="stress-bar">
                            <div class="stress-fill ${level}" style="width: ${ward.drainageStress}%;"></div>
                        </div>
                        <div class="item-description">
                            <span class="infra-detail">
                                <i class="fas fa-water"></i> Drain Density: ${drainDensityPct}%
                            </span>
                            ${level === 'high' 
                                ? '<span class="status-critical">🔴 Critical - Immediate maintenance required</span>' 
                                : level === 'medium' 
                                ? '<span class="status-warning">🟡 Needs attention - Schedule inspection</span>' 
                                : '<span class="status-safe">🟢 Operating normally</span>'}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Pothole Density - Top wards with highest pothole issues
    const potholeDensity = document.getElementById('potholeDensity');
    if (potholeDensity) {
        const topDensity = wardsData
            .map(w => ({
                ...w,
                potholeDensity: Number(w.pothole_density ?? w.potholeDensity ?? 0),
                floodFreq: Number(w.hist_flood_freq ?? 0)
            }))
            .filter(w => w.potholeDensity > 0)
            .sort((a, b) => b.potholeDensity - a.potholeDensity)
            .slice(0, 8);

        if (topDensity.length === 0) {
            potholeDensity.innerHTML = '<div class="no-data"><i class="fas fa-road"></i> No pothole data available</div>';
        } else {
            potholeDensity.innerHTML = topDensity.map(ward => {
                const level = ward.potholeDensity > 70 ? 'high' : ward.potholeDensity > 40 ? 'medium' : 'low';
                const rounded = Math.round(ward.potholeDensity);
                return `
                    <div class="density-item">
                        <div class="density-header">
                            <div class="density-ward">
                                <i class="fas fa-map-marker-alt"></i> ${ward.name}
                            </div>
                            <div class="density-level ${level}">${rounded}</div>
                        </div>
                        <div class="density-bar">
                            <div class="density-fill ${level}" style="width: ${Math.min(100, rounded)}%;"></div>
                        </div>
                        <div class="item-description">
                            <span class="infra-detail">
                                <i class="fas fa-history"></i> Flood History: ${ward.floodFreq.toFixed(1)} incidents
                            </span>
                            ${level === 'high' 
                                ? '<span class="status-critical">🔴 High density - Schedule road repairs</span>' 
                                : level === 'medium' 
                                ? '<span class="status-warning">🟡 Moderate - Plan maintenance</span>' 
                                : '<span class="status-safe">🟢 Low density - Routine checks</span>'}
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

// === REAL-TIME UPDATES ===
function updateRealTimeData() {
    console.log('📊 Updating real-time data...');

    // Simulate data changes
    wardsData = wardsData.map(ward => ({
        ...ward,
        currentRainfall: Math.max(0, ward.currentRainfall + Math.floor(Math.random() * 10) - 5),
        forecastRainfall: Math.max(0, ward.forecastRainfall + Math.floor(Math.random() * 10) - 5),
        mpiScore: Math.max(0, Math.min(100, ward.mpiScore + Math.floor(Math.random() * 6) - 3))
    }));

    // Re-classify risk levels
    wardsData = wardsData.map(ward => {
        const riskPercentage = (ward.forecastRainfall / ward.threshold) * 100;
        let riskLevel = 'safe';
        if (riskPercentage > 70) riskLevel = 'critical';
        else if (riskPercentage > 30) riskLevel = 'alert';

        let status = 'ready';
        if (ward.mpiScore < 40) status = 'critical';
        else if (ward.mpiScore < 70) status = 'risk';

        return { ...ward, riskLevel, status };
    });

    // Add new incidents occasionally
    if (Math.random() > 0.7) {
        incidentsData.unshift(generateIncidents(1)[0]);
        if (incidentsData.length > 20) incidentsData.pop();
    }

    // Re-render
    renderMPIDashboard();
    renderAlerts();
    renderIncidents();
    renderInfrastructure();

    // Map is already initialized with Leaflet, no need to update innerHTML

    console.log('✅ Data updated!');
}

// === EXPORT FUNCTIONALITY ===
function initializeExport() {
    const exportBtn = document.getElementById('exportReport');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            console.log('📄 Exporting report...');

            // Generate report data
            const reportData = {
                timestamp: new Date().toISOString(),
                summary: {
                    totalWards: wardsData.length,
                    criticalWards: wardsData.filter(w => w.riskLevel === 'critical').length,
                    alertWards: wardsData.filter(w => w.riskLevel === 'alert').length,
                    safeWards: wardsData.filter(w => w.riskLevel === 'safe').length
                },
                wards: wardsData,
                incidents: incidentsData
            };

            // Convert to JSON and download
            const dataStr = JSON.stringify(reportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `monsoon-report-${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            alert('✅ Report exported successfully!');
        });
    }
}

// === UTILITY FUNCTIONS ===
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.round(current);
    }, 16);
}

// ===================================
// INCIDENT UPLOAD FUNCTIONALITY
// ===================================

let uploadedImage = null;
let currentGPS = null;
let validationResults = {
    timestamp: null,
    aiGenerated: null,
    location: null,
    quality: null
};

// Initialize upload modal
function initializeUploadModal() {
    const reportBtn = document.getElementById('reportIncidentBtn');
    const modal = document.getElementById('uploadModal');
    const closeBtn = document.getElementById('closeUploadModal');
    const cancelBtn = document.getElementById('cancelUpload');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('incidentPhoto');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const captureGPSBtn = document.getElementById('captureGPS');
    const form = document.getElementById('incidentUploadForm');

    // Open modal
    reportBtn?.addEventListener('click', () => {
        modal.classList.add('show');
        resetUploadForm();
    });

    // Close modal
    const closeModal = () => {
        modal.classList.remove('show');
        resetUploadForm();
    };

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    // Dropzone click - open camera instead of file picker
    dropzone?.addEventListener('click', (e) => {
        // Don't trigger if clicking on the Open Camera button itself
        if (e.target.closest('.open-camera-btn')) return;
    });

    dropzone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone?.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone?.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            handleImageUpload(files[0]);
        }
    });

    // File input change
    fileInput?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });

    // Remove image
    removeImageBtn?.addEventListener('click', () => {
        uploadedImage = null;
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('dropzone').style.display = 'block';
        document.getElementById('validationPanel').style.display = 'none';
        document.getElementById('submitIncident').disabled = true;
        fileInput.value = '';
    });

    // GPS Capture
    captureGPSBtn?.addEventListener('click', captureLocation);

    // Form submission
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        submitIncidentReport();
    });

    // Update submit button when required fields change
    document.getElementById('incidentWard')?.addEventListener('change', () => {
        if (uploadedImage) updateValidationScore();
    });

    document.getElementById('incidentType')?.addEventListener('change', () => {
        if (uploadedImage) updateValidationScore();
    });
}

function handleImageUpload(file) {
    console.log('📸 Image uploaded:', file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage = {
            file: file,
            dataURL: e.target.result,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadTime: new Date()
        };

        // Show preview
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('dropzone').style.display = 'none';

        // Run validation
        validateImage();
    };

    reader.readAsDataURL(file);
}

function validateImage() {
    console.log('🔍 Validating image...');

    // Show validation panel
    document.getElementById('validationPanel').style.display = 'block';

    // Reset validation items
    const validationItems = ['validTimestamp', 'validAI', 'validLocation', 'validQuality'];
    validationItems.forEach(id => {
        const elem = document.getElementById(id);
        elem.className = 'validation-item checking';
        elem.querySelector('i').className = 'fas fa-circle-notch fa-spin';
    });

    // Simulate validation checks with delays
    setTimeout(() => validateTimestamp(), 500);
    setTimeout(() => validateAIGenerated(), 1200);
    setTimeout(() => validateLocation(), 1900);
    setTimeout(() => validateQuality(), 2600);
}

function validateTimestamp() {
    const elem = document.getElementById('validTimestamp');

    // Simulate timestamp check (in reality, extract EXIF data)
    const uploadTime = uploadedImage.uploadTime;
    const now = new Date();
    const timeDiff = (now - uploadTime) / 1000 / 60; // minutes

    // Check if photo is recent (within last 24 hours)
    const isRecent = timeDiff < 1440; // 24 hours

    validationResults.timestamp = isRecent;

    if (isRecent) {
        elem.className = 'validation-item pass';
        elem.querySelector('i').className = 'fas fa-check-circle';
        elem.querySelector('span').textContent = '✓ Timestamp verified - Recent photo';
    } else {
        elem.className = 'validation-item warning';
        elem.querySelector('i').className = 'fas fa-exclamation-triangle';
        elem.querySelector('span').textContent = '⚠️ Photo may be old - verify manually';
    }

    updateValidationScore();
}

function validateAIGenerated() {
    const elem = document.getElementById('validAI');

    // Simulate AI detection (in reality, use ML model or API)
    const randomCheck = Math.random();
    const isReal = randomCheck > 0.1; // 90% pass rate for simulation

    validationResults.aiGenerated = isReal;

    if (isReal) {
        elem.className = 'validation-item pass';
        elem.querySelector('i').className = 'fas fa-check-circle';
        elem.querySelector('span').textContent = '✓ Real photo detected';
    } else {
        elem.className = 'validation-item fail';
        elem.querySelector('i').className = 'fas fa-times-circle';
        elem.querySelector('span').textContent = '✗ Possible AI-generated image';
    }

    updateValidationScore();
}

function validateLocation() {
    const elem = document.getElementById('validLocation');

    // Check if GPS was captured or ward selected
    const hasGPS = currentGPS !== null;
    const hasWard = document.getElementById('incidentWard').value !== '';

    validationResults.location = hasGPS || hasWard;

    if (hasGPS) {
        elem.className = 'validation-item pass';
        elem.querySelector('i').className = 'fas fa-check-circle';
        elem.querySelector('span').textContent = '✓ GPS coordinates verified';
    } else if (hasWard) {
        elem.className = 'validation-item warning';
        elem.querySelector('i').className = 'fas fa-exclamation-triangle';
        elem.querySelector('span').textContent = '⚠️ Ward selected, GPS recommended';
    } else {
        elem.className = 'validation-item fail';
        elem.querySelector('i').className = 'fas fa-times-circle';
        elem.querySelector('span').textContent = '✗ Location data missing';
    }

    updateValidationScore();
}

function validateQuality() {
    const elem = document.getElementById('validQuality');

    // Simulate quality check (in reality, check resolution, blur, etc.)
    const fileSize = uploadedImage.size;
    const isGoodQuality = fileSize > 50000 && fileSize < 10000000; // 50KB - 10MB

    validationResults.quality = isGoodQuality;

    if (isGoodQuality) {
        elem.className = 'validation-item pass';
        elem.querySelector('i').className = 'fas fa-check-circle';
        elem.querySelector('span').textContent = '✓ Image quality acceptable';
    } else if (fileSize < 50000) {
        elem.className = 'validation-item warning';
        elem.querySelector('i').className = 'fas fa-exclamation-triangle';
        elem.querySelector('span').textContent = '⚠️ Low resolution image';
    } else {
        elem.className = 'validation-item warning';
        elem.querySelector('i').className = 'fas fa-exclamation-triangle';
        elem.querySelector('span').textContent = '⚠️ File size very large';
    }

    updateValidationScore();
}

function updateValidationScore() {
    // Calculate confidence score based on validation results
    let score = 0;
    let total = 0;

    Object.values(validationResults).forEach(result => {
        if (result !== null) {
            total++;
            if (result === true) score++;
        }
    });

    if (total === 0) return;

    const confidencePercent = Math.round((score / total) * 100);
    const scoreValue = document.getElementById('scoreValue');
    const scoreFill = document.getElementById('scoreFill');

    scoreValue.textContent = `${confidencePercent}%`;
    scoreFill.style.width = `${confidencePercent}%`;

    // Set color based on score
    if (confidencePercent >= 75) {
        scoreFill.className = 'score-fill high';
    } else if (confidencePercent >= 50) {
        scoreFill.className = 'score-fill medium';
    } else {
        scoreFill.className = 'score-fill low';
    }

    // Enable submit button if score is acceptable
    const submitBtn = document.getElementById('submitIncident');
    const hasRequiredFields = document.getElementById('incidentWard').value !== '' &&
        document.getElementById('incidentType').value !== '';

    submitBtn.disabled = !(confidencePercent >= 50 && hasRequiredFields);
}

function captureLocation() {
    const gpsBtn = document.getElementById('captureGPS');
    const gpsDisplay = document.getElementById('gpsDisplay');

    gpsBtn.classList.add('capturing');
    gpsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Capturing...';
    gpsDisplay.innerHTML = `<small>📡 Getting location...</small>`;

    if (navigator.geolocation) {
        // First try with high accuracy (GPS)
        const highAccuracyOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000  // Accept cached position up to 1 minute old
        };

        // Fallback to low accuracy (network-based) if GPS fails
        const lowAccuracyOptions = {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000  // Accept cached position up to 5 minutes old
        };

        const handleSuccess = (position) => {
            currentGPS = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                timestamp: new Date().toISOString()
            };

            gpsBtn.classList.remove('capturing');
            gpsBtn.classList.add('captured');
            gpsBtn.innerHTML = '<i class="fas fa-check"></i> Location Captured';

            // Show accuracy level with color coding
            let accuracyClass = 'good';
            let accuracyText = 'Excellent';
            if (currentGPS.accuracy > 100) {
                accuracyClass = 'poor';
                accuracyText = 'Approximate';
            } else if (currentGPS.accuracy > 50) {
                accuracyClass = 'medium';
                accuracyText = 'Moderate';
            }

            gpsDisplay.classList.add('captured');
            gpsDisplay.innerHTML = `
                <small>
                    📍 <strong>${currentGPS.latitude.toFixed(6)}, ${currentGPS.longitude.toFixed(6)}</strong><br>
                    <span class="accuracy-${accuracyClass}">Accuracy: ±${Math.round(currentGPS.accuracy)}m (${accuracyText})</span>
                </small>
            `;

            // Re-run location validation
            if (uploadedImage) {
                validateLocation();
            }
        };

        const handleError = (error, isHighAccuracy) => {
            console.error('GPS Error:', error);
            
            // If high accuracy failed, try low accuracy as fallback
            if (isHighAccuracy) {
                console.log('High accuracy failed, trying network location...');
                gpsDisplay.innerHTML = `<small>📡 Trying network location...</small>`;
                navigator.geolocation.getCurrentPosition(
                    handleSuccess,
                    (err) => handleError(err, false),
                    lowAccuracyOptions
                );
                return;
            }

            // Both methods failed
            gpsBtn.classList.remove('capturing');
            gpsBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Try Again';

            let errorMsg = 'Location access denied. Please allow location access in browser settings.';
            if (error.code === error.TIMEOUT) {
                errorMsg = 'Location request timed out. Check if GPS/Location is enabled.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                errorMsg = 'Location unavailable. Enable GPS or try outdoors.';
            }

            gpsDisplay.innerHTML = `<small style="color: #FF4757;">⚠️ ${errorMsg}</small>`;
        };

        // Start with high accuracy GPS
        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            (error) => handleError(error, true),
            highAccuracyOptions
        );
    } else {
        gpsBtn.classList.remove('capturing');
        gpsBtn.innerHTML = '<i class="fas fa-times"></i> Not Supported';
        gpsDisplay.innerHTML = `<small style="color: #FF4757;">⚠️ Geolocation not supported by browser</small>`;
    }
}

function submitIncidentReport() {
    console.log('📤 Submitting incident report...');

    const wardSelect = document.getElementById('incidentWard');
    const typeSelect = document.getElementById('incidentType');
    
    const newIncident = {
        id: `INC-${Date.now()}`,
        type: typeSelect.value,
        status: 'pending',
        ward_id: wardSelect.value,
        ward_name: wardSelect.selectedOptions[0]?.text || 'Unknown',
        time: new Date().toISOString(),
        time_display: 'Just now',
        severity: 2,
        description: document.getElementById('incidentDescription').value || 'User-reported incident',
        location: {
            gps: currentGPS,
            ward: wardSelect.value
        },
        validation: {
            score: parseInt(document.getElementById('scoreValue').textContent),
            results: { ...validationResults }
        },
        image: {
            dataURL: uploadedImage?.dataURL,
            captureTime: uploadedImage?.uploadTime?.toISOString(),
            isLiveCapture: uploadedImage?.isLiveCapture || false
        }
    };

    // Add to incidents data (in-memory)
    incidentsData.unshift(newIncident);

    // Store in localStorage for persistence
    saveIncidentToStorage(newIncident);

    // Try to send to backend API
    sendIncidentToBackend(newIncident);

    // Re-render incidents
    renderIncidents();

    // Close modal
    document.getElementById('uploadModal').classList.remove('show');
    resetUploadForm();

    // Show success message
    showIncidentSuccessMessage(newIncident);

    // Switch to incidents tab
    switchPanel('incidents');

    console.log('✅ Incident submitted:', newIncident);
}

// Save incident to localStorage
function saveIncidentToStorage(incident) {
    try {
        const stored = JSON.parse(localStorage.getItem('waterlogging_incidents') || '[]');
        stored.unshift(incident);
        // Keep only last 100 incidents in storage
        if (stored.length > 100) stored.pop();
        localStorage.setItem('waterlogging_incidents', JSON.stringify(stored));
        console.log('💾 Incident saved to localStorage');
    } catch (e) {
        console.warn('Could not save to localStorage:', e);
    }
}

// Send incident to backend API
async function sendIncidentToBackend(incident) {
    try {
        const response = await fetch(`${API_BASE_URL}/incidents`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: incident.type,
                ward_id: incident.ward_id,
                description: incident.description,
                latitude: incident.location.gps?.latitude,
                longitude: incident.location.gps?.longitude,
                accuracy: incident.location.gps?.accuracy,
                severity: incident.severity,
                validation_score: incident.validation.score,
                image_data: incident.image.dataURL?.substring(0, 100) + '...' // Truncated for API
            })
        });
        
        if (response.ok) {
            console.log('✅ Incident sent to backend successfully');
        }
    } catch (e) {
        console.warn('Could not send to backend (will retry later):', e.message);
    }
}

// Show success message
function showIncidentSuccessMessage(incident) {
    const successDiv = document.createElement('div');
    successDiv.className = 'incident-success-toast';
    successDiv.innerHTML = `
        <div style="background: linear-gradient(135deg, #00C896 0%, #00A67E 100%); color: white; padding: 16px 24px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,200,150,0.3); display: flex; align-items: center; gap: 12px;">
            <i class="fas fa-check-circle" style="font-size: 24px;"></i>
            <div>
                <div style="font-weight: 700;">Incident Reported Successfully!</div>
                <div style="font-size: 12px; opacity: 0.9;">ID: ${incident.id} | Validation: ${incident.validation.score}%</div>
            </div>
        </div>
    `;
    successDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; animation: slideIn 0.3s ease;';
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => successDiv.remove(), 300);
    }, 4000);
}

// Export incidents as JSON (for ML model)
function exportIncidentsAsJSON() {
    const incidents = JSON.parse(localStorage.getItem('waterlogging_incidents') || '[]');
    const dataStr = JSON.stringify(incidents, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `waterlogging_incidents_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`📤 Exported ${incidents.length} incidents as JSON`);
}

function resetUploadForm() {
    uploadedImage = null;
    currentGPS = null;
    validationResults = {
        timestamp: null,
        aiGenerated: null,
        location: null,
        quality: null
    };

    document.getElementById('incidentUploadForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('dropzone').style.display = 'block';
    document.getElementById('validationPanel').style.display = 'none';
    document.getElementById('submitIncident').disabled = true;

    const gpsBtn = document.getElementById('captureGPS');
    const gpsDisplay = document.getElementById('gpsDisplay');
    gpsBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Use My Location';
    gpsBtn.classList.remove('capturing');
    gpsDisplay.classList.remove('captured');
    gpsDisplay.innerHTML = '<small>Location not captured</small>';
    
    // Close camera if open
    stopCamera();
}

// ===================================
// LIVE CAMERA FUNCTIONALITY
// ===================================

let cameraStream = null;
let currentFacingMode = 'environment'; // 'environment' for back camera, 'user' for front

function initializeCameraControls() {
    const openCameraBtn = document.getElementById('openCameraBtn');
    const capturePhotoBtn = document.getElementById('capturePhotoBtn');
    const switchCameraBtn = document.getElementById('switchCameraBtn');
    const closeCameraBtn = document.getElementById('closeCameraBtn');
    const retakePhotoBtn = document.getElementById('retakePhotoBtn');
    
    openCameraBtn?.addEventListener('click', startCamera);
    capturePhotoBtn?.addEventListener('click', capturePhoto);
    switchCameraBtn?.addEventListener('click', switchCamera);
    closeCameraBtn?.addEventListener('click', stopCamera);
    retakePhotoBtn?.addEventListener('click', retakePhoto);
}

async function startCamera() {
    console.log('📷 Starting camera...');
    
    const cameraContainer = document.getElementById('cameraContainer');
    const cameraFeed = document.getElementById('cameraFeed');
    const dropzone = document.getElementById('dropzone');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera not supported on this device/browser. Please use file upload instead.');
        return;
    }
    
    try {
        // Stop any existing stream first
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
        }
        
        // Request camera access with constraints
        const constraints = {
            video: {
                facingMode: currentFacingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 },
                aspectRatio: { ideal: 16/9 }
            },
            audio: false
        };
        
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Display video feed
        cameraFeed.srcObject = cameraStream;
        cameraFeed.play();
        
        // Show camera container, hide dropzone
        dropzone.style.display = 'none';
        cameraContainer.style.display = 'block';
        document.getElementById('imagePreview').style.display = 'none';
        
        console.log('✅ Camera started successfully');
        
    } catch (error) {
        console.error('❌ Camera error:', error);
        
        let errorMessage = 'Could not access camera. ';
        if (error.name === 'NotAllowedError') {
            errorMessage += 'Please allow camera access in your browser settings.';
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
            errorMessage += 'Camera is being used by another application.';
        } else {
            errorMessage += error.message;
        }
        
        alert(errorMessage);
    }
}

function capturePhoto() {
    console.log('📸 Capturing photo...');
    
    const cameraFeed = document.getElementById('cameraFeed');
    const cameraContainer = document.getElementById('cameraContainer');
    
    if (!cameraStream) {
        console.error('No camera stream available');
        return;
    }
    
    // Create canvas to capture frame
    const canvas = document.createElement('canvas');
    canvas.width = cameraFeed.videoWidth;
    canvas.height = cameraFeed.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(cameraFeed, 0, 0);
    
    // Convert to data URL
    const dataURL = canvas.toDataURL('image/jpeg', 0.9);
    
    // Stop camera stream
    stopCamera();
    
    // Set as uploaded image
    uploadedImage = {
        file: null,
        dataURL: dataURL,
        name: `live_capture_${Date.now()}.jpg`,
        size: Math.round(dataURL.length * 0.75), // Approximate size
        type: 'image/jpeg',
        uploadTime: new Date(),
        isLiveCapture: true
    };
    
    // Show preview
    document.getElementById('previewImage').src = dataURL;
    document.getElementById('imagePreview').style.display = 'block';
    cameraContainer.style.display = 'none';
    
    // Show retake button
    const retakeBtn = document.getElementById('retakePhotoBtn');
    if (retakeBtn) retakeBtn.style.display = 'inline-flex';
    
    // Run validation
    validateImage();
    
    console.log('✅ Photo captured successfully');
}

async function switchCamera() {
    console.log('🔄 Switching camera...');
    
    // Toggle facing mode
    currentFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
    
    // Restart camera with new facing mode
    if (cameraStream) {
        await startCamera();
    }
}

function stopCamera() {
    console.log('⏹️ Stopping camera...');
    
    const cameraContainer = document.getElementById('cameraContainer');
    const cameraFeed = document.getElementById('cameraFeed');
    const dropzone = document.getElementById('dropzone');
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => {
            track.stop();
        });
        cameraStream = null;
    }
    
    if (cameraFeed) {
        cameraFeed.srcObject = null;
    }
    
    if (cameraContainer) {
        cameraContainer.style.display = 'none';
    }
    
    // Show dropzone only if no image is uploaded
    if (!uploadedImage && dropzone) {
        dropzone.style.display = 'block';
    }
}

function retakePhoto() {
    console.log('🔄 Retaking photo...');
    
    uploadedImage = null;
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('validationPanel').style.display = 'none';
    document.getElementById('submitIncident').disabled = true;
    
    // Hide retake button
    const retakeBtn = document.getElementById('retakePhotoBtn');
    if (retakeBtn) retakeBtn.style.display = 'none';
    
    // Restart camera
    startCamera();
}

// Initialize upload modal on load
document.addEventListener('DOMContentLoaded', () => {
    initializeUploadModal();
    initializeCameraControls();
    
    // Load stored incidents from localStorage
    loadStoredIncidents();
});

// Load previously stored incidents
function loadStoredIncidents() {
    try {
        const stored = JSON.parse(localStorage.getItem('waterlogging_incidents') || '[]');
        if (stored.length > 0) {
            console.log(`📂 Loaded ${stored.length} stored incidents from localStorage`);
            // Merge with existing incidents (avoid duplicates)
            stored.forEach(incident => {
                if (!incidentsData.find(i => i.id === incident.id)) {
                    incidentsData.push(incident);
                }
            });
        }
    } catch (e) {
        console.warn('Could not load stored incidents:', e);
    }
}

console.log('🌧️ Delhi Monsoon Dashboard Script Loaded');
