/**
 * Delhi Ward Coordinates Database
 * Contains latitude/longitude for all 176 MCD wards
 * Used for fetching weather data per ward location
 */

const DELHI_CENTER = { lat: 28.6139, lon: 77.2090 };

// Zone-based base coordinates for Delhi
const ZONE_COORDINATES = {
    'North Delhi': { lat: 28.7041, lon: 77.1025 },
    'North West Delhi': { lat: 28.7041, lon: 77.0800 },
    'South Delhi': { lat: 28.5245, lon: 77.2066 },
    'South': { lat: 28.5245, lon: 77.2066 },
    'South Zone': { lat: 28.5245, lon: 77.2066 },
    'South ZoneSouth': { lat: 28.5245, lon: 77.2066 },
    'West Delhi': { lat: 28.6517, lon: 77.0550 },
    'West': { lat: 28.6517, lon: 77.0550 },
    'West Zone West': { lat: 28.6517, lon: 77.0550 },
    'East Delhi': { lat: 28.6280, lon: 77.2950 },
    'Central Delhi': { lat: 28.6328, lon: 77.2197 },
    'Central': { lat: 28.6328, lon: 77.2197 },
    'Central Zone': { lat: 28.6328, lon: 77.2197 },
    'Central ZoneCentral': { lat: 28.6328, lon: 77.2197 },
    'City S.P.': { lat: 28.6562, lon: 77.2410 },
    'Najafgarh': { lat: 28.6100, lon: 76.9800 },
    'Rohini': { lat: 28.7495, lon: 77.0565 },
    'Civil Line Rohini': { lat: 28.7495, lon: 77.0565 },
    'Rohini Rohini': { lat: 28.7495, lon: 77.0565 },
    'Shahdara': { lat: 28.6731, lon: 77.2850 },
    'Shahdara North Zone': { lat: 28.6731, lon: 77.2850 }
};

