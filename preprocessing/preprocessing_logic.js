const fs = require('fs');
const path = require('path');

// Load mappings ONCE
const mappingsPath = path.join(__dirname, '../model/mappings.json');
const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf-8'));

function preprocessEducationData(data) {
    // ------------------ DEGREE & SPECIALIZATION ------------------
    const degreeCode =
        mappings.degree[data.degree] !== undefined
            ? mappings.degree[data.degree]
            : 0;

    const specCode =
        mappings.spec[data.specialization] !== undefined
            ? mappings.spec[data.specialization]
            : 0;

    // ------------------ CGPA NORMALIZATION ------------------
    let cgpaNorm = Number(data.cgpa);
    if (data.cgpaOutOf === '10') cgpaNorm = cgpaNorm / 10;
    else if (data.cgpaOutOf === '5') cgpaNorm = cgpaNorm / 5;
    else if (data.cgpaOutOf === '4') cgpaNorm = cgpaNorm / 4;

    // ------------------ CERTIFICATIONS ------------------
    const certCount = data.certifications
        ? data.certifications.split(',').filter(c => c.trim().length > 0).length
        : 0;

    // ------------------ INTERNSHIP ------------------
    const internBinary = data.internship === 'Yes' ? 1 : 0;

    // ------------------ PROJECT COUNT ------------------
    const projectCount = Number(data.projects) || 0;

    // ------------------ SOURCE DATASET (LIVE USER = 0) ------------------
    const sourceDataset = 0;

    // ------------------ FINAL 8 FEATURE VECTOR ------------------
    return [
        sourceDataset,     // Source_Dataset
        degreeCode,        // ML_Degree_Code
        specCode,          // ML_Spec_Code
        cgpaNorm,          // ML_CGPA_Norm
        Number(data.yearOfGraduation), // ML_YoG
        certCount,         // ML_Cert_Count
        internBinary,      // ML_Intern_Binary
        projectCount       // ML_Project_Count
    ];
}

module.exports = { preprocessEducationData };
