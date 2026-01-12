const supabase = require('../config/supabase');

// Get all active alerts
exports.getActiveAlerts = async (req, res) => {
    try {
        if (!supabase) {
            return res.json({
                success: true,
                count: 0,
                data: []
            });
        }

        const { data, error } = await supabase
            .from('alerts')
            .select(`
                *,
                wards (
                    name,
                    zone
                )
            `)
            .eq('status', 'active')
            .order('issued_at', { ascending: false });

        if (error) {
            console.log('Database query failed, returning empty alerts');
            return res.json({
                success: true,
                count: 0,
                data: []
            });
        }

        res.json({
            success: true,
            count: data.length,
            data: data
        });
    } catch (error) {
        console.log('Alert controller error:', error.message);
        res.json({
            success: true,
            count: 0,
            data: []
        });
    }
};

// Get alerts by ward
exports.getAlertsByWard = async (req, res) => {
    try {
        if (!supabase) {
            return res.json({
                success: true,
                count: 0,
                data: []
            });
        }

        const { wardId } = req.params;

        const { data, error } = await supabase
            .from('alerts')
            .select('*')
            .eq('ward_id', wardId)
            .eq('status', 'active')
            .order('issued_at', { ascending: false });

        if (error) {
            console.log('Database query failed, returning empty alerts');
            return res.json({
                success: true,
                count: 0,
                data: []
            });
        }

        res.json({
            success: true,
            count: data.length,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Create new alert
exports.createAlert = async (req, res) => {
    try {
        const {
            type,
            severity,
            ward_id,
            message,
            expected_rainfall_mm,
            valid_until
        } = req.body;

        // Generate unique alert code
        const timestamp = Date.now();
        const alert_code = `ALT-${timestamp}`;

        const { data, error } = await supabase
            .from('alerts')
            .insert([
                {
                    alert_code,
                    type: type || 'rainfall',
                    severity: severity || 'medium',
                    ward_id,
                    message,
                    expected_rainfall_mm,
                    valid_until,
                    status: 'active'
                }
            ])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({
            success: true,
            message: 'Alert created successfully',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Dismiss alert
exports.dismissAlert = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('alerts')
            .update({ 
                status: 'dismissed',
                dismissed_at: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Alert dismissed',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