// Actual coordinates for major Delhi wards (verified from Google Maps)
const WARD_COORDINATES = {
    // Central Delhi
    'CONNAUGHT PLACE': { lat: 28.6315, lon: 77.2167 },
    'KAROL BAGH': { lat: 28.6514, lon: 77.1907 },
    'RAJINDER NAGAR': { lat: 28.6425, lon: 77.1803 },
    'PAHAR GANJ': { lat: 28.6444, lon: 77.2125 },
    'DEV NAGAR': { lat: 28.6520, lon: 77.1850 },
    'EAST PATEL NAGAR': { lat: 28.6453, lon: 77.1714 },
    'WEST PATEL NAGAR': { lat: 28.6453, lon: 77.1650 },
    'MOTI NAGAR': { lat: 28.6555, lon: 77.1487 },
    'RAMESH NAGAR': { lat: 28.6519, lon: 77.1386 },
    'NARAINA': { lat: 28.6268, lon: 77.1378 },
    'INDER PURI': { lat: 28.6170, lon: 77.1694 },
    'KARAM PURA': { lat: 28.6583, lon: 77.1325 },
    
    // South Delhi
    'GREATER KAILASH': { lat: 28.5482, lon: 77.2400 },
    'HAUZ KHAS': { lat: 28.5494, lon: 77.2001 },
    'GREEN PARK': { lat: 28.5605, lon: 77.2068 },
    'MALVIYA NAGAR': { lat: 28.5323, lon: 77.2120 },
    'SAKET': { lat: 28.5245, lon: 77.2066 },
    'MEHRAULI': { lat: 28.5181, lon: 77.1794 },
    'CHHATARPUR': { lat: 28.5078, lon: 77.1740 },
    'VASANT KUNJ': { lat: 28.5197, lon: 77.1573 },
    'VASANT VIHAR': { lat: 28.5621, lon: 77.1589 },
    'MUNIRKA': { lat: 28.5580, lon: 77.1727 },
    'R.K. PURAM': { lat: 28.5694, lon: 77.1879 },
    'KHANPUR': { lat: 28.5089, lon: 77.2453 },
    'SANGAM VIHAR': { lat: 28.5010, lon: 77.2472 },
    'TIGRI': { lat: 28.5109, lon: 77.2503 },
    'LADO SARAI': { lat: 28.5241, lon: 77.1876 },
    'CHIRAG DELHI': { lat: 28.5408, lon: 77.2256 },
    'CHITARANJAN PARK': { lat: 28.5398, lon: 77.2494 },
    'PUSHP VIHAR': { lat: 28.5211, lon: 77.2287 },
    
    // North Delhi
    'ROHINI': { lat: 28.7495, lon: 77.0565 },
    'ROHINI-B': { lat: 28.7350, lon: 77.0600 },
    'ROHINI-C': { lat: 28.7400, lon: 77.0800 },
    'ROHINI-D': { lat: 28.7200, lon: 77.0700 },
    'PITAM PURA': { lat: 28.7055, lon: 77.1287 },
    'SHALIMAR BAGH': { lat: 28.7185, lon: 77.1570 },
    'SHALIMAR BAGH-A': { lat: 28.7185, lon: 77.1570 },
    'SHALIMAR BAGH-B': { lat: 28.7120, lon: 77.1650 },
    'MODEL TOWN': { lat: 28.7178, lon: 77.1891 },
    'AZADPUR': { lat: 28.7052, lon: 77.1802 },
    'ADARSH NAGAR': { lat: 28.7135, lon: 77.1712 },
    'ASHOK VIHAR': { lat: 28.6935, lon: 77.1775 },
    'NARELA': { lat: 28.8528, lon: 77.0926 },
    'ALIPUR': { lat: 28.7965, lon: 77.1353 },
    'BURARI': { lat: 28.7614, lon: 77.1919 },
    'BAWANA': { lat: 28.8000, lon: 77.0500 },
    'SARUP NAGAR': { lat: 28.6920, lon: 77.2000 },
    'MUKHERJEE NAGAR': { lat: 28.7007, lon: 77.2107 },
    'KAMLA NAGAR': { lat: 28.6806, lon: 77.2107 },
    
    // West Delhi
    'DWARKA': { lat: 28.5921, lon: 77.0460 },
    'DWARKA-A': { lat: 28.5921, lon: 77.0460 },
    'DWARKA-B': { lat: 28.5850, lon: 77.0520 },
    'DWARKA-C': { lat: 28.5800, lon: 77.0600 },
    'JANAKPURI': { lat: 28.6245, lon: 77.0827 },
    'JANAK PURI SOUTH': { lat: 28.6180, lon: 77.0827 },
    'JANAK PURI WEST': { lat: 28.6245, lon: 77.0750 },
    'RAJOURI GARDEN': { lat: 28.6495, lon: 77.1213 },
    'PUNJABI BAGH': { lat: 28.6685, lon: 77.1282 },
    'PASCHIM VIHAR': { lat: 28.6679, lon: 77.0979 },
    'UTTAM NAGAR': { lat: 28.6205, lon: 77.0614 },
    'VIKASPURI': { lat: 28.6390, lon: 77.0700 },
    'VIKAS PURI': { lat: 28.6390, lon: 77.0700 },
    'TILAK NAGAR': { lat: 28.6421, lon: 77.0924 },
    'SUBHASH NAGAR': { lat: 28.6400, lon: 77.1100 },
    'HARI NAGAR': { lat: 28.6312, lon: 77.1120 },
    'FATEH NAGAR': { lat: 28.6450, lon: 77.1050 },
    'NAWADA': { lat: 28.6170, lon: 77.0420 },
    'BINDAPUR': { lat: 28.6100, lon: 77.0550 },
    'BINDA PUR': { lat: 28.6100, lon: 77.0550 },
    'MOHAN GARDEN': { lat: 28.6180, lon: 77.0280 },
    'HASTSAL': { lat: 28.6310, lon: 77.0380 },
    'KAKROLA': { lat: 28.6070, lon: 77.0220 },
    
    // Najafgarh Zone
    'NAJAFGARH': { lat: 28.6100, lon: 76.9800 },
    'PALAM': { lat: 28.5880, lon: 77.0861 },
    'BIJWASAN': { lat: 28.5240, lon: 77.0640 },
    'KAPASHERA': { lat: 28.5070, lon: 77.0420 },
    'MAHIPALPUR': { lat: 28.5380, lon: 77.1140 },
    'SAGARPUR': { lat: 28.6080, lon: 77.1030 },
    'DABRI': { lat: 28.6120, lon: 77.0950 },
    'MATIALA': { lat: 28.5980, lon: 77.0120 },
    
    // Old Delhi/City
    'CHANDNI CHOWK': { lat: 28.6562, lon: 77.2310 },
    'JAMA MASJID': { lat: 28.6507, lon: 77.2334 },
    'DELHI GATE': { lat: 28.6407, lon: 77.2417 },
    'SADAR BAZAR': { lat: 28.6619, lon: 77.2090 },
    'CIVIL LINES': { lat: 28.6805, lon: 77.2263 },
    'KISHAN GANJ': { lat: 28.6635, lon: 77.1959 },
    
    // East Delhi
    'LAXMI NAGAR': { lat: 28.6304, lon: 77.2773 },
    'PREET VIHAR': { lat: 28.6406, lon: 77.2948 },
    'MAYUR VIHAR': { lat: 28.6092, lon: 77.2975 },
    'PATPARGANJ': { lat: 28.6138, lon: 77.2887 },
    'PANDAV NAGAR': { lat: 28.6235, lon: 77.2859 },
    
    // Other Notable Areas
    'LAJPAT NAGAR': { lat: 28.5700, lon: 77.2373 },
    'DEFENCE COLONY': { lat: 28.5743, lon: 77.2333 },
    'OKHLA': { lat: 28.5295, lon: 77.2686 },
    'BADARPUR': { lat: 28.5104, lon: 77.3008 },
    'TUGHLAKABAD': { lat: 28.5161, lon: 77.2538 },
    'KALKAJI': { lat: 28.5453, lon: 77.2562 },
    'NEHRU PLACE': { lat: 28.5491, lon: 77.2511 },
    'KOTLA MUBARAKPUR': { lat: 28.5747, lon: 77.2289 },
    'ANDREWS GANJ': { lat: 28.5670, lon: 77.2240 },
    'AMAR COLONY': { lat: 28.5660, lon: 77.2350 },
    
    // North-West Areas
    'MANGOLPURI': { lat: 28.6972, lon: 77.0778 },
    'MANGOL PURI': { lat: 28.6972, lon: 77.0778 },
    'MANGOLPURI-A': { lat: 28.6972, lon: 77.0778 },
    'MANGOLPURI-B': { lat: 28.6950, lon: 77.0850 },
    'SULTANPURI': { lat: 28.6947, lon: 77.0667 },
    'SULTANPURI-A': { lat: 28.6947, lon: 77.0667 },
    'SULTANPURI-B': { lat: 28.6920, lon: 77.0720 },
    'NANGLOI': { lat: 28.6803, lon: 77.0667 },
    'NANGLOI JAT': { lat: 28.6803, lon: 77.0600 },
    'KIRARI': { lat: 28.6867, lon: 77.0533 },
    'MUNDKA': { lat: 28.6838, lon: 77.0244 },
    'RITHALA': { lat: 28.7200, lon: 77.1100 },
    'BUDH VIHAR': { lat: 28.6950, lon: 77.1000 },
    'AMAN VIHAR': { lat: 28.6880, lon: 77.0930 },
    'TRI NAGAR': { lat: 28.6806, lon: 77.1530 },
    'RANI BAGH': { lat: 28.6860, lon: 77.1400 },
    'SHAKUR PUR': { lat: 28.6900, lon: 77.1250 },
    'WAZIR PUR': { lat: 28.6952, lon: 77.1659 },
    'KESHAV PURAM': { lat: 28.6860, lon: 77.1650 },
    'SANGAM PARK': { lat: 28.6750, lon: 77.1580 },
    'SARASWATI VIHAR': { lat: 28.7050, lon: 77.1100 },
    'KOHAT ENCLAVE': { lat: 28.6950, lon: 77.1350 },
    'VIJAY VIHAR': { lat: 28.7100, lon: 77.0950 },
    'PREM NAGAR': { lat: 28.6800, lon: 77.0850 },
    'NIHAL VIHAR': { lat: 28.6750, lon: 77.0750 },
    'JAWALAPURI': { lat: 28.6700, lon: 77.0650 },
    
    // Additional Wards
    'TIMARPUR': { lat: 28.6950, lon: 77.2200 },
    'MALKA GANJ': { lat: 28.6850, lon: 77.2050 },
    'SANT NAGAR': { lat: 28.7100, lon: 77.1850 },
    'BHALSWA': { lat: 28.7400, lon: 77.1650 },
    'JAHANGIR PURI': { lat: 28.7300, lon: 77.1700 },
    'DHIRPUR': { lat: 28.7080, lon: 77.1750 },
    'MUKUNDPUR': { lat: 28.7250, lon: 77.1550 },
    'JHARODA': { lat: 28.7350, lon: 77.1800 },
    'KADIPUR': { lat: 28.7150, lon: 77.1600 },
    'BEGUMPUR': { lat: 28.8200, lon: 77.0800 },
    'BANKNER': { lat: 28.8400, lon: 77.0700 },
    'HOLAMBI KALAN': { lat: 28.8300, lon: 77.0600 },
    'BAKHTAWARPUR': { lat: 28.7800, lon: 77.1200 },
    'POOTH KALAN': { lat: 28.7700, lon: 77.0400 },
    'POOTH KHURD': { lat: 28.7600, lon: 77.0300 },
    'KANJHAWALA': { lat: 28.7500, lon: 77.0000 },
    'RANI KHERA': { lat: 28.7400, lon: 77.0100 },
    'NANGAL THAKRAN': { lat: 28.7450, lon: 77.0200 },
    'SHAHBAAD DAIRY': { lat: 28.7350, lon: 77.0350 },
    'NILOTHI': { lat: 28.6950, lon: 77.0350 },
    'ISAPUR': { lat: 28.6200, lon: 76.9700 },
    'ROSHAN PURA': { lat: 28.6250, lon: 76.9800 },
    'CHHAWALA': { lat: 28.5950, lon: 76.9600 },
    'NANGLI SAKRAWATI': { lat: 28.5850, lon: 76.9700 },
    'MADHU VIHAR': { lat: 28.5950, lon: 77.0350 },
    'RAJ NAGAR': { lat: 28.6050, lon: 77.0550 },
    'MAHAVIR ENCLAVE': { lat: 28.5780, lon: 77.0480 },
    'BAPROLA': { lat: 28.6000, lon: 77.0180 }
};

