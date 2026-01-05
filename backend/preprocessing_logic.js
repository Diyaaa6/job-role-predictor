const fs = require('fs');
const path = require('path');

const MAPPINGS_PATH = path.join(__dirname, '../model/mappings.json');
let MAPPINGS = { degree: {}, spec: {} };

if (fs.existsSync(MAPPINGS_PATH)) {
    MAPPINGS = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
}

function preprocessEducationData(data) {

    const degreeCode = MAPPINGS.degree[data.degree?.toUpperCase()] || 0;
    const specCode = MAPPINGS.spec[data.specialization?.toUpperCase()] || 0;


    const cgpaRaw = parseFloat(data.cgpa) || 0;
    const scale = parseFloat(data.cgpaOutOf) || 10;
    const cgpaNorm = cgpaRaw / scale;

    const internBinary = (data.internship === 'Yes' || data.employmentType === 'internship') ? 1 : 0;
    const projectCount = parseInt(data.projects || data.stProjCount) || 0;
    const certCount = data.certifications ? data.certifications.split(',').filter(c => c.trim().length > 0).length : 0;

    const sourceDataset = data.sourceDataset === 'Placement' ? 1 : 0;

    return [
        sourceDataset,                          
        degreeCode,                             
        specCode,                               
        cgpaNorm,                              
        parseInt(data.yearOfGraduation) || 2025, 
        certCount,                              
        internBinary,                           
        projectCount                            
    ];
}

module.exports = { preprocessEducationData };