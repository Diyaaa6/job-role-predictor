

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { preprocessEducationData } = require('./preprocessing_logic');

const DATASETS = [
    { 
        file: 'dataset_input_v2.csv',
        name: 'Academic Performance (V2)',
        cgpaScale: '5' 
    },
    { 
        file: 'dataset_input_placement.csv', 
        name: 'Student Placement Data', 
        cgpaScale: '10' 
    }
];
const OUTPUT_FILE_BASE = 'preprocessed_output';


function processFile(datasetConfig) {
    const INPUT_FILE = path.join(__dirname, datasetConfig.file);
    const OUTPUT_FILE = path.join(__dirname, `${OUTPUT_FILE_BASE}_${datasetConfig.name.replace(/\s|\(|\)/g, '_')}.csv`);
    const processedResults = [];
    
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`\n❌ ERROR: Input file not found: ${INPUT_FILE}. Skipping dataset.`);
        return Promise.resolve();
    }
    
    const writer = fs.createWriteStream(OUTPUT_FILE);

    console.log(`\n--- PROCESSING: ${datasetConfig.name} ---`);
    console.log(`[Processor] Reading data from: ${INPUT_FILE}`);
    
    
    writer.write('Source_Dataset,Original_Degree,Original_CGPA,ML_Degree_Code,ML_Spec_Code,ML_CGPA_Norm,ML_YoG,ML_Cert_Count\n');

    return new Promise((resolve, reject) => {
        fs.createReadStream(INPUT_FILE)
            .pipe(csv())
            .on('data', (row) => {
                
                let degreeField, specField, cgpaField, yearField;

                if (datasetConfig.name.includes('Academic')) {
                    degreeField = row['Prog Code'] || '';
                    specField = row['Prog Code'] || '';
                    cgpaField = row['CGPA'] || '0'; 
                    yearField = row['YoG'] || '2000';
                } else if (datasetConfig.name.includes('Placement')) {
                    
                    degreeField = row['Department'] || ''; 
                    specField = row['Department'] || ''; 
                   
                    cgpaField = row['CGPA'] || '0'; 
                    yearField = row['GraduationYear'] || '2000'; 
                } else {
                    return; 
                }

                const mappedData = {
                    degree: degreeField,
                    specialization: specField, 
                    cgpa: cgpaField, 
                    cgpaOutOf: datasetConfig.cgpaScale, 
                    yearOfGraduation: yearField,
                    certifications: row['Certifications'] || '' 
                };


                const processedVector = preprocessEducationData(mappedData);


                writer.write(
                    `${datasetConfig.name},${mappedData.degree},${mappedData.cgpa},` + 
                    `${processedVector[0]},${processedVector[1]},${processedVector[2]},${processedVector[3]},${processedVector[4]}\n`
                );
                processedResults.push(processedVector);
            })
            .on('end', () => {
                writer.end();
                console.log(`✅ ${datasetConfig.name} complete! ${processedResults.length} records processed.`);
                console.log(`Sample Output (First 1):`, processedResults.slice(0, 1));
                console.log(`Results saved to: ${OUTPUT_FILE}`);
                resolve();
            })
            .on('error', (err) => {
                console.error(`❌ Error processing ${datasetConfig.name}:`, err.message);
                reject(err);
            });
    });
}


async function runBatchProcessor() {
    console.log('\nSTARTING MILESTONE 2 BATCH PROCESS DEMO');
    try {
        for (const dataset of DATASETS) {
            await processFile(dataset);
        }
        console.log('\nALL BATCH PROCESSING TASKS COMPLETED. DATA READY FOR ML MODEL.');
    } catch (e) {
        console.error('\nFATAL ERROR DURING BATCH PROCESSING:', e);
    }
}

runBatchProcessor();