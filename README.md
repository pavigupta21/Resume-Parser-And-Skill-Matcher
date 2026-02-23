# Resume Parser and Skill Matcher (SkillFit)

A serverless AI-powered resume analysis system built using AWS cloud services.
The platform enables recruiters to upload job descriptions and candidate resumes, automatically extract skills, compute match scores, and generate structured PDF evaluation reports — all using a scalable, event-driven architecture.

---

## 🔗 Live Deployment

The application is hosted using Amazon S3 static website hosting and can be accessed at:

👉 **http://skillfit-host-bucket.s3-website.ap-south-1.amazonaws.com/**

---

## 📸 Application Screenshots

<img width="2880" height="1714" alt="Screenshot (1545)" src="https://github.com/user-attachments/assets/788c7578-0fb2-44c4-bad1-c4e40928502b" />
<img width="2880" height="1714" alt="Screenshot (1546)" src="https://github.com/user-attachments/assets/64326feb-01ac-4a08-a06c-76b21c877874" />



---

## 📌 Project Overview

SkillFit is a fully serverless Resume Parser and Skill Matching system designed to automate candidate evaluation.

Recruiters can:

* Sign up and authenticate securely
* Create and store job descriptions
* Upload multiple resumes
* Automatically extract resume text
* Analyze skill matches
* View ranked candidate results
* Generate professional PDF evaluation reports

The system leverages OCR, NLP, deterministic skill normalization, and directional similarity scoring to provide explainable and structured hiring insights.

---

## 🏗️ Architecture Overview

The system is built using managed AWS services in a fully serverless architecture:

* **Amazon S3** – Resume storage and frontend hosting
* **Amazon Cognito** – Secure authentication
* **Amazon API Gateway** – REST API endpoints
* **AWS Lambda** – Backend processing
* **Amazon DynamoDB** – Structured NoSQL storage
* **Amazon SQS** – Asynchronous resume processing
* **Amazon Textract** – Resume text extraction (OCR)
* **Amazon Comprehend** – Key phrase detection (NLP)
* **AWS IAM** – Access and permission management
* **Amazon CloudWatch** – Logging and monitoring

---

## ⚙️ System Workflow

### 🔐 1. Authentication

Recruiter logs in using Amazon Cognito.

### 📝 2. Job Creation

* Recruiter submits job description.
* Job Creation Lambda:

  * Invokes **Amazon Comprehend** to extract key phrases.
  * Generates unique `job_id`.
  * Stores job data in **JobTable** (DynamoDB).

### 📄 3. Resume Upload

* Resume uploaded to S3 (`private/` folder).
* S3 triggers `ResumeS3ToSQS` Lambda.
* Message sent to Amazon SQS.
* SQS triggers Resume Processing Lambda.

### 🧠 4. Resume Processing

* Lambda invokes **Amazon Textract** to extract resume text.
* Invokes **Amazon Comprehend** to extract resume key phrases.
* Stores extracted text in **ResumeTable**.

### 📊 5. Skill Matching

* Recruiter clicks “Analyze”.
* Analyze Lambda:

  * Reads JobTable and ResumeTable.
  * Extracts canonical skills.
  * Computes match score:

Match Score = (Matched Skills ÷ Required Skills) × 100

* Candidates are ranked by score.

### 📑 6. Report Generation

* Recruiter clicks “Generate Report”.
* PDF report generated using ReportLab.
* Report uploaded to S3 (`reports/` folder).
* Pre-signed download URL returned.

---

## 🧠 Matching Algorithm

SkillFit combines multiple layers:

### 1️⃣ OCR Layer

Amazon Textract extracts raw resume text from PDF files.

### 2️⃣ NLP Layer

Amazon Comprehend detects key phrases from job descriptions and resumes.

### 3️⃣ Canonical Skill Normalization

A predefined dictionary maps variations to canonical skills.

Example:

* "js", "ecmascript" → javascript
* "ml" → machine learning

### 4️⃣ Directional Jaccard Variant

Let:

* R = Required Skills
* C = Resume Skills

Score = (|R ∩ C| ÷ |R|) × 100

This ensures scoring emphasizes job requirements rather than total resume content.

---

## 📊 Features

* Fully serverless architecture
* Event-driven resume processing
* OCR-based resume parsing
* NLP-powered phrase extraction
* Deterministic skill matching
* Ranked candidate evaluation
* Automated structured PDF reports
* Secure recruiter authentication
* Scalable and cost-efficient deployment

---

## 🗂️ Data Model

### 🔹 JobTable

* job_id (Partition Key)
* job_description
* key_phrases

### 🔹 ResumeTable

* resume_id (Partition Key)
* job_id (GSI: job_id-index)
* extracted_text
* matched_skills
* match_score
* recruiter_id
* s3_key

---

## 💻 Technology Stack

Frontend:

* HTML
* CSS
* JavaScript
* AWS SDK for JavaScript

Backend:

* AWS Lambda (Python)
* Amazon Textract
* Amazon Comprehend
* Amazon DynamoDB
* Amazon SQS
* Amazon API Gateway
* Amazon Cognito
* Amazon S3

---

## 🚀 Deployment

Frontend:

* Hosted using Amazon S3 static website hosting

Backend:

* API Gateway + Lambda integration
* S3 event triggers
* SQS event-driven processing

No dedicated servers required.

---

## 🔐 Security

* Cognito-based authentication
* Identity Pool with temporary AWS credentials
* Least privilege IAM roles
* Secure S3 object access
* Pre-signed URLs for report downloads

---

## 📈 Scalability

* Asynchronous resume processing using SQS
* Event-driven Lambda execution
* DynamoDB auto-scaling support
* Fully managed AWS services

---

## 📄 License

This project was developed for educational, internship, and portfolio demonstration purposes.

---

