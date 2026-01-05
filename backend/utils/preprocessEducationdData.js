const fs = require("fs"); 
const path = require("path");

// Load mappings (degrees and specializations)
const mappings = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../model/mappings.json"), "utf-8")
);

function preprocessEducationData(data) {
  // Normalize input: lowercase + trim
  const degreeInput = data.degree?.trim().toLowerCase() || "";
  const specInput = data.specialization?.trim().toLowerCase() || "";

  // Map to codes, fallback to 0
  const degreeCode = mappings.degree[degreeInput] ?? 0;
  const specCode = mappings.spec[specInput] ?? 0;

  return [
    0,                              // Source_Dataset (placeholder)
    degreeCode,                     // ML_Degree_Code ✅
    specCode,                       // ML_Spec_Code ✅
    data.cgpa / (parseFloat(data.cgpaOutOf) || 10), // ML_CGPA_Norm
    data.yearOfGraduation || 0,     // ML_YoG
    (data.certifications || "").split(",").filter(s => s.trim() !== "").length, // ML_Cert_Count
    data.internship === "Yes" ? 1 : 0, // ML_Intern_Binary
    parseInt(data.projects) || 0    // ML_Project_Count
  ];
}

module.exports = preprocessEducationData;