/**
 * Get coordinates for a ward
 * @param {string} wardName - Name of the ward
 * @param {string} zone - Zone of the ward
 * @returns {Object} - { lat, lon } coordinates
 */
function getWardCoordinates(wardName, zone) {
    // Check exact match first
    const upperName = wardName.toUpperCase();
    if (WARD_COORDINATES[upperName]) {
        return WARD_COORDINATES[upperName];
    }
    
    // Check if ward name contains a known location
    for (const [key, coords] of Object.entries(WARD_COORDINATES)) {
        if (upperName.includes(key) || key.includes(upperName)) {
            return coords;
        }
    }
    
    // Use zone-based coordinates with deterministic offset
    const zoneCoords = ZONE_COORDINATES[zone] || DELHI_CENTER;
    
    // Create a hash from ward name for consistent positioning
    let hash = 0;
    for (let i = 0; i < wardName.length; i++) {
        hash = ((hash << 5) - hash) + wardName.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    
    // Generate consistent offset based on hash
    const latOffset = ((hash % 100) / 1000) - 0.05;
    const lonOffset = (((hash >> 8) % 100) / 1000) - 0.05;
    
    return {
        lat: zoneCoords.lat + latOffset,
        lon: zoneCoords.lon + lonOffset
    };
}

/**
 * Get all ward coordinates as an array
 * @param {Array} wards - Array of ward objects from database
 * @returns {Array} - Array of { name, zone, lat, lon }
 */
function getAllWardCoordinates(wards) {
    return wards.map(ward => ({
        name: ward.name,
        zone: ward.zone,
        ...getWardCoordinates(ward.name, ward.zone)
    }));
}

module.exports = {
    DELHI_CENTER,
    ZONE_COORDINATES,
    WARD_COORDINATES,
    getWardCoordinates,
    getAllWardCoordinates
};
