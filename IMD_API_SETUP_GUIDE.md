# 🌦️ IMD Weather API Integration Guide

## Current Issue: "No wards found in database"

### STEP 1: Load Data into Database (REQUIRED - Do this first!)

**Option A: Quick Setup (10 wards)**
1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `eadjlobvxcpywcbnpvjv`
3. Click **SQL Editor** in left sidebar
4. Copy contents of `database/quick_seed.sql`
5. Paste and click **RUN**
6. You should see: "Data loaded successfully! Total wards: 10"

**Option B: Full Setup (30+ wards)**
1. Open Supabase SQL Editor
2. Copy contents of `database/seed_data.sql`
3. Paste and click **RUN**

---

## STEP 2: Get Weather API Keys

### Option A: OpenWeather API (Recommended - Easier!)

**✅ Best for getting started quickly**

1. **Sign up**: Go to https://openweathermap.org/api
2. **Choose Free Plan**: "Current Weather and Forecasts collection" - FREE
   - 1,000 API calls/day
   - Updates every 10 minutes
   - Perfect for development and small projects
3. **Get API Key**: After signup, go to https://home.openweathermap.org/api_keys
4. **Copy your API key**
5. **Add to `.env` file**:
   ```env
   OPENWEATHER_API_KEY=your_api_key_here
   ```

**API Details:**
- Updates: Every 10-15 minutes
- Free tier: 1,000 calls/day (plenty for this project)
- Data: Current rainfall, 3-hour forecast, temperature, humidity
- Coverage: Worldwide including Delhi

---

### Option B: IMD API (Official India Weather)

**⚠️ More difficult to get, but official Indian data**

1. **Visit**: https://mausam.imd.gov.in
2. **Register**: Look for "API Access" or "Developer Portal"
   - May require application/approval
   - Usually free for non-commercial use
3. **Documentation**: https://mausam.imd.gov.in/imd_latest/contents/api.php
4. **Add to `.env` file**:
   ```env
   IMD_API_KEY=your_imd_api_key_here
   IMD_API_URL=https://api.mausam.imd.gov.in
   ```

**Note**: IMD API registration can take time. Start with OpenWeather and switch later.

---

## STEP 3: Configure Your Backend

Your backend is already configured! The `imdWeatherService.js` will:
- **Try IMD first** (if key is set)
- **Fallback to OpenWeather** (if available)
- **Use simulation** (if no API keys - current mode)

### Update Frequency
The service fetches weather data every **15 minutes**:
```javascript
// In imdWeatherService.js
this.updateInterval = setInterval(() => {
    this.updateWeatherData();
}, 15 * 60 * 1000); // 15 minutes
```

To change frequency, edit this line.

---

## STEP 4: Restart Your Server

```bash
# Stop current server (Ctrl+C in terminal)
cd backend
node server.js
```

You should see:
```
✅ Server running on port 5000
🌦️  IMD Weather Service started
⏱️  Fetching weather data from API...
✅ OpenWeather data fetched successfully (or IMD if configured)
✅ Weather data updated: 10/10 wards
```

---

## How the System Works

### Data Flow:
```
API (IMD/OpenWeather) 
  → Backend fetches every 15 min
  → Calculates risk levels for each ward
  → Updates Supabase database
  → Broadcasts via WebSocket to all clients
  → Frontend updates map automatically
```

### Weather Service Features:

1. **Smart Fallback Chain**:
   - IMD API (if configured)
   - → OpenWeather API (if IMD fails)
   - → Simulation mode (if no APIs)

2. **Location Variation**:
   - Base rainfall from API
   - Adds ±20% variation per ward
   - Simulates different conditions across Delhi

3. **Automatic Risk Calculation**:
   ```javascript
   Risk = (Forecast / Failure Threshold)
   - >70% = Critical (Red)
   - 30-70% = Alert (Yellow)  
   - <30% = Safe (Green)
   ```

