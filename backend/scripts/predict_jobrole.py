import sys
import json
import joblib
import pandas as pd
import numpy as np
import os

script_dir = os.path.dirname(os.path.abspath(__file__))

model_path = os.path.join(script_dir, "../model/random_forest_model.pkl")
degree_enc_path = os.path.join(script_dir, "../model/degree_encoder.pkl")
spec_enc_path = os.path.join(script_dir, "../model/specialization_encoder.pkl")
skills_mlb_path = os.path.join(script_dir, "../model/skills_binarizer.pkl")
job_enc_path = os.path.join(script_dir, "../model/jobrole_label_encoder.pkl")

model = joblib.load(model_path)
degree_enc = joblib.load(degree_enc_path)
spec_enc = joblib.load(spec_enc_path)
skills_mlb = joblib.load(skills_mlb_path)
job_enc = joblib.load(job_enc_path)

EXPECTED_FEATURES = list(model.feature_names_in_)

SKILL_ALIASES = {
    "ml": "Machine Learning",
    "ai": "Artificial Intelligence",
    "py": "Python",
    "js": "JavaScript",
    "db": "SQL",
    "node": "Node.js",
    "cyber": "Cyber Security"
}

def normalize_skills(skills):
    return [SKILL_ALIASES.get(s.lower().strip(), s) for s in skills]

def safe_label_encode(encoder, value):
    if value in encoder.classes_:
        return encoder.transform([value])[0]
    return 0  


def predict_job_role(degree, specialization, cgpa, internship, projects, skills):

    deg_val = safe_label_encode(degree_enc, degree)
    spec_val = safe_label_encode(spec_enc, specialization)
    internship_val = 1 if internship.lower() == "yes" else 0

    skills = normalize_skills(skills)
    skill_vector = skills_mlb.transform([skills])
    skill_df = pd.DataFrame(skill_vector, columns=skills_mlb.classes_)

 
    base_features = pd.DataFrame({
        "degree": [deg_val],
        "specialization": [spec_val],
        "cgpa": [cgpa],
        "internship": [internship_val],
        "projects": [projects]
    })

    X_input = pd.concat([base_features, skill_df], axis=1)

    X_input = X_input.reindex(columns=EXPECTED_FEATURES, fill_value=0)

    probs = model.predict_proba(X_input)[0]
    top_idx = np.argsort(probs)[::-1][:3]

    top_matches = [
        {
            "role": job_enc.inverse_transform([i])[0],
            "confidence": round(float(probs[i]) * 100, 2)
        }
        for i in top_idx
    ]

    return {
        "predicted_job_role": top_matches[0]["role"],
        "match_percentage": top_matches[0]["confidence"],
        "top_3_matches": top_matches,
        "status": "success"
    }

if __name__ == "__main__":
    try:
        data = json.loads(sys.argv[1])

        skills = data.get("skills", [])
        if isinstance(skills, str):
            skills = [s.strip() for s in skills.split(",") if s.strip()]

        result = predict_job_role(
            degree=data.get("degree", ""),
            specialization=data.get("specialization", ""),
            cgpa=float(data.get("cgpa", 0)),
            internship=data.get("internship", "No"),
            projects=int(data.get("projects", 0)),
            skills=skills
        )

        print(json.dumps(result))
        sys.stdout.flush()
        os._exit(0)  

    except Exception as e:
        print(json.dumps({
            "predicted_job_role": "Unknown",
            "match_percentage": 0,
            "top_3_matches": [],
            "status": "error",
            "error": str(e)
        }))
        sys.stdout.flush()
        os._exit(1)