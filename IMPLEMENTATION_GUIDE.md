# 🚀 Delhi Water-Logging Dashboard - Complete Implementation Guide

## 📋 Table of Contents
1. [Database Setup](#database-setup)
2. [Backend Development](#backend-development)
3. [Weather API Integration](#weather-api-integration)
4. [Map Enhancement](#map-enhancement)
5. [Analytics Implementation](#analytics-implementation)
6. [Advanced Features](#advanced-features)
7. [Deployment](#deployment)

---

## 1. 🗄️ Database Setup

### Step 1: Setup Supabase Project

1. **Create Supabase Project**
   ```
   - Go to https://supabase.com
   - Create new project
   - Note down:
     * Project URL
     * Anon/Public Key
     * Service Role Key (keep secret!)
   ```

2. **Enable PostGIS Extension**
   - Go to SQL Editor in Supabase
   - Run: `CREATE EXTENSION IF NOT EXISTS postgis;`

3. **Run Schema**
   - Copy contents of `database/schema.sql`
   - Paste in SQL Editor
   - Execute (may take 2-3 minutes)

4. **Run Seed Data**
   - Copy contents of `database/seed_data.sql`
   - Paste in SQL Editor
   - Execute

5. **Verify Installation**
   ```sql
   -- Check tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Check data
   SELECT * FROM wards LIMIT 5;
   ```

### Step 2: Configure Row Level Security (RLS)

```sql
-- Public read access for dashboard
CREATE POLICY "Allow public read access to wards"
ON wards FOR SELECT TO anon USING (true);

CREATE POLICY "Allow public read access to incidents"
ON incidents FOR SELECT TO anon USING (true);

-- Authenticated users can create incidents
CREATE POLICY "Allow authenticated users to report incidents"
ON incidents FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reported_by);

-- Admins have full access
CREATE POLICY "Admins have full access"
ON ALL TABLES TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

---

## 2. 🔧 Backend Development

### Project Structure

```
backend/
├── .env
├── .env.example
├── package.json
├── server.js
├── config/
│   ├── supabase.js
│   ├── imd-api.js
│   └── multer.js
├── routes/
│   ├── wards.js
│   ├── incidents.js
│   ├── alerts.js
│   ├── weather.js
│   ├── infrastructure.js
│   └── analytics.js
├── controllers/
│   ├── wardController.js
│   ├── incidentController.js
│   ├── alertController.js
│   ├── weatherController.js
│   └── analyticsController.js
├── services/
│   ├── imdService.js
│   ├── mlService.js
│   ├── notificationService.js
│   └── websocketService.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   ├── validator.js
│   └── rateLimiter.js
└── utils/
    ├── logger.js
    ├── gis.js
    └── helpers.js
```

### Installation

```bash
# Navigate to project root
cd "C:\Users\OSHI SHARMA\WaterLogging"

# Create backend folder
mkdir backend
cd backend

# Initialize Node.js project
npm init -y

# Install dependencies
npm install express cors dotenv
npm install @supabase/supabase-js
npm install axios
npm install socket.io
npm install multer
npm install express-validator
npm install express-rate-limit
npm install bcryptjs jsonwebtoken
npm install nodemailer twilio
npm install pdfkit
npm install winston
npm install nodemon --save-dev

# Update package.json scripts
```

**package.json scripts:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Test pending\""
  }
}
```

### Environment Variables (.env)

```env
# Server
NODE_ENV=development
PORT=5000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# IMD Weather API
IMD_API_KEY=your-imd-api-key
IMD_API_URL=https://api.imd.gov.in/v1

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Push Notifications (Firebase - optional)
FIREBASE_SERVER_KEY=your-firebase-server-key

# WebSocket
WEBSOCKET_PORT=3001

# Frontend URL
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg
```

### Core Files

**config/supabase.js**
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
```

**server.js**
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const wardRoutes = require('./routes/wards');
const incidentRoutes = require('./routes/incidents');
const alertRoutes = require('./routes/alerts');
const weatherRoutes = require('./routes/weather');
const infrastructureRoutes = require('./routes/infrastructure');
const analyticsRoutes = require('./routes/analytics');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import services
const websocketService = require('./services/websocketService');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Routes
app.use('/api/wards', wardRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/infrastructure', infrastructureRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error handling
app.use(errorHandler);

// Initialize WebSocket
websocketService.initialize(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket enabled on port ${PORT}`);
});

module.exports = { app, io };
```

### API Endpoints Structure

**routes/wards.js**
```javascript
const express = require('express');
const router = express.Router();
const wardController = require('../controllers/wardController');

// GET all wards with filters
router.get('/', wardController.getAllWards);

// GET single ward by ID
router.get('/:id', wardController.getWardById);

// GET ward summary
router.get('/:id/summary', wardController.getWardSummary);

// UPDATE ward data (admin only)
router.put('/:id', wardController.updateWard);

module.exports = router;
```

**controllers/wardController.js**
```javascript
const supabase = require('../config/supabase');

exports.getAllWards = async (req, res) => {
    try {
        const { zone, risk_level, limit = 50 } = req.query;
        
        let query = supabase
            .from('wards')
            .select('*')
            .order('name');
        
        if (zone && zone !== 'all') {
            query = query.ilike('zone', `%${zone}%`);
        }
        
        if (risk_level && risk_level !== 'all') {
            query = query.eq('risk_level', risk_level);
        }
        
        query = query.limit(limit);
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        res.status(200).json({
            success: true,
            count: data.length,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getWardById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabase
            .rpc('get_ward_details', { p_ward_id: parseInt(id) });
        
        if (error) throw error;
        
        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// More controller methods...
```

---

## 3. 🌦️ Weather API Integration

### IMD API Integration

**services/imdService.js**
```javascript
const axios = require('axios');

class IMDService {
    constructor() {
        this.baseURL = process.env.IMD_API_URL;
        this.apiKey = process.env.IMD_API_KEY;
    }
    
    async getCurrentWeather(latitude, longitude) {
        try {
            const response = await axios.get(`${this.baseURL}/weather/current`, {
                params: { lat: latitude, lon: longitude },
                headers: { 'X-API-Key': this.apiKey }
            });
            return response.data;
        } catch (error) {
            console.error('IMD API Error:', error);
            throw error;
        }
    }
    
    async getForecast(latitude, longitude, hours = 24) {
        try {
            const response = await axios.get(`${this.baseURL}/weather/forecast`, {
                params: { lat: latitude, lon: longitude, hours: hours },
                headers: { 'X-API-Key': this.apiKey }
            });
            return response.data;
        } catch (error) {
            console.error('IMD Forecast Error:', error);
            throw error;
        }
    }
    
    async getRainfallData(stationId, startDate, endDate) {
        try {
            const response = await axios.get(`${this.baseURL}/rainfall/station/${stationId}`, {
                params: { start: startDate, end: endDate },
                headers: { 'X-API-Key': this.apiKey }
            });
            return response.data;
        } catch (error) {
            console.error('IMD Rainfall Error:', error);
            throw error;
        }
    }
}

module.exports = new IMDService();
```

### Weather Data Sync Job

```javascript
const cron = require('node-cron');
const imdService = require('./services/imdService');
const supabase = require('./config/supabase');

// Sync weather data every 15 minutes
cron.schedule('*/15 * * * *', async () => {
    console.log('🌦️ Syncing weather data...');
    
    try {
        // Get all weather stations
        const { data: stations } = await supabase
            .from('weather_stations')
            .select('*')
            .eq('is_active', true);
        
        for (const station of stations) {
            const weatherData = await imdService.getCurrentWeather(
                station.location.coordinates[1],
                station.location.coordinates[0]
            );
            
            // Insert rainfall reading
            await supabase.from('rainfall_readings').insert({
                station_id: station.id,
                ward_id: station.ward_id,
                rainfall_mm: weatherData.rainfall,
                temperature_celsius: weatherData.temperature,
                humidity_percent: weatherData.humidity,
                wind_speed_kmph: weatherData.wind_speed,
                pressure_mb: weatherData.pressure,
                recorded_at: new Date(),
                source: 'IMD'
            });
            
            // Update ward with latest rainfall
            await supabase
                .from('wards')
                .update({ current_rainfall: weatherData.rainfall })
                .eq('id', station.ward_id);
        }
        
        console.log('✅ Weather data synced successfully');
    } catch (error) {
        console.error('❌ Weather sync failed:', error);
    }
});
```

---

## 4. 🗺️ Map Enhancement

### Install Leaflet.js

```bash
npm install leaflet
```

### Frontend Map Implementation

**Create: `js/map.js`**

```javascript
// Import Leaflet
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

class DelhiMap {
    constructor(containerId) {
        this.map = null;
        this.containerId = containerId;
        this.layers = {
            wards: null,
            incidents: null,
            drainage: null,
            heatmap: null
        };
        this.init();
    }
    
    init() {
        // Initialize map centered on Delhi
        this.map = L.map(this.containerId).setView([28.6139, 77.2090], 11);
        
        // Add base tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);
        
        this.loadWardBoundaries();
        this.loadIncidents();
    }
    
    async loadWardBoundaries() {
        try {
            const response = await fetch('/api/wards?include_geometry=true');
            const data = await response.json();
            
            this.layers.wards = L.geoJSON(data.data, {
                style: (feature) => this.getWardStyle(feature),
                onEachFeature: (feature, layer) => {
                    layer.bindPopup(this.createWardPopup(feature));
                    layer.on('click', () => this.onWardClick(feature));
                }
            }).addTo(this.map);
        } catch (error) {
            console.error('Failed to load ward boundaries:', error);
        }
    }
    
    getWardStyle(feature) {
        const riskLevel = feature.properties.risk_level;
        let fillColor = '#00C896'; // Safe
        
        if (riskLevel === 'alert') fillColor = '#FFB800';
        if (riskLevel === 'critical') fillColor = '#FF4757';
        
        return {
            fillColor: fillColor,
            weight: 2,
            opacity: 1,
            color: 'white',
            fillOpacity: 0.6
        };
    }
    
    createWardPopup(feature) {
        const props = feature.properties;
        return `
            <div class="ward-popup">
                <h3>${props.name}</h3>
                <p><strong>MPI Score:</strong> ${props.mpi_score}</p>
                <p><strong>Risk Level:</strong> ${props.risk_level}</p>
                <p><strong>Rainfall:</strong> ${props.current_rainfall}mm</p>
                <button onclick="viewWardDetails(${props.id})">View Details</button>
            </div>
        `;
    }
    
    async loadIncidents() {
        try {
            const response = await fetch('/api/incidents?status=verified,pending');
            const data = await response.json();
            
            const markers = [];
            data.data.forEach(incident => {
                const icon = this.getIncidentIcon(incident.type, incident.severity);
                const marker = L.marker(
                    [incident.location.coordinates[1], incident.location.coordinates[0]],
                    { icon: icon }
                );
                
                marker.bindPopup(this.createIncidentPopup(incident));
                markers.push(marker);
            });
            
            this.layers.incidents = L.layerGroup(markers).addTo(this.map);
        } catch (error) {
            console.error('Failed to load incidents:', error);
        }
    }
    
    getIncidentIcon(type, severity) {
        const colors = {
            low: '#00C896',
            medium: '#FFB800',
            high: '#FF6B00',
            critical: '#FF4757'
        };
        
        const icons = {
            waterlogging: '💧',
            pothole: '🕳️',
            drainage_block: '🚧'
        };
        
        return L.divIcon({
            html: `<div style="background: ${colors[severity]}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${icons[type]}</div>`,
            className: 'custom-incident-icon',
            iconSize: [30, 30]
        });
    }
    
    createIncidentPopup(incident) {
        return `
            <div class="incident-popup">
                <h4>${incident.type}</h4>
                <p><strong>Status:</strong> ${incident.status}</p>
                <p><strong>Severity:</strong> ${incident.severity}</p>
                <p>${incident.description}</p>
                <small>${new Date(incident.reported_at).toLocaleString()}</small>
            </div>
        `;
    }
    
    toggleLayer(layerName, visible) {
        if (this.layers[layerName]) {
            if (visible) {
                this.map.addLayer(this.layers[layerName]);
            } else {
                this.map.removeLayer(this.layers[layerName]);
            }
        }
    }
}

// Initialize map
const delhiMap = new DelhiMap('riskMap');
```

---

## 5. 📊 Analytics Implementation

### Install Chart.js

```bash
npm install chart.js
```

### Analytics Dashboard

**Create: `js/analytics.js`**

```javascript
import Chart from 'chart.js/auto';

class Analytics {
    constructor() {
        this.charts = {};
        this.initCharts();
    }
    
    async initCharts() {
        await this.createAccuracyChart();
        await this.createIncidentTrendChart();
        await this.createRainfallChart();
    }
    
    async createAccuracyChart() {
        const response = await fetch('/api/analytics/prediction-accuracy?days=7');
        const data = await response.json();
        
        const ctx = document.getElementById('accuracyChart').getContext('2d');
        this.charts.accuracy = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.data.map(d => d.date),
                datasets: [
                    {
                        label: 'Predicted Incidents',
                        data: data.data.map(d => d.predicted),
                        borderColor: '#2C74B3',
                        backgroundColor: 'rgba(44, 116, 179, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Actual Incidents',
                        data: data.data.map(d => d.actual),
                        borderColor: '#FF4757',
                        backgroundColor: 'rgba(255, 71, 87, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Predicted vs Actual Incidents (Last 7 Days)'
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    async createIncidentTrendChart() {
        const response = await fetch('/api/analytics/incident-trends?days=30');
        const data = await response.json();
        
        const ctx = document.getElementById('trendChart').getContext('2d');
        this.charts.trend = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.data.map(d => d.date),
                datasets: [
                    {
                        label: 'Water-logging',
                        data: data.data.map(d => d.waterlogging),
                        backgroundColor: '#2C74B3'
                    },
                    {
                        label: 'Potholes',
                        data: data.data.map(d => d.potholes),
                        backgroundColor: '#FFB800'
                    },
                    {
                        label: 'Drainage Blocks',
                        data: data.data.map(d => d.drainage),
                        backgroundColor: '#FF4757'
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Incident Trends (Last 30 Days)'
                    }
                },
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, beginAtZero: true }
                }
            }
        });
    }
}

// Initialize analytics
const analytics = new Analytics();
```

---

## 6. 🔔 Advanced Features

### A. Push Notifications

**services/notificationService.js**

```javascript
const nodemailer = require('nodemailer');
const twilio = require('twilio');

class NotificationService {
    constructor() {
        // Email setup
        this.emailTransporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
        
        // SMS setup
        this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
    }
    
    async sendEmail(to, subject, html) {
        try {
            await this.emailTransporter.sendMail({
                from: process.env.EMAIL_USER,
                to: to,
                subject: subject,
                html: html
            });
            console.log(`✅ Email sent to ${to}`);
        } catch (error) {
            console.error('Email error:', error);
        }
    }
    
    async sendSMS(to, message) {
        try {
            await this.twilioClient.messages.create({
                body: message,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });
            console.log(`✅ SMS sent to ${to}`);
        } catch (error) {
            console.error('SMS error:', error);
        }
    }
    
    async sendAlert(alert) {
        const users = await this.getUsersForAlert(alert);
        
        for (const user of users) {
            const prefs = user.notification_preferences;
            
            if (prefs.email) {
                await this.sendEmail(
                    user.email,
                    `Alert: ${alert.title}`,
                    this.getAlertEmailTemplate(alert)
                );
            }
            
            if (prefs.sms && user.phone) {
                await this.sendSMS(
                    user.phone,
                    `ALERT: ${alert.title} - ${alert.message}`
                );
            }
        }
    }
    
    getAlertEmailTemplate(alert) {
        return `
            <h2>${alert.title}</h2>
            <p>${alert.message}</p>
            <p><strong>Priority:</strong> ${alert.priority}</p>
            <p><strong>Ward:</strong> ${alert.ward_name || 'Citywide'}</p>
            <p><a href="${process.env.FRONTEND_URL}/alerts/${alert.id}">View Alert</a></p>
        `;
    }
}

module.exports = new NotificationService();
```

### B. WebSocket Real-Time Updates

**services/websocketService.js**

```javascript
class WebSocketService {
    constructor() {
        this.io = null;
    }
    
    initialize(io) {
        this.io = io;
        
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            
            socket.on('subscribe:ward', (wardId) => {
                socket.join(`ward-${wardId}`);
            });
            
            socket.on('subscribe:alerts', () => {
                socket.join('alerts');
            });
            
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }
    
    broadcastWardUpdate(wardId, data) {
        if (this.io) {
            this.io.to(`ward-${wardId}`).emit('ward:update', data);
        }
    }
    
    broadcastNewIncident(incident) {
        if (this.io) {
            this.io.emit('incident:new', incident);
        }
    }
    
    broadcastAlert(alert) {
        if (this.io) {
            this.io.to('alerts').emit('alert:new', alert);
        }
    }
}

module.exports = new WebSocketService();
```

### C. PDF Report Generation

**utils/pdfGenerator.js**

```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');

class PDFGenerator {
    async generateDashboardReport(data, outputPath) {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(outputPath);
        
        doc.pipe(stream);
        
        // Header
        doc.fontSize(20).text('Delhi Water-Logging Dashboard Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
        doc.moveDown(2);
        
        // Summary
        doc.fontSize(16).text('Summary', { underline: true });
        doc.moveDown();
        doc.fontSize(12);
        doc.text(`Total Wards: ${data.summary.total_wards}`);
        doc.text(`Critical Wards: ${data.summary.critical_wards}`);
        doc.text(`Active Incidents: ${data.summary.active_incidents}`);
        doc.text(`Average MPI Score: ${data.summary.avg_mpi}`);
        doc.moveDown(2);
        
        // Ward Details
        doc.fontSize(16).text('Ward Details', { underline: true });
        doc.moveDown();
        
        data.wards.forEach((ward, index) => {
            doc.fontSize(14).text(`${index + 1}. ${ward.name}`);
            doc.fontSize(10);
            doc.text(`   MPI Score: ${ward.mpi_score}`);
            doc.text(`   Risk Level: ${ward.risk_level}`);
            doc.text(`   Incidents: ${ward.incident_count}`);
            doc.moveDown();
        });
        
        doc.end();
        
        return new Promise((resolve, reject) => {
            stream.on('finish', () => resolve(outputPath));
            stream.on('error', reject);
        });
    }
}

module.exports = new PDFGenerator();
```

### D. Multi-Language Support

**Update frontend app.js:**

```javascript
class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'en';
        this.translations = {};
        this.loadTranslations();
    }
    
    async loadTranslations() {
        const response = await fetch(`/api/translations?lang=${this.currentLang}`);
        const data = await response.json();
        this.translations = data.data.reduce((acc, t) => {
            acc[t.translation_key] = t.translation_value;
            return acc;
        }, {});
        this.applyTranslations();
    }
    
    t(key) {
        return this.translations[key] || key;
    }
    
    switchLanguage(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        this.loadTranslations();
    }
    
    applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });
    }
}

const langManager = new LanguageManager();
```

---

## 7. 🚀 Deployment

### Backend Deployment (Railway/Render)

1. **Prepare for deployment:**
   ```bash
   # Add to package.json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

2. **Deploy to Railway:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   railway init
   
   # Deploy
   railway up
   
   # Add environment variables in Railway dashboard
   ```

### Frontend Deployment (Vercel/Netlify)

```bash
# Deploy to Vercel
npm install -g vercel
vercel login
vercel --prod

# Or Netlify
npm install -g netlify-cli
netlify deploy --prod
```

---

## 📱 Quick Start Checklist

- [ ] Create Supabase project
- [ ] Run schema.sql
- [ ] Run seed_data.sql
- [ ] Create backend folder & install dependencies
- [ ] Setup .env file with all keys
- [ ] Create server.js and routes
- [ ] Test API endpoints with Postman
- [ ] Update frontend app.js to use real API
- [ ] Integrate Leaflet.js for maps
- [ ] Setup Chart.js for analytics
- [ ] Configure notifications (email/SMS)
- [ ] Setup WebSocket for real-time updates
- [ ] Test multi-language support
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Setup monitoring & logging

---

**Need help? Each section can be implemented step-by-step. Start with Database → Backend → Frontend integration.**
