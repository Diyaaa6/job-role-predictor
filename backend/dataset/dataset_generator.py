import random
import pandas as pd

random.seed(42)

JOB_RULES = [
    (["python", "ml", "data"], "Data Scientist"),
    (["python", "ml"], "ML Engineer"),
    (["web", "python", "java"], "Full Stack Developer"),
    (["web", "python"], "Backend Developer"),
    (["uiux"], "UI/UX Designer"),
    (["cloud", "python"], "Cloud Engineer"),
    (["java", "python"], "Software Engineer"),
]

degrees = ["B.Tech", "BCA", "MCA"]
specializations = ["CS", "IT", "AI", "DS"]

def assign_job(skills):
    for rule, role in JOB_RULES:
        if all(skills[s] == 1 for s in rule):
            return role
    return "Software Engineer"

data = []

for _ in range(1500):   # <-- dataset size
    skills = {
        "python": random.randint(0, 1),
        "java": random.randint(0, 1),
        "ml": random.randint(0, 1),
        "data": random.randint(0, 1),
        "web": random.randint(0, 1),
        "uiux": random.randint(0, 1),
        "cloud": random.randint(0, 1),
    }

    row = {
        "degree": random.choice(degrees),
        "specialization": random.choice(specializations),
        "cgpa": round(random.uniform(6.0, 9.8), 2),
        "yearOfGraduation": random.randint(2024, 2028),
        "internship": random.choice([0, 1]),
        "projects": random.randint(0, 5),
        **skills
    }

    row["job_role"] = assign_job(skills)
    data.append(row)

df = pd.DataFrame(data)
df.to_csv("job_role_dataset.csv", index=False)

print("✅ Dataset generated: job_role_dataset.csv")
