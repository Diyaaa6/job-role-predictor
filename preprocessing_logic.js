const fs = require('fs');
const path = require('path');

/**
 * Load Dynamic Mappings: Ensures Node.js and Python use the same 
 * integer codes for categorical strings (e.g., "B.Tech" = 1).
 */
const MAPPINGS_PATH = path.join(__dirname, '../model/mappings.json');
let MAPPINGS = { degree: {}, spec: {} };

if (fs.existsSync(MAPPINGS_PATH)) {
    MAPPINGS = JSON.parse(fs.readFileSync(MAPPINGS_PATH, 'utf8'));
}

/**
 * Preprocess Education Data
 * Transforms raw user input into the strict 8-feature numerical vector 
 * required by the Random Forest model.
 */
function preprocessEducationData(data) {
    // 1. Dynamic Encoding from mappings.json
    const degreeCode = MAPPINGS.degree[data.degree?.toUpperCase()] || 0;
    const specCode = MAPPINGS.spec[data.specialization?.toUpperCase()] || 0;

    // 2. Normalization: CGPA / Scale (e.g., 8.5 / 10 = 0.85)
    const cgpaRaw = parseFloat(data.cgpa) || 0;
    const scale = parseFloat(data.cgpaOutOf) || 10;
    const cgpaNorm = cgpaRaw / scale;

    // 3. Feature Extraction
    const internBinary = (data.internship === 'Yes' || data.employmentType === 'internship') ? 1 : 0;
    const projectCount = parseInt(data.projects || data.stProjCount) || 0;
    const certCount = data.certifications ? data.certifications.split(',').filter(c => c.trim().length > 0).length : 0;
    
    // 4. Source Dataset Identifier
    const sourceDataset = data.sourceDataset === 'Placement' ? 1 : 0;

    /**
     * CRITICAL: 8-FEATURE VECTOR ALIGNMENT
     * The order must exactly match the list in random_forest_train.py:
     * [Source, Degree, Spec, CGPA, YoG, Certs, Intern, Projects]
     */
    return [
        sourceDataset,                          // 1. Source_Dataset
        degreeCode,                             // 2. ML_Degree_Code
        specCode,                               // 3. ML_Spec_Code
        cgpaNorm,                               // 4. ML_CGPA_Norm
        parseInt(data.yearOfGraduation) || 2025, // 5. ML_YoG
        certCount,                              // 6. ML_Cert_Count
        internBinary,                           // 7. ML_Intern_Binary
        projectCount                            // 8. ML_Project_Count
    ];
}

module.exports = { preprocessEducationData };