const supabase = require('../config/supabase');

// Simulate real-time weather/rainfall updates
class RealTimeService {
    constructor(io) {
        this.io = io;
        this.updateInterval = null;
    }

    // Start simulating real-time updates
    start() {
        console.log('Real-time service started');
        
        // Run initial update immediately
        this.updateWardRainfall();
        
        // Update ward data every 30 seconds
        this.updateInterval = setInterval(() => {
            this.updateWardRainfall();
        }, 30000);
        
        // Create random incidents every 2 minutes
        this.incidentInterval = setInterval(() => {
            this.createRandomIncident();
        }, 120000);
    }

    // Simulate rainfall updates
    async updateWardRainfall() {
        try {
            console.log('Updating ward rainfall data...');
            
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
            
            // Update each ward with simulated rainfall
            for (const ward of wards) {
                const rainfallChange = (Math.random() - 0.5) * 5; // -2.5 to +2.5mm
                const newRainfall = Math.max(0, (ward.current_rainfall || 0) + rainfallChange);
                
                // Calculate new risk level
                const riskPercent = newRainfall / ward.failure_threshold;
                let newRiskLevel = 'safe';
                if (riskPercent > 0.7) newRiskLevel = 'critical';
                else if (riskPercent > 0.3) newRiskLevel = 'alert';
                
                // Update MPI score based on conditions
                const newMpiScore = Math.max(0, Math.min(100, 
                    100 - (riskPercent * 100) - (ward.drainage_stress_index * 0.2)
                ));

                // Update in database
                const { error: updateError } = await supabase
                    .from('wards')
                    .update({
                        current_rainfall: Math.round(newRainfall * 10) / 10,
                        risk_level: newRiskLevel,
                        mpi_score: Math.round(newMpiScore),
                        last_updated: new Date()
                    })
                    .eq('id', ward.id);

                if (!updateError) {
                    updatedCount++;
                    // Emit update via WebSocket
                    this.io.emit('ward-update', {
                        wardId: ward.id,
                        wardName: ward.name,
                        rainfall: Math.round(newRainfall * 10) / 10,
                        riskLevel: newRiskLevel,
                        mpiScore: Math.round(newMpiScore),
                        timestamp: new Date().toISOString()
                    });
                } else {
                    console.error(`Failed to update ward ${ward.name}:`, updateError.message);
                }
            }

            console.log(`Ward data updated: ${updatedCount}/${wards.length} wards`);
            this.io.emit('data-refresh', { 
                type: 'wards', 
                count: updatedCount,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error updating ward rainfall:', error.message);
            this.io.emit('error', { 
                type: 'update_failed', 
                message: error.message 
            });
        }
    }
    
    // Stop the service
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            console.log('Real-time service stopped');
        }
        if (this.incidentInterval) {
            clearInterval(this.incidentInterval);
        }
    }

    // Simulate new incident reports
    async createRandomIncident() {
        try {
            // Get a random critical/alert ward
            const { data: highRiskWards } = await supabase
                .from('wards')
                .select('*')
                .in('risk_level', ['critical', 'alert'])
                .limit(5);

            if (highRiskWards && highRiskWards.length > 0) {
                const ward = highRiskWards[Math.floor(Math.random() * highRiskWards.length)];
                
                const types = ['waterlogging', 'drainage', 'pothole'];
                const severities = ['medium', 'high', 'critical'];
                
                // Generate coordinates near ward
                const lat = 28.6139 + (Math.random() - 0.5) * 0.2;
                const lng = 77.2090 + (Math.random() - 0.5) * 0.2;

                const { data: incident, error } = await supabase
                    .from('incidents')
                    .insert({
                        type: types[Math.floor(Math.random() * types.length)],
                        severity: severities[Math.floor(Math.random() * severities.length)],
                        ward_id: ward.id,
                        location: `POINT(${lng} ${lat})`,
                        address: `${ward.name}, ${ward.zone}`,
                        description: 'Auto-generated incident from monitoring system',
                        water_depth_cm: Math.floor(Math.random() * 60),
                        status: 'pending'
                    })
                    .select()
                    .single();

                if (!error) {
                    this.io.emit('incident-new', incident);
                    console.log('New incident created:', incident.type, 'at', ward.name);
                }
            }
        } catch (error) {
            console.error('Error creating incident:', error);
        }
    }

    // Stop the service
    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            console.log('Real-time service stopped');
        }
    }
}

module.exports = RealTimeService;
