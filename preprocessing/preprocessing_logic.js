const fs = require('fs');
const path = require('path');

const mappingsPath = path.join(__dirname, '../model/mappings.json');
const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf-8'));

function preprocessEducationData(data) {
    const degreeCode =
        mappings.degree[data.degree] !== undefined
            ? mappings.degree[data.degree]
            : 0;

    const specCode =
        mappings.spec[data.specialization] !== undefined
            ? mappings.spec[data.specialization]
            : 0;

    let cgpaNorm = Number(data.cgpa);
    if (data.cgpaOutOf === '10') cgpaNorm = cgpaNorm / 10;
    else if (data.cgpaOutOf === '5') cgpaNorm = cgpaNorm / 5;
    else if (data.cgpaOutOf === '4') cgpaNorm = cgpaNorm / 4;

    const certCount = data.certifications
        ? data.certifications.split(',').filter(c => c.trim().length > 0).length
        : 0;

    const internBinary = data.internship === 'Yes' ? 1 : 0;

    const projectCount = Number(data.projects) || 0;

    const sourceDataset = 0;

    return [
        sourceDataset,     
        degreeCode,       
        specCode,         
        cgpaNorm,          
        Number(data.yearOfGraduation), 
        certCount,         
        internBinary,      
        projectCount       
    ];
}

module.exports = { preprocessEducationData };
