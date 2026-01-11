# 🌊 Real-Time Data Integration Guide

## ✅ What's Now Implemented

### 1. **Auto-Refresh System**
- Ward data refreshes every **30 seconds**
- Incident data refreshes every **15 seconds**
- Automatic updates without page reload

### 2. **WebSocket Real-Time Updates**
- Live connection to backend via Socket.IO
- Instant notifications when data changes
- Three update types:
  - `ward-update` - Ward conditions change
  - `incident-new` - New incident reported
  - `alert-new` - New alert issued

### 3. **Backend Real-Time Service**
Location: `backend/services/realTimeService.js`

**Features:**
- Simulates rainfall changes every 30 seconds
- Auto-calculates risk levels
- Updates MPI scores dynamically
- Can generate random incidents in high-risk areas
- Broadcasts changes via WebSocket

## 🚀 How It Works

### Data Flow:
```
1. Backend Service → Updates database every 30s
2. Database → Supabase PostgreSQL
3. WebSocket → Pushes updates to all connected clients
4. Frontend → Auto-fetches via API + receives WebSocket events
5. Map → Automatically updates with new data
```

### Current Setup:
1. ✅ **Map displays real data** from database
2. ✅ **Auto-refreshes** every 30s (wards) / 15s (incidents)
3. ✅ **WebSocket connected** for instant updates
4. ✅ **Backend simulator** modifies data every 30s

## 📋 Setup Steps

### 1. Run Seed Data (One Time)
```sql
-- In Supabase SQL Editor:
-- Copy and paste contents of: database/seed_data.sql
-- This creates 30+ Delhi wards with initial data
```

### 2. Restart Server
```bash
cd backend
node server.js
```

You'll see:
```
🚀 Server running on port 5000
📡 WebSocket enabled
🌧️ Real-time data simulation enabled
```

### 3. Open Dashboard
```
http://localhost:5000/index.html
```

## 🎯 What You'll See

### On Page Load:
- Console: `✅ Connected to real-time updates`
- Map loads with Delhi wards
- Ward circles color-coded by risk

### Every 30 Seconds:
- Backend updates rainfall values
- Risk levels recalculated
- MPI scores adjusted
- Map circles change color automatically
- Console: `🔄 Auto-refreshing ward data...`

### Real-Time Events:
- New incident → Marker appears on map
- Ward update → Circle color changes
- Alert → Browser notification

## 🔧 Customization Options

### Change Update Frequency
In `app.js`:
```javascript
// Line ~545
setInterval(() => {
    loadWardData();
}, 30000); // Change to 60000 for 1 minute
```

### Enable/Disable Simulation
In `server.js`:
```javascript
// Comment out to disable:
// realTimeService.start();
```

### Add More Incident Types
In `realTimeService.js`:
```javascript
const types = ['waterlogging', 'drainage', 'pothole', 'flood', 'traffic'];
```

## 🌐 Connecting External Data Sources

### Option 1: IMD Weather API (Real Rainfall Data)
```javascript
// Create: backend/services/imdService.js
async function fetchIMDRainfall() {
    const response = await fetch(
        `https://api.imd.gov.in/v1/rainfall/delhi`,
        {
            headers: { 'X-API-Key': process.env.IMD_API_KEY }
        }
    );
    return response.json();
}
```

### Option 2: IoT Sensors
```javascript
// Create: backend/services/iotService.js
async function connectSensorMQTT() {
    const mqtt = require('mqtt');
    const client = mqtt.connect('mqtt://your-mqtt-broker');
    
    client.on('message', (topic, message) => {
        // Update ward data with sensor readings
        updateWardFromSensor(JSON.parse(message));
    });
}
```

### Option 3: Manual Updates (Admin Panel)
Create API endpoint:
```javascript
// POST /api/wards/:id/update-rainfall
router.post('/:id/update-rainfall', async (req, res) => {
    const { rainfall } = req.body;
    // Update database
    // Emit WebSocket event
    io.emit('ward-update', { wardId, rainfall });
});
```

## 📊 Monitoring Real-Time Updates

### Browser Console
Open DevTools (F12) → Console:
- `✅ Connected` - WebSocket active
- `🔄 Auto-refreshing` - Periodic updates
- `📊 API Response` - Data fetched

### Server Console
Watch backend terminal:
- `✅ Ward data updated` - Simulation ran
- `✅ Client connected` - User joined
- `🚨 New incident created` - Auto-generated

## 🎨 Next Steps

1. **Run seed data** if you haven't
2. **Restart server** to enable real-time service
3. **Refresh dashboard** to see live updates
4. **Watch console** to verify updates working
5. **Optional**: Connect real IMD API or IoT sensors

## 🆘 Troubleshooting

**No updates appearing?**
- Check server console for errors
- Verify: `🌧️ Real-time data simulation enabled`
- Open browser console: should see `✅ Connected`

**Map showing demo data?**
- Run seed_data.sql in Supabase
- Check `/api/wards` endpoint returns data

**WebSocket not connecting?**
- Verify Socket.IO library loaded in HTML
- Check browser console for connection errors
- Ensure port 5000 not blocked by firewall

## 📝 Summary

Your dashboard now has:
- ✅ Real database integration
- ✅ Auto-refresh every 30s
- ✅ WebSocket for instant updates  
- ✅ Backend service simulating rainfall
- ✅ Dynamic risk calculation
- ✅ Automatic map updates

**The map will now update in real-time as conditions change!**
