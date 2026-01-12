const fs = require('fs');
const path = require('path');

// Read the MCD CSV file
const csvContent = fs.readFileSync(
    path.join(__dirname, 'tabula-mcd_map_full_zone_image_cd_23030712390030_230322122342342.csv'),
    'utf-8'
);

const lines = csvContent.split('\n');
const wards = [];

// Skip header
for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line === '""') continue;
    
    // Split by comma but handle complex cases
    const parts = line.split(',');
    
    // Process first ward in the row (columns 0-1)
    if (parts[0] && parts[1]) {
        const wardName = parts[0].replace(/^\d+\s+/, '').trim(); // Remove ward number
        const zoneName = parts[1].trim();
        
        if (wardName && zoneName && wardName !== '""' && zoneName !== '""') {
            wards.push({ name: wardName, zone: zoneName });
        }
    }
    
    // Process second ward in the row (columns 3-4)
    if (parts[3] && parts[4]) {
        const wardName = parts[3].replace(/^\d+\s+/, '').trim();
        let zoneName = parts[4].trim();
        
        // Handle cases where zone spans multiple columns
        if (parts[5]) {
            zoneName += ' ' + parts[5].trim();
        }
        
        if (wardName && zoneName && wardName !== '""' && zoneName !== '""') {
            wards.push({ name: wardName, zone: zoneName });
        }
    }
}

// Remove duplicates
const uniqueWards = [];
const seen = new Set();

for (const ward of wards) {
    const key = `${ward.name}|${ward.zone}`;
    if (!seen.has(key)) {
        seen.add(key);
        uniqueWards.push(ward);
    }
}

// Normalize zone names
const normalizeZone = (zone) => {
    zone = zone.replace(/Shahdara (North|South) Zone/gi, 'Shahdara Zone');
    zone = zone.replace(/Zone$/, '').trim();
    
    const zoneMap = {
        'Narela': 'North Delhi',
        'Civil Line': 'Central Delhi',
        'Rohini': 'North West Delhi',
        'Keshavpuram': 'North West Delhi',
        'City S.P.Zone': 'Central Delhi',
        'Karolbagh': 'Central Delhi',
        'West Zone': 'West Delhi',
        'Najafgarh Zone': 'South West Delhi',
        'Central Zone': 'South Delhi',
        'South Zone': 'South Delhi',
        'Shahdara Zone': 'East Delhi'
    };
    
    return zoneMap[zone] || zone;
};

// Create clean CSV
let csvOutput = 'name,zone\n';
uniqueWards.forEach(ward => {
    const cleanName = ward.name.replace(/[""]/g, '').trim();
    const cleanZone = normalizeZone(ward.zone);
    if (cleanName && cleanZone) {
        csvOutput += `${cleanName},${cleanZone}\n`;
    }
});

// Write to new file
fs.writeFileSync(path.join(__dirname, 'delhi_wards_clean.csv'), csvOutput);

console.log(`Processed ${uniqueWards.length} wards from MCD data`);
console.log('📁 Created: delhi_wards_clean.csv');
console.log('\nFirst 10 wards:');
uniqueWards.slice(0, 10).forEach(w => {
    console.log(`   ${w.name} → ${normalizeZone(w.zone)}`);
});
