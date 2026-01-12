# ⚡ Quick OpenWeather API Setup (5 Minutes!)

## Why OpenWeather?
✅ **Fast** - Updates every 10 minutes  
✅ **Reliable** - 99.9% uptime  
✅ **Easy** - No approval needed  
✅ **Free** - 1000 calls/day (we only use ~96/day)  
✅ **Global** - Works worldwide including Delhi  

---

## Step 1: Sign Up (2 minutes)

1. Go to: **https://openweathermap.org/api**
2. Click **"Sign Up"** (top right)
3. Fill in:
   - Username
   - Email
   - Password
4. Verify email
5. Done!

---

## Step 2: Get Your API Key (1 minute)

1. Login to: **https://home.openweathermap.org/api_keys**
2. You'll see a default API key already created
3. **Copy the key** (looks like: `abc123def456...`)
4. **Wait 10-15 minutes** for activation (OpenWeather activates new keys automatically)

---

## Step 3: Add to Your Project (1 minute)

Open `backend/.env` and paste your key:

```env
OPENWEATHER_API_KEY=abc123def456...your_key_here
```

That's it!

---

## Step 4: Start Server

```bash
cd backend
node server.js
```

You should see:
```
🌦️  Weather Service started (Primary: OpenWeather API)
⏱️  Fetching weather data from API...
✅ OpenWeather data fetched successfully
📊 Source: OpenWeather | Rainfall: 5.2mm | Forecast: 15.3mm
✅ Weather data updated: 15/15 wards
```

---

## What You Get

### Real-Time Delhi Weather:
- **Current rainfall** - Last 1 hour actual data
- **3-hour forecast** - Predicted rainfall next 3 hours
- **Temperature** - Current temp in Delhi
- **Humidity** - Current humidity %
- **Cloud cover** - Cloud percentage

### Auto-Updates Every 15 Minutes:
```
12:00 PM - Fetch weather, update all wards
12:15 PM - Fetch weather, update all wards
12:30 PM - Fetch weather, update all wards
...and so on
```

### Smart Calculations:
For each ward, the system:
1. Gets base Delhi rainfall from OpenWeather
2. Adds ±20% variation (different areas of Delhi)
3. Calculates risk level (safe/alert/critical)
4. Calculates MPI score
5. Updates database
6. Broadcasts to all connected clients

---

## API Usage

**Your usage:**
- Updates every 15 minutes
- 4 updates/hour × 24 hours = **96 calls/day**
- Free tier limit: 1000 calls/day
- **You're using only 9.6% of your quota!** ✅

---

## Testing Your Setup

### 1. Check Backend Logs:
```bash
node server.js

# You should see:
🌦️  Weather Service started (Primary: OpenWeather API)
⏱️  Fetching weather data from API...
✅ OpenWeather data fetched successfully
📊 Source: OpenWeather | Rainfall: 5.2mm | Forecast: 15.3mm
✅ Weather data updated: 15/15 wards
📊 Weather Service Status: {
  configured: true,
  primary: 'OpenWeather',
  fallback: 'Simulation',
  updateInterval: '15 minutes'
}
```

### 2. Check Browser Console (F12):
```javascript
✅ Connected to real-time updates
📊 Data refresh event: 15 wards updated at 2:30:45 PM
🔄 Ward update received: Connaught Place { rainfall: '5.2mm', ... }
```

### 3. Click Any Ward on Map:
Should show real data like:
- Current Rainfall: **5.2mm** (from API)
- Forecast (3h): **15.3mm** (from API)
- Risk Level: **SAFE** (calculated)
- MPI Score: **78** (calculated)

---

## Troubleshooting

### ❌ "401 Unauthorized"
**Solution:** API key not activated yet
- Wait 10-15 minutes after signup
- Check your email for activation confirmation
- Verify key is correct in `.env`

### ❌ "Using simulated weather data"
**Solution:** API key not found
- Make sure `OPENWEATHER_API_KEY=` has your key
- No spaces around the `=`
- Restart server after adding key

### ❌ "No wards found in database"
**Solution:** Database is empty
- Run `quick_seed.sql` in Supabase SQL Editor
- This adds ward names (weather service fills the rest)

---

## OpenWeather API Dashboard

Monitor your usage:
1. Login to: **https://home.openweathermap.org**
2. Check **"Statistics"** tab
3. See calls made today

You should see ~4 calls per hour (one every 15 min).

---

## What Happens Without API Key?

If you don't add the key, the system automatically:
1. Tries OpenWeather (fails - no key)
2. Tries IMD (fails - no key)
3. **Falls back to simulation mode**
4. Generates realistic random rainfall data
5. Still works, but not real weather

**But with API key = Real Delhi weather! 🌧️**

---

## OpenWeather Free vs Paid

### Free Tier (What You Get):
✅ Current weather data  
✅ 3-hour forecasts  
✅ 1000 calls/day  
✅ 5-day forecast  
✅ Historical data (limited)  

### Paid Tiers (If You Need More):
- 16-day forecast
- Hourly forecast
- More calls per day
- Faster updates

**For this project, FREE tier is perfect!** 🎉

---

## Summary

1. ✅ **Sign up** at OpenWeather (2 min)
2. ✅ **Copy API key** (1 min)
3. ✅ **Add to `.env`** (1 min)
4. ✅ **Wait 15 min** for activation
5. ✅ **Start server** and enjoy real Delhi weather!

**Total setup time: ~5 minutes + 15 min activation wait**

That's it! Your dashboard now has real-time Delhi weather data! 🚀
