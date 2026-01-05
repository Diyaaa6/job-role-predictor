import random
import csv

degrees = [
    "B.Sc Computer Science", "B.Tech CS", "B.Tech IT",
    "BCA", "M.Sc CS", "M.Tech CS", "MCA", "MBA"
]

specializations = [
    "Web Development", "Software Engineering", "AI & ML", 
    "Cybersecurity", "Data Science", "Cloud Computing", 
    "Networking", "Mobile Development"
]

job_roles = [
    "Software Developer", "Full Stack Developer", "Frontend Developer", "Backend Developer",
    "Mobile Developer", "Data Scientist", "ML Engineer", "Cyber Security Analyst",
    "DevOps Engineer", "Database Administrator", "Business Analyst", "Data Analyst",
    "IT Support Specialist", "Cloud Engineer", "UI/UX Designer", "Network Administrator",
    "QA/Test Engineer", "System Administrator", "Product Manager", "Project Manager"
]

skills_map = {
    "Software Developer": ["Python", "Java", "C++", "DSA", "Git"],
    "Full Stack Developer": ["HTML", "CSS", "JavaScript", "React", "Node.js", "Git"],
    "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "UI/UX"],
    "Backend Developer": ["Node.js", "Python", "Java", "SQL", "REST API"],
    "Mobile Developer": ["Java", "Kotlin", "Swift", "React Native"],
    "Data Scientist": ["Python", "Pandas", "Machine Learning", "SQL", "Statistics"],
    "ML Engineer": ["Python", "Machine Learning", "TensorFlow", "Scikit-learn"],
    "Cyber Security Analyst": ["Networking", "Cyber Security", "Linux", "Firewalls"],
    "DevOps Engineer": ["Docker", "Kubernetes", "CI/CD", "AWS", "Linux"],
    "Database Administrator": ["SQL", "Oracle", "MySQL", "NoSQL"],
    "Business Analyst": ["Excel", "Power BI", "SQL", "Communication"],
    "Data Analyst": ["Python", "SQL", "Excel", "Power BI"],
    "IT Support Specialist": ["Troubleshooting", "Windows Server", "Question/Answer"],
    "Cloud Engineer": ["AWS", "Azure", "GCP", "Docker"],
    "UI/UX Designer": ["Figma", "Adobe XD", "UI", "UX"],
    "Network Administrator": ["Networking", "Security", "Linux"],
    "QA/Test Engineer": ["Selenium", "Testing", "Automation", "Git"],
    "System Administrator": ["Linux", "Windows Server", "Networking"],
    "Product Manager": ["Agile", "Leadership", "Communication", "Roadmaps"],
    "Project Manager": ["Agile", "Scrum", "Leadership", "Planning"]
}

def generate_skills(role):
    base = skills_map.get(role, ["Python"])
    extra = random.sample(list(set(sum(skills_map.values(), [])) - set(base)), 2)
    return base + extra

with open("synthetic_it_dataset.csv", "w", newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow([
        "degree", "specialization", "cgpa",
        "internship", "projects", "skills", "job_role"
    ])
    
    for _ in range(1000):
        role = random.choice(job_roles)
        degree = random.choice(degrees)
        spec = random.choice(specializations)
        cgpa = round(random.uniform(5.5, 10.0), 2)
        internship = random.choice(["Yes", "No"])
        projects = random.randint(0, 10)
        skills = ", ".join(generate_skills(role))
        
        writer.writerow([
            degree, spec, cgpa,
            internship, projects, skills, role
        ])
