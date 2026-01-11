// ===================================
// DELHI MONSOON DASHBOARD - JavaScript
// Real-time Data Simulation & Interactivity
// ===================================

// === API CONFIGURATION ===
const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

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
    renderMPIDashboard();
    renderAlerts();
    renderIncidents();
    renderActionCenter();
    renderInfrastructure();
    updateAlertSummary();
    initializeExport();

    // Simulate real-time updates every 30 seconds
    setInterval(() => {
        updateRealTimeData();
    }, 30000);

    console.log('Dashboard Ready!');
});

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
    updateAlertSummary();
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

// === LOAD WARD DATA FROM API ===
async function loadWardData() {
    try {
        console.log('🔄 Loading ward data from API...');
        const response = await fetch(`${API_BASE_URL}/wards`);
        const result = await response.json();
        
        console.log('📊 API Response:', result);
        
        if (result.success && result.data && result.data.length > 0) {
            wardsData = result.data;
            console.log(`✅ Loaded ${result.data.length} wards from API`);
            updateMapWithWards(result.data);
            updateStatistics(result.data);
            updateAlertCounts(result.data);
        } else {
            console.warn('⚠️ No wards in database, using demo data');
            useDemoData();
        }
    } catch (error) {
        console.error('❌ Error loading ward data:', error);
        console.log('📍 Using demo data instead');
        useDemoData();
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
    updateAlertCounts(wardsData);
}

// === RENDER WARDS ON MAP ===
function updateMapWithWards(wards) {
    // Clear existing ward markers
    wardLayer.clearLayers();
    
    const heatMapData = [];

    wards.forEach(ward => {
        // Generate approximate coordinates for Delhi wards
        const coords = getWardCoordinates(ward.zone, ward.id);
        
        // Color based on risk level
        let color = '#00C896'; // safe
        if (ward.risk_level === 'alert') color = '#FFB800';
        if (ward.risk_level === 'critical') color = '#FF4757';
        
        // Create circular marker for ward with better visibility
        const circle = L.circle(coords, {
            color: color,
            fillColor: color,
            fillOpacity: 0.5,
            radius: 1200,
            weight: 3
        }).addTo(wardLayer);
        
        // Add ward name label
        const label = L.marker(coords, {
            icon: L.divIcon({
                className: 'ward-label',
                html: `<div style="
                    background: white;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 600;
                    color: #0A2647;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                    white-space: nowrap;
                    border: 2px solid ${color};
                ">${ward.name}</div>`,
                iconSize: null
            })
        }).addTo(wardLayer);
        
        // Click handler to show detailed card
        circle.on('click', () => {
            showWardInfoCard(ward, color);
        });
        
        label.on('click', () => {
            showWardInfoCard(ward, color);
        });
        
        // Add to heat map data
        const intensity = ward.risk_level === 'critical' ? 1.0 : 
                         ward.risk_level === 'alert' ? 0.6 : 0.3;
        heatMapData.push([coords[0], coords[1], intensity]);
    });
    
    // Add heat map layer
    if (heatLayer) {
        map.removeLayer(heatLayer);
    }
    
    heatLayer = L.heatLayer(heatMapData, {
        radius: 45,
        blur: 40,
        maxZoom: 13,
        max: 1.0,
        gradient: {
            0.0: '#00C896',
            0.5: '#FFB800',
            1.0: '#FF4757'
        }
    }).addTo(map);
}

// === GENERATE WARD COORDINATES ===
function getWardCoordinates(zone, id) {
    // Approximate coordinates for Delhi zones
    const baseCoords = {
        'Central Delhi': [28.6562, 77.2410],
        'North Delhi': [28.7041, 77.1025],
        'South Delhi': [28.5355, 77.2503],
        'East Delhi': [28.6562, 77.2867],
        'West Delhi': [28.6619, 77.1025],
        'New Delhi': [28.6139, 77.2090]
    };
    
    const base = baseCoords[zone] || [28.6139, 77.2090];
    
    // Add some randomness for spread
    const offsetLat = (Math.random() - 0.5) * 0.08;
    const offsetLng = (Math.random() - 0.5) * 0.08;
    
    return [base[0] + offsetLat, base[1] + offsetLng];
}

// === SHOW WARD INFO CARD ===
function showWardInfoCard(ward, color) {
    const card = document.getElementById('wardInfoCard');
    const content = document.getElementById('wardCardContent');
    
    // Calculate risk percentage
    const riskPercent = Math.round((ward.forecast_rainfall_3h || 0) / (ward.failure_threshold || 60) * 100);
    
    content.innerHTML = `
        <div style="border-left: 4px solid ${color}; padding-left: 16px;">
            <h3 style="margin: 0 0 12px 0; color: ${color}; font-size: 1.4rem;">
                <i class="fas fa-map-marker-alt"></i> ${ward.name}
            </h3>
            <p style="color: #546E7A; margin: 0 0 16px 0; font-size: 0.9rem;">
                <i class="fas fa-layer-group"></i> ${ward.zone}
            </p>
        </div>
        
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 16px; border-radius: 12px; margin: 16px 0;">
            <div style="text-align: center;">
                <div style="font-size: 3rem; font-weight: 800; color: ${color}; margin-bottom: 8px;">
                    ${ward.mpi_score}
                </div>
                <div style="color: #0A2647; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">
                    MPI Score
                </div>
                <div style="margin-top: 8px; padding: 6px 12px; background: ${color}; color: white; border-radius: 20px; display: inline-block; font-size: 0.85rem; font-weight: 600;">
                    ${ward.risk_level.toUpperCase()}
                </div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0;">
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="color: #546E7A; font-size: 0.75rem; margin-bottom: 4px;">
                    <i class="fas fa-cloud-rain"></i> Current Rainfall
                </div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #2C74B3;">
                    ${ward.current_rainfall}<span style="font-size: 0.8rem; color: #546E7A;">mm</span>
                </div>
            </div>
            
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="color: #546E7A; font-size: 0.75rem; margin-bottom: 4px;">
                    <i class="fas fa-cloud-showers-heavy"></i> Forecast (3h)
                </div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #FFB800;">
                    ${ward.forecast_rainfall_3h || 0}<span style="font-size: 0.8rem; color: #546E7A;">mm</span>
                </div>
            </div>
            
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="color: #546E7A; font-size: 0.75rem; margin-bottom: 4px;">
                    <i class="fas fa-water"></i> Drainage Stress
                </div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #FF4757;">
                    ${ward.drainage_stress_index}<span style="font-size: 0.8rem; color: #546E7A;">%</span>
                </div>
            </div>
            
            <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="color: #546E7A; font-size: 0.75rem; margin-bottom: 4px;">
                    <i class="fas fa-road"></i> Pothole Density
                </div>
                <div style="font-size: 1.5rem; font-weight: 700; color: #546E7A;">
                    ${ward.pothole_density || 0}<span style="font-size: 0.8rem; color: #546E7A;">%</span>
                </div>
            </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-top: 16px;">
            <div style="color: #546E7A; font-size: 0.85rem; margin-bottom: 8px;">
                <i class="fas fa-exclamation-triangle"></i> <strong>Failure Threshold:</strong> ${ward.failure_threshold || 60}mm
            </div>
            <div style="color: #546E7A; font-size: 0.85rem;">
                <i class="fas fa-chart-line"></i> <strong>Risk Level:</strong> ${riskPercent}% of threshold
            </div>
        </div>
        
        <div style="margin-top: 16px; font-size: 0.75rem; color: #9BA5AD;">
            <i class="fas fa-clock"></i> Last updated: ${new Date(ward.last_updated || Date.now()).toLocaleString()}
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
    socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
        console.log('✅ Connected to real-time updates');
    });
    
    socket.on('ward-update', (data) => {
        console.log('🔄 Ward update received:', data);
        // Reload ward data
        loadWardData();
    });
    
    socket.on('incident-new', (data) => {
        console.log('🚨 New incident:', data);
        // Reload incidents
        loadIncidents();
    });
    
    socket.on('alert-new', (data) => {
        console.log('⚠️ New alert:', data);
        showNotification('New Alert', data.message);
    });
    
    socket.on('disconnect', () => {
        console.log('❌ Disconnected from real-time updates');
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
    updateMPIGrid(wards);
}

// === UPDATE ALERT COUNTS ===
function updateAlertCounts(wards) {
    const criticalCount = wards.filter(w => w.risk_level === 'critical').length;
    const warningCount = wards.filter(w => w.risk_level === 'alert').length;
    const safeCount = wards.filter(w => w.risk_level === 'safe').length;
    
    document.getElementById('criticalCount').textContent = criticalCount;
    document.getElementById('warningCount').textContent = warningCount;
    document.getElementById('safeCount').textContent = safeCount;
}

// === NOTIFICATION ===
function showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message });
    }
}

function createInteractiveMap() {
    // Legacy SVG map - replaced by Leaflet
    let svg = `
        <svg viewBox="0 0 800 600" style="width: 100%; height: 100%;">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
            </defs>
    `;

    // Create a grid of ward regions (5 rows x 5 cols)
    const rows = 5;
    const cols = 5;
    const regionWidth = 800 / cols;
    const regionHeight = 600 / rows;
    let wardIndex = 0;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (wardIndex >= wardsData.length) break;

            const ward = wardsData[wardIndex];
            const x = col * regionWidth;
            const y = row * regionHeight;

            let fillColor = '#00C896'; // Safe
            if (ward.riskLevel === 'alert') fillColor = '#FFB800';
            if (ward.riskLevel === 'critical') fillColor = '#FF4757';

            svg += `
                <g class="ward-region" data-ward-id="${ward.id}" style="cursor: pointer;">
                    <rect 
                        x="${x + 2}" 
                        y="${y + 2}" 
                        width="${regionWidth - 4}" 
                        height="${regionHeight - 4}" 
                        fill="${fillColor}" 
                        fill-opacity="0.6"
                        stroke="#ffffff"
                        stroke-width="2"
                        rx="8"
                        class="ward-shape"
                        style="transition: all 0.3s ease;"
                    />
                    <text 
                        x="${x + regionWidth / 2}" 
                        y="${y + regionHeight / 2}" 
                        text-anchor="middle" 
                        fill="#0A2647" 
                        font-size="12" 
                        font-weight="700"
                        pointer-events="none"
                    >
                        ${ward.name.split(' - ')[0].substring(0, 8)}
                    </text>
                    <text 
                        x="${x + regionWidth / 2}" 
                        y="${y + regionHeight / 2 + 15}" 
                        text-anchor="middle" 
                        fill="#0A2647" 
                        font-size="10" 
                        font-weight="600"
                        pointer-events="none"
                    >
                        MPI: ${ward.mpiScore}
                    </text>
                </g>
            `;

            wardIndex++;
        }
    }

    svg += `</svg>`;
    return svg;
}

function showWardTooltip(wardId, event) {
    // Create or update tooltip (simplified for now)
    console.log(`Showing tooltip for ward ${wardId}`);
}

function hideWardTooltip() {
    // Hide tooltip
}

function showWardDetails(wardId) {
    const ward = wardsData.find(w => w.id === wardId);
    if (!ward) return;

    const modal = document.getElementById('wardModal');
    const modalWardName = document.getElementById('modalWardName');
    const modalBody = document.getElementById('modalBody');

    modalWardName.textContent = ward.name;

    modalBody.innerHTML = `
        <div style="display: grid; gap: 16px;">
            <div>
                <h4 style="color: #144272; margin-bottom: 8px;">Monsoon Preparedness Index</h4>
                <div style="font-size: 2.5rem; font-weight: 800; background: linear-gradient(135deg, #0A2647 0%, #2C74B3 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                    ${ward.mpiScore}/100
                </div>
                <div style="height: 8px; background: #E8ECEF; border-radius: 4px; overflow: hidden; margin-top: 8px;">
                    <div style="height: 100%; width: ${ward.mpiScore}%; background: linear-gradient(135deg, #2C74B3 0%, #00D9FF 100%);"></div>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 16px; background: #F8FAFB; border-radius: 12px;">
                <div>
                    <div style="font-size: 0.85rem; color: #546E7A; margin-bottom: 4px;">Current Rainfall</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #2C74B3;">${ward.currentRainfall}mm</div>
                </div>
                <div>
                    <div style="font-size: 0.85rem; color: #546E7A; margin-bottom: 4px;">Forecast (3h)</div>
                    <div style="font-size: 1.5rem; font-weight: 700; color: #144272;">${ward.forecastRainfall}mm</div>
                </div>
            </div>
            
            <div>
                <h4 style="color: #144272; margin-bottom: 8px;">Failure Threshold</h4>
                <div style="font-size: 1.75rem; font-weight: 700; color: #FF4757;">${ward.threshold}mm</div>
                <div style="font-size: 0.9rem; color: #546E7A; margin-top: 4px;">
                    Currently at ${Math.round((ward.forecastRainfall / ward.threshold) * 100)}% of threshold
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="padding: 12px; background: #F8FAFB; border-radius: 8px;">
                    <div style="font-size: 0.85rem; color: #546E7A; margin-bottom: 4px;">Drainage Stress</div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: #0A2647;">${ward.drainageStress}%</div>
                </div>
                <div style="padding: 12px; background: #F8FAFB; border-radius: 8px;">
                    <div style="font-size: 0.85rem; color: #546E7A; margin-bottom: 4px;">Pothole Density</div>
                    <div style="font-size: 1.25rem; font-weight: 700; color: #0A2647;">${ward.potholeDensity}%</div>
                </div>
            </div>
            
            <div style="padding: 12px; background: rgba(44, 116, 179, 0.05); border-radius: 8px; border-left: 3px solid #2C74B3;">
                <strong style="color: #144272;">Risk Level:</strong> 
                <span style="text-transform: uppercase; font-weight: 700; color: ${ward.riskLevel === 'critical' ? '#FF4757' : ward.riskLevel === 'alert' ? '#FFB800' : '#00C896'};">
                    ${ward.riskLevel}
                </span>
            </div>
        </div>
    `;

    modal.classList.add('show');
}

document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('wardModal').classList.remove('show');
});

// === MPI DASHBOARD ===
function renderMPIDashboard(wards = wardsData) {
    const mpiGrid = document.getElementById('mpiGrid');
    if (!mpiGrid) return;

    mpiGrid.innerHTML = wards.slice(0, 12).map(ward => {
        const statusClass = ward.status;
        const statusLabel = ward.status === 'ready' ? 'Ready' : ward.status === 'risk' ? 'At Risk' : 'Critical';

        return `
            <div class="mpi-card status-${statusClass}" onclick="showWardDetails(${ward.id})">
                <div class="mpi-card-header">
                    <div class="ward-name">${ward.name}</div>
                    <div class="mpi-badge ${statusClass}">${statusLabel}</div>
                </div>
                
                <div class="mpi-score-container">
                    <div class="mpi-score">${ward.mpiScore}</div>
                    <div class="mpi-label">Preparedness Index</div>
                </div>
                
                <div class="mpi-progress-bar">
                    <div class="mpi-progress-fill ${statusClass}" style="width: ${ward.mpiScore}%;"></div>
                </div>
                
                <div class="mpi-details">
                    <div class="mpi-detail-item">
                        <span><i class="fas fa-tint"></i> Rainfall</span>
                        <strong>${ward.currentRainfall}mm</strong>
                    </div>
                    <div class="mpi-detail-item">
                        <span><i class="fas fa-chart-line"></i> Forecast</span>
                        <strong>${ward.forecastRainfall}mm</strong>
                    </div>
                    <div class="mpi-detail-item">
                        <span><i class="fas fa-exclamation-triangle"></i> Threshold</span>
                        <strong>${ward.threshold}mm</strong>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// === RAINFALL ALERTS ===
function renderAlerts() {
    const alertTimeline = document.getElementById('alertTimeline');
    if (!alertTimeline) return;

    const alertWards = wardsData.filter(w => w.forecastRainfall > w.threshold * 0.5).slice(0, 8);

    alertTimeline.innerHTML = alertWards.map(ward => {
        const thresholdPercent = Math.round((ward.forecastRainfall / ward.threshold) * 100);
        let severity = 'low';
        if (thresholdPercent > 90) severity = 'high';
        else if (thresholdPercent > 60) severity = 'medium';

        const timeWindow = `${Math.floor(Math.random() * 3) + 1}h ${Math.floor(Math.random() * 60)}m`;

        return `
            <div class="alert-card severity-${severity}">
                <div class="alert-card-header">
                    <div class="alert-ward">${ward.name}</div>
                    <div class="alert-time">
                        <i class="fas fa-clock"></i>
                        ${timeWindow}
                    </div>
                </div>
                
                <div class="alert-comparison">
                    <div class="comparison-item">
                        <div class="comparison-label">Forecast Rainfall</div>
                        <div class="comparison-value forecast">${ward.forecastRainfall}mm</div>
                    </div>
                    <div class="comparison-item">
                        <div class="comparison-label">Failure Threshold</div>
                        <div class="comparison-value threshold">${ward.threshold}mm</div>
                    </div>
                </div>
                
                <div class="alert-message">
                    <strong>${thresholdPercent}% of threshold</strong> - 
                    ${severity === 'high' ? '⚠️ Immediate action required' : severity === 'medium' ? '⚡ Monitor closely' : '✓ Under watch'}
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

// === ACTION CENTER ===
function renderActionCenter() {
    // Drain Clearing Priority
    const drainPriority = document.getElementById('drainPriority');
    if (drainPriority) {
        const highStressWards = wardsData
            .filter(w => w.drainageStress > 60)
            .sort((a, b) => b.drainageStress - a.drainageStress)
            .slice(0, 5);

        drainPriority.innerHTML = highStressWards.map(ward => {
            const priority = ward.drainageStress > 80 ? 'urgent' : ward.drainageStress > 70 ? 'high' : 'medium';
            return `
                <div class="priority-item ${priority}">
                    <div class="item-header">
                        <div class="item-title">${ward.name}</div>
                        <div class="priority-badge ${priority}">${priority}</div>
                    </div>
                    <div class="item-description">
                        Drainage stress: ${ward.drainageStress}% - Deploy cleaning crew immediately
                    </div>
                </div>
            `;
        }).join('');
    }

    // Rapid Response Deployment
    const deploymentList = document.getElementById('deploymentList');
    if (deploymentList) {
        const criticalWards = wardsData.filter(w => w.riskLevel === 'critical').slice(0, 5);

        deploymentList.innerHTML = criticalWards.map(ward => {
            const units = Math.floor(Math.random() * 3) + 2;
            return `
                <div class="deployment-item">
                    <div class="item-header">
                        <div class="item-title">${ward.name}</div>
                        <div class="priority-badge urgent">${units} Units</div>
                    </div>
                    <div class="item-description">
                        🚒 Pumping units: ${units} | 👷 Repair crews: ${Math.floor(units / 2)}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Traffic Diversion
    const trafficList = document.getElementById('trafficList');
    if (trafficList) {
        const riskWards = wardsData.filter(w => w.riskLevel !== 'safe').slice(0, 4);

        trafficList.innerHTML = riskWards.map(ward => {
            return `
                <div class="traffic-item">
                    <div class="item-header">
                        <div class="item-title">${ward.name}</div>
                        <div class="priority-badge high">High Risk</div>
                    </div>
                    <div class="item-description">
                        🚗 Divert traffic via alternate route - Expected delay: ${Math.floor(Math.random() * 20) + 10} min
                    </div>
                </div>
            `;
        }).join('');
    }
}

// === INFRASTRUCTURE ===
function renderInfrastructure() {
    // Drainage Stress
    const drainageStress = document.getElementById('drainageStress');
    if (drainageStress) {
        const topStress = wardsData
            .sort((a, b) => b.drainageStress - a.drainageStress)
            .slice(0, 6);

        drainageStress.innerHTML = topStress.map(ward => {
            const level = ward.drainageStress > 70 ? 'high' : ward.drainageStress > 40 ? 'medium' : 'low';
            return `
                <div class="stress-item">
                    <div class="stress-header">
                        <div class="stress-ward">${ward.name}</div>
                        <div class="stress-level">${ward.drainageStress}%</div>
                    </div>
                    <div class="stress-bar">
                        <div class="stress-fill ${level}" style="width: ${ward.drainageStress}%;"></div>
                    </div>
                    <div class="item-description">
                        ${level === 'high' ? '🔴 Critical - Immediate maintenance' : level === 'medium' ? '🟡 Monitor closely' : '🟢 Operating normally'}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Pothole Density
    const potholeDensity = document.getElementById('potholeDensity');
    if (potholeDensity) {
        const topDensity = wardsData
            .sort((a, b) => b.potholeDensity - a.potholeDensity)
            .slice(0, 6);

        potholeDensity.innerHTML = topDensity.map(ward => {
            const level = ward.potholeDensity > 70 ? 'high' : ward.potholeDensity > 40 ? 'medium' : 'low';
            return `
                <div class="density-item">
                    <div class="density-header">
                        <div class="density-ward">${ward.name}</div>
                        <div class="density-level">${ward.potholeDensity}%</div>
                    </div>
                    <div class="density-bar">
                        <div class="density-fill ${level}" style="width: ${ward.potholeDensity}%;"></div>
                    </div>
                    <div class="item-description">
                        ${level === 'high' ? '🔴 High density - Schedule repairs' : level === 'medium' ? '🟡 Moderate - Plan maintenance' : '🟢 Low density'}
                    </div>
                </div>
            `;
        }).join('');
    }
}

// === ALERT SUMMARY ===
function updateAlertSummary() {
    const criticalCount = wardsData.filter(w => w.riskLevel === 'critical').length;
    const warningCount = wardsData.filter(w => w.riskLevel === 'alert').length;
    const safeCount = wardsData.filter(w => w.riskLevel === 'safe').length;

    document.getElementById('criticalCount').textContent = criticalCount;
    document.getElementById('warningCount').textContent = warningCount;
    document.getElementById('safeCount').textContent = safeCount;
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
    renderActionCenter();
    renderInfrastructure();
    updateAlertSummary();

    // Update map
    const mapElement = document.getElementById('riskMap');
    if (mapElement) {
        mapElement.innerHTML = createInteractiveMap();

        // Re-attach event listeners
        document.querySelectorAll('.ward-region').forEach(region => {
            region.addEventListener('click', (e) => {
                const wardId = parseInt(e.currentTarget.getAttribute('data-ward-id'));
                showWardDetails(wardId);
            });
        });
    }

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
    const browseBtn = document.getElementById('browseBtn');
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

    // Drag and drop
    dropzone?.addEventListener('click', () => fileInput.click());
    browseBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
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

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentGPS = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };

                gpsBtn.classList.remove('capturing');
                gpsBtn.innerHTML = '<i class="fas fa-check"></i> Location Captured';

                gpsDisplay.classList.add('captured');
                gpsDisplay.innerHTML = `
                    <small>
                        📍 ${currentGPS.latitude.toFixed(6)}, ${currentGPS.longitude.toFixed(6)}<br>
                        Accuracy: ±${Math.round(currentGPS.accuracy)}m
                    </small>
                `;

                // Re-run location validation
                if (uploadedImage) {
                    validateLocation();
                }
            },
            (error) => {
                console.error('GPS Error:', error);
                gpsBtn.classList.remove('capturing');
                gpsBtn.innerHTML = '<i class="fas fa-location-arrow"></i> Try Again';

                gpsDisplay.innerHTML = '<small style="color: #FF4757;">⚠️ Location access denied</small>';

                alert('Please enable location permissions to capture GPS coordinates.');
            }
        );
    } else {
        gpsBtn.classList.remove('capturing');
        gpsBtn.innerHTML = '<i class="fas fa-times"></i> Not Supported';
        alert('Geolocation is not supported by your browser.');
    }
}

function submitIncidentReport() {
    console.log('📤 Submitting incident report...');

    const newIncident = {
        id: incidentsData.length + 1,
        type: document.getElementById('incidentType').value,
        status: 'pending',
        ward: document.getElementById('incidentWard').selectedOptions[0].text,
        time: 'Just now',
        severity: 2,
        description: document.getElementById('incidentDescription').value || 'User-reported incident',
        gps: currentGPS,
        validationScore: parseInt(document.getElementById('scoreValue').textContent),
        image: uploadedImage?.dataURL
    };

    // Add to incidents data
    incidentsData.unshift(newIncident);

    // Re-render incidents
    renderIncidents();

    // Close modal
    document.getElementById('uploadModal').classList.remove('show');

    // Show success message
    alert('✅ Incident reported successfully! Authorities will review your submission.');

    // Switch to incidents tab
    switchPanel('incidents');

    console.log('Incident submitted:', newIncident);
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
}

// Initialize upload modal on load
document.addEventListener('DOMContentLoaded', () => {
    initializeUploadModal();
});

console.log('🌧️ Delhi Monsoon Dashboard Script Loaded');
