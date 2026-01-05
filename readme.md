# Edu2Job: AI-Powered Career Prediction System

Edu2Job is a data-driven decision-support system designed to bridge the gap between academic qualifications and professional career paths. [cite_start]By leveraging Machine Learning (ML) and Data Analytics, the platform analyzes a user's educational background to predict the most suitable job roles with high precision[cite: 3537, 3541].

 Key Features

### User Capabilities
* [cite_start]**Secure Authentication**: Supports JWT-based secure login and Google OAuth 2.0 integration[cite: 3579, 3580].
* [cite_start]**AI Job Prediction**: Predicts top 3–5 job roles based on Degree, Specialization, CGPA, and Certifications[cite: 3557, 4958].
* [cite_start]**Career Insights**: Provides probability-based ranking and confidence scores for each suggested role[cite: 4983, 5018].
* **Peer Analytics**: Visualizes common career transitions from specific degrees using Sankey diagrams.
* [cite_start]**Feedback System**: Users can rate and flag/unflag predictions to help improve model quality[cite: 2890, 2915].

### Admin Controls
* [cite_start]**MLOps Dashboard**: Real-time analytics on user satisfaction, active users, and system uptime[cite: 2983].
* [cite_start]**Model Management**: Trigger AI model retraining directly from the panel and manage dataset uploads[cite: 2801, 2802].
* [cite_start]**Prediction Logs**: Audit trail of all user predictions and flagged entries for manual review[cite: 2880, 2900].

---

## Technical Architecture

[cite_start]The system follows a modern full-stack architecture[cite: 2983]:
* [cite_start]**Frontend**: HTML5, Tailwind CSS, and JavaScript (React-compatible) for a responsive UI[cite: 3049, 3060].
* **Backend**: Node.js/Express handling API requests, authentication, and Python script execution.
* **Database**: MongoDB using a relational-linked schema for users and prediction history.
* [cite_start]**AI Engine**: Trained Random Forest and XGBoost models for multi-class classification[cite: 4877, 4882].

---

## Project Structure

```text
job-role-predictor/
├── backend/            # Express APIs & Mongoose Models
├── frontend/           # UI Components & Admin Dashboard
├── scripts/            # Python ML Training & Prediction Scripts
├── uploads/datasets/   # Storage for CSV Training Data
└── README.md           # Project Documentation