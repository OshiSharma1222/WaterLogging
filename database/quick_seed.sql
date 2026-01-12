-- ===================================
-- MINIMAL WARD STRUCTURE (NO HARDCODED DATA)
-- Only creates ward names and zones
-- Weather service will populate rainfall, risk levels, etc.
-- ===================================

-- Insert ward structure only (names and zones)
INSERT INTO wards (name, zone) VALUES
('Connaught Place', 'Central Delhi'),
('Sadar Bazar', 'North Delhi'),
('Karol Bagh', 'Central Delhi'),
('Dwarka', 'West Delhi'),
('Rohini', 'North Delhi'),
('Laxmi Nagar', 'East Delhi'),
('Greater Kailash', 'South Delhi'),
('Shahdara', 'North East Delhi'),
('Sangam Vihar', 'South Delhi'),
('Narela', 'North Delhi'),
('Vasant Kunj', 'South Delhi'),
('Chandni Chowk', 'Central Delhi'),
('Janakpuri', 'West Delhi'),
('Mayur Vihar', 'East Delhi'),
('Pitampura', 'North Delhi');

-- Note: All weather data (rainfall, risk_level, mpi_score) will be 
-- automatically populated by the IMD Weather Service within 15 minutes

SELECT 'Ward structure created! Weather service will populate data in 15 minutes.' as status,
       COUNT(*) as total_wards FROM wards;