4. **MPI Score Calculation**:
   ```javascript
   MPI = 100 - (risk% × 50) - (drainage × 0.3) - (potholes × 0.2)
   ```

5. **Auto-Alerts**:
   - Creates alerts when forecast > 30mm and wards are critical
   - Broadcasts to all connected clients

---

## Testing Your Setup

### 1. Check Console Logs

**Backend (Terminal):**
```
🌦️  IMD Weather Service started
⏱️  Fetching weather data from API...
✅ OpenWeather data fetched successfully
📊 Source: OpenWeather | Rainfall: 5.2mm | Forecast: 15.3mm
✅ Weather data updated: 10/10 wards
```

**Frontend (Browser F12):**
```
✅ Connected to real-time updates
📊 Data refresh event: 10 wards updated at 2:30:45 PM
🔄 Ward update received: Connaught Place { rainfall: '5.2mm', ... }
```

### 2. Watch the Map
- Wards should show with colored circles
- Click any ward → info card shows real data
- Every 15 minutes, colors may change based on new weather data

### 3. Monitor API Usage

**OpenWeather:**
- Login to https://home.openweathermap.org
- Check "API calls statistics"
- With 15-min updates: ~96 calls/day (well under 1000 limit)

---

## Troubleshooting

### ❌ "No wards found in database"
**Solution**: Run `quick_seed.sql` in Supabase SQL Editor (Step 1)

### ❌ "OpenWeather API error: 401 Unauthorized"
**Solution**: 
- API key is invalid or not activated yet
- Check your key at https://home.openweathermap.org/api_keys
- Wait 10-15 minutes after signup (activation time)

### ❌ "Using simulated weather data"
**Solution**: This is normal if no API keys are configured. Add OpenWeather key to `.env`

### ❌ Frontend shows "NaN"
**Solution**: 
1. Make sure database has data (run seed script)
2. Restart backend server
3. Refresh browser

### ❌ Data not updating
**Solution**:
1. Check backend console for errors
2. Verify API key is correct in `.env`
3. Check browser console (F12) for WebSocket connection
4. Make sure server is running

---

## API Key Security

**Never commit API keys to Git!**

The `.env` file is already in `.gitignore`, but double-check:
```bash
# Check .gitignore includes:
.env
.env.local
```

For production deployment:
- Use environment variables
- Don't hardcode keys in code
- Rotate keys regularly

---

## Cost & Limits

### OpenWeather Free Tier:
- ✅ 1,000 calls/day
- ✅ With 15-min updates = 96 calls/day
- ✅ Can support ~10 concurrent projects
- ✅ No credit card required

### IMD API:
- Usually free for non-commercial
- Check with IMD for specific limits
- May require approval

---

## Next Steps

1. ✅ **Load seed data** (Step 1) - DO THIS NOW
2. ✅ **Get OpenWeather API key** (Step 2) - 5 minutes
3. ✅ **Restart server** (Step 3)
4. ✅ **Test in browser**
5. Later: Switch to IMD API when you get access

---

## Quick Reference

### Environment Variables (.env):
```env
# Supabase (already configured)
SUPABASE_URL=https://eadjlobvxcpywcbnpvjv.supabase.co
SUPABASE_ANON_KEY=your_key

# Weather APIs
OPENWEATHER_API_KEY=your_openweather_key_here
IMD_API_KEY=                    # Leave empty for now
IMD_API_URL=https://api.mausam.imd.gov.in
```

### Update Frequency:
- Weather fetch: **15 minutes**
- Frontend auto-refresh: **30 seconds**
- WebSocket: **Real-time**

### Files Changed:
- ✅ `backend/services/imdWeatherService.js` - NEW
- ✅ `backend/server.js` - Updated to use IMD service
- ✅ `backend/.env` - Added weather API keys
- ✅ `database/quick_seed.sql` - NEW (quick data load)

---

**Ready? Start with Step 1: Load the data! 🚀**
