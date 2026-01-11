const supabase = require('../config/supabase');

// Get all wards (with optional filters)
exports.getAllWards = async (req, res) => {
    try {
        const { zone, risk_level, min_mpi, max_mpi } = req.query;
        
        let query = supabase.from('wards').select('*');

        // Apply filters
        if (zone) query = query.eq('zone', zone);
        if (risk_level) query = query.eq('risk_level', risk_level);
        if (min_mpi) query = query.gte('mpi_score', parseInt(min_mpi));
        if (max_mpi) query = query.lte('mpi_score', parseInt(max_mpi));

        query = query.order('name', { ascending: true });

        const { data, error } = await query;

        if (error) throw error;

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

// Get ward by ID
exports.getWardById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('wards')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({
                success: false,
                error: 'Ward not found'
            });
        }

        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get high-risk wards
exports.getHighRiskWards = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('wards')
            .select('*')
            .in('risk_level', ['critical', 'alert'])
            .order('mpi_score', { ascending: true });

        if (error) throw error;

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

// Update ward status (admin function)
exports.updateWardStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('wards')
            .update({
                ...updates,
                last_updated: new Date()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Ward updated successfully',
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get ward statistics
exports.getWardStatistics = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('wards')
            .select('risk_level, mpi_score');

        if (error) throw error;

        const stats = {
            total: data.length,
            by_risk_level: {
                critical: data.filter(w => w.risk_level === 'critical').length,
                alert: data.filter(w => w.risk_level === 'alert').length,
                safe: data.filter(w => w.risk_level === 'safe').length
            },
            mpi: {
                average: Math.round(data.reduce((sum, w) => sum + w.mpi_score, 0) / data.length),
                min: Math.min(...data.map(w => w.mpi_score)),
                max: Math.max(...data.map(w => w.mpi_score))
            }
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Get wards by zone
exports.getWardsByZone = async (req, res) => {
    try {
        const { zone } = req.params;

        const { data, error } = await supabase
            .from('wards')
            .select('*')
            .eq('zone', zone)
            .order('name', { ascending: true });

        if (error) throw error;

        res.json({
            success: true,
            zone: zone,
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
