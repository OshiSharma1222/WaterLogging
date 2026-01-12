# 🚀 Real-Time Dynamic Data Setup Guide

## What You Have Now:
✅ Backend server with real-time simulation service  
✅ WebSocket for instant updates  
✅ Auto-refresh every 30 seconds  
✅ Frontend map with ward visualization  

## ⚠️ Current Issue: Database is Empty!

### Step 1: Add Seed Data to Database

**Go to your Supabase dashboard:**
1. Open https://supabase.com
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Copy the contents of `database/seed_data.sql`
5. Paste and click **Run**

This will add 30+ Delhi wards with realistic data.

---

## 🌐 Real-Time Data Options

### Option A: Use Simulated Data (Current Setup - Best for Testing)
**✅ Already configured!** 

Your backend automatically:
- Updates rainfall every 30 seconds (random -2.5mm to +2.5mm changes)
- Recalculates risk levels (safe → alert → critical)
- Updates MPI scores based on conditions
- Broadcasts to all connected clients via WebSocket

**To see it working:**
1. Run seed_data.sql in Supabase (Step 1 above)
2. Refresh your browser
3. Watch the console logs for "Ward data updated"
4. Ward circles will change colors as risk levels change

---

### Option B: Integrate Live Weather API (Production Ready)

#### IMD (India Meteorological Department) API
**Official weather data for India**

```javascript
// Add to backend/services/weatherService.js
const axios = require('axios');

class WeatherService {
    async getDelhiRainfall() {
        // IMD API endpoint (requires registration)
        const url = 'https://api.imd.gov.in/rainfall';
        
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${process.env.IMD_API_KEY}`
            }
        });
        
        return response.data;
    }
}
```

**How to get IMD API:**
1. Visit: https://mausam.imd.gov.in
2. Register for API access (free for research/non-commercial)
3. Add `IMD_API_KEY` to your `.env` file
4. Update service to call this every 15 minutes

#### OpenWeather API (Easier Alternative)
**Free tier: 1000 calls/day**

```javascript
// Add to backend/services/weatherService.js
async getWeatherData() {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=Delhi&appid=${process.env.OPENWEATHER_API_KEY}`;
    const response = await axios.get(url);
    
    return {
        rainfall: response.data.rain?.['1h'] || 0, // mm in last hour
        forecast: response.data.clouds.all, // Cloud cover %
        temperature: response.data.main.temp
    };
}
```

**Setup:**
1. Sign up: https://openweathermap.org/api
2. Get free API key
3. Add to `.env`: `OPENWEATHER_API_KEY=your_key_here`
4. Call every 10-15 minutes

---

### Option C: IoT Sensor Integration (Most Accurate)

For actual real-time data from physical sensors:

```javascript
// Connect to rain gauge sensors
const mqtt = require('mqtt');

class SensorService {
    constructor() {
        this.client = mqtt.connect('mqtt://your-iot-broker.com');
    }
    
    listenToSensors() {
        this.client.on('message', (topic, message) => {
            const data = JSON.parse(message);
            
            // Update ward based on sensor location
            this.updateWardRainfall(data.ward_id, data.rainfall);
        });
        
        // Subscribe to all Delhi sensor topics
        this.client.subscribe('delhi/sensors/+/rainfall');
    }
}
```

---

## 🎯 How Your Current Real-Time System Works

### Backend (server.js + realTimeService.js):
```
Every 30 seconds:
1. Fetch all wards from database
2. Simulate rainfall change (-2.5mm to +2.5mm)
3. Update database with new values
4. Calculate new risk levels
5. Broadcast via WebSocket to all clients
```

### Frontend (app.js):
```
Real-time Updates:
1. WebSocket connects on page load
2. Listens for 'data-refresh' event
3. Automatically reloads ward data
4. Updates map circles and colors
5. Shows notifications for changes
```

---

## 📊 Testing Real-Time Updates

### Test 1: Check Server Logs
```bash
# You should see every 30 seconds:
⏱️  Updating ward rainfall data...
✅ Ward data updated: 30/30 wards
```

### Test 2: Check Browser Console
```javascript
// You should see:
✅ Connected to real-time updates
📊 Data refresh event: 30 wards updated at 12:30:45 PM
🔄 Ward update received: Connaught Place { rainfall: '15.2mm', riskLevel: 'alert', mpiScore: 68 }
```

### Test 3: Watch the Map
- Ward circles should change colors over time
- Green (safe) → Yellow (alert) → Red (critical)
- Click any ward to see current data

---

## 🔧 Configuration Options

### Adjust Update Frequency

**In `backend/services/realTimeService.js`:**
```javascript
// Change from 30 seconds to 1 minute:
this.updateInterval = setInterval(() => {
    this.updateWardRainfall();
}, 60000); // 60 seconds
```

**In `app.js`:**
```javascript
// Change frontend refresh:
setInterval(() => {
    loadWardData();
}, 60000); // Match backend timing
```

### Adjust Rainfall Simulation

```javascript
// More dramatic changes:
const rainfallChange = (Math.random() - 0.5) * 20; // -10 to +10mm

// Gradual increases only (monsoon simulation):
const rainfallChange = Math.random() * 3; // 0 to 3mm increase

// Seasonal patterns:
const hour = new Date().getHours();
const isMonsooning = (hour >= 14 && hour <= 18); // 2-6 PM peak
const rainfallChange = isMonsooning ? 
    Math.random() * 10 : // Heavy during peak
    (Math.random() - 0.5) * 2; // Light otherwise
```

---

## 🚀 Next Steps for Production

1. **Add Seed Data** → Run `database/seed_data.sql` in Supabase
2. **Test Simulation** → Watch data update every 30 seconds
3. **Get API Key** → Sign up for OpenWeather or IMD
4. **Replace Simulation** → Switch to real API calls
5. **Monitor Performance** → Check database queries and WebSocket connections
6. **Add Caching** → Use Redis for faster reads
7. **Scale WebSockets** → Use Socket.IO adapters for multiple servers

---

## 💡 Pro Tips

**Reduce Database Load:**
- Cache ward data in memory
- Only broadcast changed wards (delta updates)
- Use database triggers for automatic updates

**Better UX:**
- Add loading indicators during updates
- Show "Last updated X seconds ago"
- Highlight recently changed wards
- Add sound/visual alerts for critical changes

**Monitoring:**
- Log all WebSocket connections
- Track update success rates
- Alert if API calls fail
- Monitor database query performance

---

## 🐛 Troubleshooting

### "No wards found in database"
➡️ Run seed_data.sql in Supabase SQL Editor

### "NaN" showing on cards
➡️ Database has null values, seed data will fix this

### WebSocket not connecting
➡️ Check CORS settings in server.js
➡️ Verify SOCKET_URL in app.js matches your backend

### Updates not showing
➡️ Open browser console (F12)
➡️ Look for connection errors
➡️ Check backend server logs

---

**Ready to go? Run the seed data and refresh your browser! 🎉**
