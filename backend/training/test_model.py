import joblib
import pandas as pd
import numpy as np
import sys
import json

# Load model & encoders
model = joblib.load("random_forest_model.pkl")
degree_enc = joblib.load("degree_encoder.pkl")
spec_enc = joblib.load("specialization_encoder.pkl")
skills_mlb = joblib.load("skills_binarizer.pkl")
job_enc = joblib.load("jobrole_label_encoder.pkl")

# Function to predict
def predict_job_role(inp):
    degree = inp["degree"]
    specialization = inp["specialization"]
    cgpa = inp["cgpa"]
    year_of_graduation = inp["yearOfGraduation"]
    internship = inp["internship"]
    projects = inp["projects"]
    skills = inp["skills"]

    deg_val = degree_enc.transform([degree])[0]
    spec_val = spec_enc.transform([specialization])[0]
    internship_val = 1 if internship.lower() == "yes" else 0

    skill_vector = skills_mlb.transform([skills])
    skill_df = pd.DataFrame(skill_vector, columns=skills_mlb.classes_)

    data = pd.DataFrame({
        "Degree": [deg_val],
        "Specialization": [spec_val],
        "CGPA": [cgpa],
        "YearOfGraduation": [year_of_graduation],
        "Internship": [internship_val],
        "Projects": [projects]
    })

    X_input = pd.concat([data, skill_df], axis=1)

    probs = model.predict_proba(X_input)[0]
    top_indices = np.argsort(probs)[::-1][:3]

    top_matches = []
    for idx in top_indices:
        role_name = job_enc.inverse_transform([idx])[0]
        confidence = round(float(probs[idx])*100, 2)
        top_matches.append({"role": role_name, "confidence": confidence})

    return {
        "predicted_job_role": top_matches[0]["role"],
        "match_percentage": top_matches[0]["confidence"],
        "top_3_matches": top_matches
    }

# Read input from Node.js
if __name__ == "__main__":
    inp_json = json.loads(sys.argv[1])
    result = predict_job_role(inp_json)
    print(json.dumps(result))  # Node.js will read this as JSON
