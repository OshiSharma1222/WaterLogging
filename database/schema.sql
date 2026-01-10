-- ===================================
-- DELHI WATER-LOGGING DASHBOARD
-- MINIMAL ESSENTIAL SCHEMA (4 Core Tables)
-- ===================================

-- Enable PostGIS for GIS functionality
CREATE EXTENSION IF NOT EXISTS postgis;

-- ===================================
-- 1. WARDS (Geographic Areas)
-- ===================================

CREATE TABLE wards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    zone VARCHAR(100) NOT NULL,
    
    -- GIS Data
    boundary GEOMETRY(POLYGON, 4326),
    centroid GEOMETRY(POINT, 4326),
    
    -- Current Status
    mpi_score INTEGER DEFAULT 50,
    risk_level VARCHAR(20) DEFAULT 'safe',
    
    -- Rainfall Data
    current_rainfall DECIMAL(10, 2) DEFAULT 0,
    forecast_rainfall_3h DECIMAL(10, 2),
    failure_threshold DECIMAL(10, 2) DEFAULT 60,
    
    -- Infrastructure Metrics
    drainage_stress_index INTEGER DEFAULT 0,
    pothole_density INTEGER DEFAULT 0,
    
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wards_boundary ON wards USING GIST(boundary);
CREATE INDEX idx_wards_risk_level ON wards(risk_level);

-- ===================================
-- 2. RAINFALL READINGS
-- ===================================

CREATE TABLE rainfall_readings (
    id BIGSERIAL PRIMARY KEY,
    ward_id INTEGER REFERENCES wards(id),
    
    rainfall_mm DECIMAL(10, 2) NOT NULL,
    temperature_celsius DECIMAL(5, 2),
    humidity_percent INTEGER,
    
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'IMD'
);

CREATE INDEX idx_rainfall_ward_time ON rainfall_readings(ward_id, recorded_at DESC);

-- ===================================
-- 3. INCIDENTS (Water-logging Reports)
-- ===================================

CREATE TABLE incidents (
    id BIGSERIAL PRIMARY KEY,
    incident_code VARCHAR(50) UNIQUE,
    
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    severity VARCHAR(20) DEFAULT 'medium',
    
    ward_id INTEGER REFERENCES wards(id),
    location GEOMETRY(POINT, 4326) NOT NULL,
    address TEXT,
    
    description TEXT,
    water_depth_cm INTEGER,
    
    images JSONB DEFAULT '[]',
    
    reporter_name VARCHAR(255),
    reporter_phone VARCHAR(20),
    
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_incidents_location ON incidents USING GIST(location);
CREATE INDEX idx_incidents_ward ON incidents(ward_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_reported_at ON incidents(reported_at DESC);

-- ===================================
-- 4. ALERTS (Critical Warnings)
-- ===================================

CREATE TABLE alerts (
    id BIGSERIAL PRIMARY KEY,
    alert_code VARCHAR(50) UNIQUE,
    
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'warning',
    
    ward_id INTEGER REFERENCES wards(id),
    is_citywide BOOLEAN DEFAULT false,
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    is_active BOOLEAN DEFAULT true,
    
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alerts_active ON alerts(is_active, priority);
CREATE INDEX idx_alerts_ward ON alerts(ward_id);

-- ===================================
-- AUTO-GENERATE CODES
-- ===================================

CREATE OR REPLACE FUNCTION generate_incident_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.incident_code := 'INC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEW.id::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_incident_code_trigger 
AFTER INSERT ON incidents
FOR EACH ROW EXECUTE FUNCTION generate_incident_code();

CREATE OR REPLACE FUNCTION generate_alert_code()
RETURNS TRIGGER AS $$
BEGIN
    NEW.alert_code := 'ALR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(NEW.id::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_alert_code_trigger 
AFTER INSERT ON alerts
FOR EACH ROW EXECUTE FUNCTION generate_alert_code();

-- ===================================
-- ROW LEVEL SECURITY (Public Access)
-- ===================================

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view incidents"
    ON incidents FOR SELECT USING (true);

CREATE POLICY "Anyone can create incidents"
    ON incidents FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view alerts"
    ON alerts FOR SELECT USING (true);

-- ===================================
-- DASHBOARD SUMMARY VIEW
-- ===================================

CREATE OR REPLACE VIEW vw_dashboard_summary AS
SELECT 
    COUNT(DISTINCT w.id) as total_wards,
    COUNT(DISTINCT w.id) FILTER (WHERE w.risk_level = 'safe') as safe_wards,
    COUNT(DISTINCT w.id) FILTER (WHERE w.risk_level = 'alert') as alert_wards,
    COUNT(DISTINCT w.id) FILTER (WHERE w.risk_level = 'critical') as critical_wards,
    AVG(w.mpi_score)::INTEGER as avg_mpi_score,
    COUNT(DISTINCT i.id) FILTER (WHERE i.reported_at >= NOW() - INTERVAL '24 hours') as incidents_24h,
    COUNT(DISTINCT a.id) FILTER (WHERE a.is_active = true) as active_alerts
FROM wards w
LEFT JOIN incidents i ON w.id = i.ward_id
LEFT JOIN alerts a ON w.id = a.ward_id;
