import joblib
import pandas as pd
import numpy as np

# ===============================
# LOAD MODEL & ENCODERS
# ===============================
model = joblib.load("random_forest_model.pkl")
degree_enc = joblib.load("degree_encoder.pkl")
spec_enc = joblib.load("specialization_encoder.pkl")
skills_mlb = joblib.load("skills_binarizer.pkl")
job_enc = joblib.load("jobrole_label_encoder.pkl")

# ===============================
# FUNCTION TO PREDICT JOB ROLE
# ===============================
def predict_job_role(
    degree: str,
    specialization: str,
    cgpa: float,
    year_of_graduation: int,
    internship: str,
    projects: int,
    skills: list
):
    # Encode degree & specialization
    deg_val = degree_enc.transform([degree])[0]
    spec_val = spec_enc.transform([specialization])[0]
    internship_val = 1 if internship.lower() == "yes" else 0

    # Encode skills using multi-hot
    skill_vector = skills_mlb.transform([skills])
    skill_df = pd.DataFrame(skill_vector, columns=skills_mlb.classes_)

    # Combine all features into single dataframe
    data = pd.DataFrame({
        "Degree": [deg_val],
        "Specialization": [spec_val],
        "CGPA": [cgpa],
        "YearOfGraduation": [year_of_graduation],
        "Internship": [internship_val],
        "Projects": [projects]
    })

    X_input = pd.concat([data, skill_df], axis=1)

    # Predict probabilities
    probs = model.predict_proba(X_input)[0]
    top_indices = np.argsort(probs)[::-1][:3]

    top_matches = []
    for idx in top_indices:
        role_name = job_enc.inverse_transform([idx])[0]
        confidence = round(float(probs[idx]) * 100, 2)
        top_matches.append({"role": role_name, "confidence": confidence})

    result = {
        "predicted_job_role": top_matches[0]["role"],
        "match_percentage": top_matches[0]["confidence"],
        "top_3_matches": top_matches
    }

    return result

# ===============================
# EXAMPLES (TESTING)
# ===============================
if __name__ == "__main__":
    test_inputs = [
        {
            "degree": "B.Tech",
            "specialization": "AI",
            "cgpa": 9.1,
            "year_of_graduation": 2027,
            "internship": "Yes",
            "projects": 3,
            "skills": ["Python", "Machine Learning", "SQL"]
        },
        {
            "degree": "MCA",
            "specialization": "UIUX",
            "cgpa": 8.5,
            "year_of_graduation": 2026,
            "internship": "No",
            "projects": 2,
            "skills": ["UI", "UX", "Figma"]
        },
        {
            "degree": "B.Sc",
            "specialization": "Cyber",
            "cgpa": 8.9,
            "year_of_graduation": 2025,
            "internship": "Yes",
            "projects": 1,
            "skills": ["Networking", "Cyber Security"]
        }
    ]

    for i, inp in enumerate(test_inputs, start=1):
        res = predict_job_role(**inp)
        print(f"\n--- Test Case {i} ---")
        print(f"Input Skills: {inp['skills']}")
        print(f"Predicted Role: {res['predicted_job_role']}")
        print(f"Confidence: {res['match_percentage']}%")
        print("Top 3 Matches:")
        for m in res["top_3_matches"]:
            print(f" - {m['role']}: {m['confidence']}%")
