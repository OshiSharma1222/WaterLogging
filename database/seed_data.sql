-- ===================================
-- DELHI WATER-LOGGING DASHBOARD
-- SEED DATA - Delhi Wards
-- ===================================

-- Insert Delhi Wards with realistic data
INSERT INTO wards (name, zone, mpi_score, risk_level, current_rainfall, forecast_rainfall_3h, failure_threshold, drainage_stress_index, pothole_density) VALUES
-- Central Delhi
('Connaught Place', 'Central Delhi', 75, 'safe', 0, 25, 60, 35, 20),
('Karol Bagh', 'Central Delhi', 52, 'alert', 12, 45, 55, 62, 48),
('Paharganj', 'Central Delhi', 45, 'alert', 15, 50, 50, 68, 65),
('Darya Ganj', 'Central Delhi', 58, 'safe', 8, 35, 55, 55, 42),

-- North Delhi
('Civil Lines', 'North Delhi', 68, 'safe', 5, 30, 65, 42, 28),
('Model Town', 'North Delhi', 62, 'safe', 7, 32, 60, 48, 35),
('Sadar Bazar', 'North Delhi', 38, 'critical', 22, 68, 45, 78, 72),
('Kashmere Gate', 'North Delhi', 55, 'alert', 11, 42, 55, 58, 45),
('Burari', 'North Delhi', 48, 'alert', 14, 55, 50, 65, 58),
('Narela', 'North Delhi', 42, 'critical', 18, 62, 48, 72, 68),

-- South Delhi
('Greater Kailash', 'South Delhi', 82, 'safe', 0, 18, 70, 22, 12),
('Hauz Khas', 'South Delhi', 65, 'safe', 6, 28, 65, 38, 25),
('Saket', 'South Delhi', 78, 'safe', 2, 22, 68, 28, 18),
('Vasant Vihar', 'South Delhi', 85, 'safe', 0, 15, 72, 18, 10),
('Mehrauli', 'South Delhi', 52, 'alert', 12, 48, 55, 60, 52),
('Sangam Vihar', 'South Delhi', 35, 'critical', 25, 72, 42, 82, 78),

-- East Delhi
('Mayur Vihar', 'East Delhi', 58, 'safe', 9, 38, 58, 52, 38),
('Laxmi Nagar', 'East Delhi', 48, 'alert', 14, 52, 52, 66, 58),
('Preet Vihar', 'East Delhi', 62, 'safe', 7, 32, 60, 45, 32),
('Gandhi Nagar', 'East Delhi', 42, 'critical', 18, 65, 48, 75, 68),
('Shahdara', 'East Delhi', 45, 'alert', 16, 58, 50, 70, 62),
('Seelampur', 'East Delhi', 38, 'critical', 22, 70, 45, 80, 75),

-- West Delhi
('Rajouri Garden', 'West Delhi', 68, 'safe', 5, 28, 62, 42, 28),
('Janakpuri', 'West Delhi', 72, 'safe', 3, 25, 65, 35, 22),
('Dwarka', 'West Delhi', 75, 'safe', 2, 20, 68, 30, 18),
('Punjabi Bagh', 'West Delhi', 65, 'safe', 6, 30, 62, 40, 30),
('Tilak Nagar', 'West Delhi', 52, 'alert', 12, 48, 55, 62, 52),
('Najafgarh', 'West Delhi', 42, 'critical', 18, 62, 48, 72, 68),
('Nangloi', 'West Delhi', 45, 'alert', 15, 55, 50, 68, 60),

-- New Delhi (Municipal Council)
('Lutyens Delhi', 'New Delhi', 88, 'safe', 0, 12, 75, 15, 8),
('India Gate', 'New Delhi', 85, 'safe', 0, 15, 72, 18, 10),
('Chanakyapuri', 'New Delhi', 90, 'safe', 0, 10, 78, 12, 5);

