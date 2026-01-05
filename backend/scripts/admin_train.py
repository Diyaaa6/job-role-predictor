import pandas as pd
import numpy as np
import os
import sys
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, MultiLabelBinarizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

def train_model(csv_path):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_dir = os.path.join(base_dir, 'model')

    if not os.path.exists(model_dir):
        os.makedirs(model_dir)

    try:
        if not os.path.exists(csv_path):
            print(f"Error: CSV file not found at {csv_path}")
            sys.exit(1)

        df = pd.read_csv(csv_path)
        print(f"Dataset loaded: {os.path.basename(csv_path)}")

        df.columns = df.columns.str.strip().str.lower()

        df['skills'] = df['skills'].apply(lambda x: [s.strip() for s in x.split(',')] if isinstance(x, str) else [])
        df['internship'] = df['internship'].map({"Yes": 1, "No": 0})

        deg_enc = LabelEncoder()
        spec_enc = LabelEncoder()
        job_enc = LabelEncoder()

        df['degree'] = deg_enc.fit_transform(df['degree'])
        df['specialization'] = spec_enc.fit_transform(df['specialization'])
        df['job_role'] = job_enc.fit_transform(df['job_role'])

        mlb = MultiLabelBinarizer()
        skill_matrix = mlb.fit_transform(df['skills'])
        skill_df = pd.DataFrame(skill_matrix, columns=mlb.classes_)

        df_final = pd.concat([df.drop(columns=['skills']), skill_df], axis=1)

        X = df_final.drop('job_role', axis=1)
        y = df_final['job_role']

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, stratify=y, random_state=42
        )

        model = RandomForestClassifier(
            n_estimators=140, max_depth=12, min_samples_split=8,
            min_samples_leaf=4, random_state=42, n_jobs=-1
        )
        model.fit(X_train, y_train)

        accuracy = accuracy_score(y_test, model.predict(X_test))
        print(f"Training Complete. Accuracy: {round(accuracy * 100, 2)}%")

        joblib.dump(model, os.path.join(model_dir, "random_forest_model.pkl"))
        joblib.dump(job_enc, os.path.join(model_dir, "jobrole_label_encoder.pkl"))
        joblib.dump(deg_enc, os.path.join(model_dir, "degree_encoder.pkl"))
        joblib.dump(spec_enc, os.path.join(model_dir, "specialization_encoder.pkl"))
        joblib.dump(mlb, os.path.join(model_dir, "skills_binarizer.pkl"))

        print(f"Model and encoders successfully saved to: {model_dir}")

    except Exception as e:
        print(f"An error occurred during training: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":

    if len(sys.argv) > 1:
        target_csv = sys.argv[1]
        train_model(target_csv)
    else:
        print("Usage: python random_forest_train.py <path_to_csv>")
        sys.exit(1)