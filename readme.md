# Edu2Job: AI-Powered Career Prediction System

Edu2Job is a data-driven decision-support system designed to bridge the gap between academic qualifications and professional career paths. By leveraging Machine Learning (ML) and Data Analytics, the platform analyzes a user's educational background to predict the most suitable job roles with high precision.

 Key Features

### User Capabilities
***Secure Authentication**: Supports JWT-based secure login and Google OAuth 2.0 integration.
***AI Job Prediction**: Predicts top 3–5 job roles based on Degree, Specialization, CGPA, and Certifications.
***Career Insights**: Provides probability-based ranking and confidence scores for each suggested role.
***Peer Analytics**: Visualizes common career transitions from specific degrees using Sankey diagrams.
***Feedback System**: Users can rate and flag/unflag predictions to help improve model quality.

### Admin Controls
***MLOps Dashboard**: Real-time analytics on user satisfaction, active users, and system uptime.
***Model Management**: Trigger AI model retraining directly from the panel and manage dataset uploads.
***Prediction Logs**: Audit trail of all user predictions and flagged entries for manual review.

---

## Technical Architecture

The system follows a modern full-stack architecture[cite: 2983]:
***Frontend**: HTML5, Tailwind CSS, and JavaScript (React-compatible) for a responsive UI.
***Backend**: Node.js/Express handling API requests, authentication, and Python script execution.
***Database**: MongoDB using a relational-linked schema for users and prediction history.
***AI Engine**: Trained Random Forest and XGBoost models for multi-class classification.

---

## Project Structure

job-role-predictor/
├── backend/            # Express APIs & Mongoose Models
├── frontend/           # UI Components & Admin Dashboard
├── scripts/            # Python ML Training & Prediction Scripts
├── uploads/datasets/   # Storage for CSV Training Data
└── README.md           # Project Documentation