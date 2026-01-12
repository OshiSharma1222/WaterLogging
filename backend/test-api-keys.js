const axios = require('axios');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

console.log('\nAPI KEY TESTING SCRIPT\n');
console.log('='.repeat(50));

// Test 1: OpenWeather API
async function testOpenWeather() {
    console.log('\nTesting OpenWeather API...');
    console.log('-'.repeat(50));
    
    const apiKey = process.env.OPENWEATHER_API_KEY;
    
    if (!apiKey || apiKey.trim() === '') {
        console.log('FAILED: No API key found in .env');
        return false;
    }
    
    console.log(`API Key found: ${apiKey.substring(0, 10)}...`);
    
    try {
        // Test current weather endpoint
        const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=Delhi,IN&appid=${apiKey}&units=metric`;
        console.log('\nFetching current weather for Delhi...');
        
        const currentResponse = await axios.get(currentUrl, { timeout: 10000 });
        
        console.log('\nSUCCESS! Current Weather Data:');
        console.log(`   Location: ${currentResponse.data.name}, ${currentResponse.data.sys.country}`);
        console.log(`   Temperature: ${currentResponse.data.main.temp}°C`);
        console.log(`   Humidity: ${currentResponse.data.main.humidity}%`);
        console.log(`   Weather: ${currentResponse.data.weather[0].description}`);
        console.log(`   Rainfall (1h): ${currentResponse.data.rain?.['1h'] || 0}mm`);
        console.log(`   Cloud Cover: ${currentResponse.data.clouds.all}%`);
        
        // Test forecast endpoint
        console.log('\nFetching 3-hour forecast...');
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=Delhi,IN&appid=${apiKey}&units=metric`;
        const forecastResponse = await axios.get(forecastUrl, { timeout: 10000 });
        
        const next3h = forecastResponse.data.list[0];
        console.log('\nSUCCESS! 3-Hour Forecast:');
        console.log(`   Time: ${new Date(next3h.dt * 1000).toLocaleString()}`);
        console.log(`   Temperature: ${next3h.main.temp}°C`);
        console.log(`   Rainfall: ${next3h.rain?.['3h'] || 0}mm`);
        console.log(`   Description: ${next3h.weather[0].description}`);
        
        return true;
    } catch (error) {
        console.log('\nFAILED: OpenWeather API Error');
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Message: ${error.response.data.message}`);
            
            if (error.response.status === 401) {
                console.log('\n   TIP: API key is invalid or not activated yet');
                console.log('   - Wait 10-15 minutes after signup');
                console.log('   - Check key at: https://home.openweathermap.org/api_keys');
            }
        } else {
            console.log(`   Error: ${error.message}`);
        }
        return false;
    }
}

// Test 2: Supabase Connection
async function testSupabase() {
    console.log('\nTesting Supabase Connection...');
    console.log('-'.repeat(50));
    
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    
    if (!url || !key) {
        console.log('FAILED: Supabase credentials missing');
        return false;
    }
    
    console.log(`Supabase URL: ${url}`);
    console.log(`API Key found: ${key.substring(0, 20)}...`);
    
    try {
        const supabase = createClient(url, key);
        
        console.log('\nTesting database connection...');
        const { data, error } = await supabase
            .from('wards')
            .select('count', { count: 'exact', head: true });
        
        if (error) throw error;
        
        console.log('\nSUCCESS! Supabase Connected');
        console.log(`   Database is accessible`);
        
        // Try to get ward count
        const { count } = await supabase
            .from('wards')
            .select('*', { count: 'exact', head: true });
        
        console.log(`   Total wards in database: ${count || 0}`);
        
        if (count === 0) {
            console.log('\n   WARNING: No wards found in database');
            console.log('   TIP: Run quick_seed.sql in Supabase SQL Editor');
        }
        
        return true;
    } catch (error) {
        console.log('\nFAILED: Supabase Error');
        console.log(`   ${error.message}`);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    let openWeatherOk = false;
    let supabaseOk = false;
    
    try {
        openWeatherOk = await testOpenWeather();
        supabaseOk = await testSupabase();
    } catch (error) {
        console.log('\nUnexpected error:', error.message);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('\nTEST SUMMARY\n');
    console.log(`OpenWeather API: ${openWeatherOk ? 'WORKING' : 'FAILED'}`);
    console.log(`Supabase DB:     ${supabaseOk ? 'WORKING' : 'FAILED'}`);
    
    if (openWeatherOk && supabaseOk) {
        console.log('\nALL TESTS PASSED!');
        console.log('Your system is ready to fetch real-time weather data!');
        console.log('\nNext steps:');
        console.log('   1. Run quick_seed.sql in Supabase (if needed)');
        console.log('   2. Start server: node server.js');
        console.log('   3. Open browser and watch real-time updates!');
    } else {
        console.log('\nSOME TESTS FAILED');
        console.log('Please fix the issues above before starting the server.');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
}

// Run tests
runAllTests();
