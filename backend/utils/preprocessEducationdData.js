const fs = require("fs"); 
const path = require("path");

const mappings = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../model/mappings.json"), "utf-8")
);

function preprocessEducationData(data) {

  const degreeInput = data.degree?.trim().toLowerCase() || "";
  const specInput = data.specialization?.trim().toLowerCase() || "";

 
  const degreeCode = mappings.degree[degreeInput] ?? 0;
  const specCode = mappings.spec[specInput] ?? 0;

  return [
    0,                              
    degreeCode,                    
    specCode,                       
    data.cgpa / (parseFloat(data.cgpaOutOf) || 10),
    data.yearOfGraduation || 0,    
    (data.certifications || "").split(",").filter(s => s.trim() !== "").length, 
    data.internship === "Yes" ? 1 : 0, 
    parseInt(data.projects) || 0    
  ];
}

module.exports = preprocessEducationData;