-- Insert some sample incidents
INSERT INTO incidents (type, status, severity, ward_id, location, address, description, water_depth_cm, reporter_name, reporter_phone) VALUES
('waterlogging', 'pending', 'high', 7, ST_SetSRID(ST_MakePoint(77.2167, 28.6562), 4326), 'Sadar Bazar Main Road', 'Heavy waterlogging blocking traffic', 45, 'Rajesh Kumar', '+91-9876543210'),
('pothole', 'verified', 'medium', 16, ST_SetSRID(ST_MakePoint(77.2750, 28.5355), 4326), 'Sangam Vihar Road', 'Large pothole causing vehicle damage', 0, 'Priya Sharma', '+91-9876543211'),
('drainage', 'pending', 'high', 22, ST_SetSRID(ST_MakePoint(77.2867, 28.6562), 4326), 'Seelampur Market', 'Drainage overflow on main street', 30, 'Mohammed Ali', '+91-9876543212'),
('waterlogging', 'verified', 'critical', 10, ST_SetSRID(ST_MakePoint(77.0847, 28.8386), 4326), 'Narela Industrial Area', 'Severe waterlogging affecting businesses', 60, 'Suresh Verma', '+91-9876543213'),
('pothole', 'pending', 'low', 12, ST_SetSRID(ST_MakePoint(77.1925, 28.5729), 4326), 'GK-2 M Block', 'Small pothole near residential area', 0, 'Anjali Gupta', '+91-9876543214');

-- Insert active alerts
INSERT INTO alerts (type, priority, ward_id, is_citywide, title, message, valid_until) VALUES
('rainfall', 'critical', 7, false, 'Heavy Rainfall Alert - Sadar Bazar', 'IMD forecasts 68mm rainfall in next 3 hours. Avoid non-essential travel.', NOW() + INTERVAL '6 hours'),
('infrastructure', 'warning', 22, false, 'Drainage System Alert - Seelampur', 'Drainage system operating at 80% capacity. Monitor conditions closely.', NOW() + INTERVAL '12 hours'),
('rainfall', 'warning', NULL, true, 'Citywide Monsoon Advisory', 'Moderate to heavy rainfall expected across Delhi. Exercise caution while traveling.', NOW() + INTERVAL '24 hours'),
('waterlogging', 'critical', 16, false, 'Severe Waterlogging - Sangam Vihar', 'Multiple reports of severe waterlogging. Emergency response teams deployed.', NOW() + INTERVAL '8 hours');

-- Insert sample rainfall readings (last 24 hours)
INSERT INTO rainfall_readings (ward_id, rainfall_mm, temperature_celsius, humidity_percent, recorded_at) VALUES
-- Recent readings (last 3 hours)
(7, 22.5, 28.5, 85, NOW() - INTERVAL '1 hour'),
(10, 18.3, 27.8, 82, NOW() - INTERVAL '1 hour'),
(16, 25.8, 29.2, 88, NOW() - INTERVAL '1 hour'),
(22, 22.1, 28.9, 86, NOW() - INTERVAL '1 hour'),
(3, 15.4, 28.3, 80, NOW() - INTERVAL '2 hours'),
(21, 16.8, 28.1, 81, NOW() - INTERVAL '2 hours'),

-- Earlier readings (3-6 hours ago)
(7, 18.2, 29.1, 78, NOW() - INTERVAL '4 hours'),
(10, 15.6, 28.8, 75, NOW() - INTERVAL '4 hours'),
(16, 20.3, 29.5, 82, NOW() - INTERVAL '5 hours'),

-- Morning readings (6-12 hours ago)
(7, 8.5, 30.2, 72, NOW() - INTERVAL '8 hours'),
(10, 7.2, 29.8, 70, NOW() - INTERVAL '8 hours'),
(16, 10.5, 30.5, 75, NOW() - INTERVAL '9 hours');

-- ===================================
-- VERIFICATION QUERIES
-- ===================================

-- Check ward count
SELECT COUNT(*) as total_wards FROM wards;

-- Check wards by risk level
SELECT risk_level, COUNT(*) as count 
FROM wards 
GROUP BY risk_level 
ORDER BY CASE risk_level 
    WHEN 'critical' THEN 1 
    WHEN 'alert' THEN 2 
    WHEN 'safe' THEN 3 
END;

-- Check incidents
SELECT type, status, COUNT(*) as count 
FROM incidents 
GROUP BY type, status;

-- Check active alerts
SELECT priority, COUNT(*) as count 
FROM alerts 
WHERE is_active = true 
GROUP BY priority;

-- ===================================
-- SUCCESS MESSAGE
-- ===================================
SELECT '✅ Seed data inserted successfully!' as message,
       (SELECT COUNT(*) FROM wards) as total_wards,
       (SELECT COUNT(*) FROM incidents) as total_incidents,
       (SELECT COUNT(*) FROM alerts) as total_alerts,
       (SELECT COUNT(*) FROM rainfall_readings) as total_readings;
