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

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import services
const RealTimeService = require('./services/realTimeService');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Serve static files from parent directory
app.use(express.static(require('path').join(__dirname, '..')));

// Routes
app.use('/api/wards', wardRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/alerts', alertRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Delhi Water-Logging API is running',
        timestamp: new Date() 
    });
});

app.get('/', (req, res) => {
    res.json({
        message: '🌊 Delhi Water-Logging Dashboard API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            wards: '/api/wards',
            incidents: '/api/incidents',
            alerts: '/api/alerts'
        }
    });
});

// Error handling
app.use(errorHandler);

// WebSocket connection
io.on('connection', (socket) => {
    console.log('✅ Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// Initialize real-time data service
const realTimeService = new RealTimeService(io);
realTimeService.start();

console.log('🌧️ Real-time data simulation enabled');

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log('=================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket enabled`);
    console.log(`🌐 API: http://localhost:${PORT}`);
    console.log('=================================');
});

module.exports = { app, io };
