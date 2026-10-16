# PROJECT OVERVIEW — DRISHTI (SIH26038)

## 1. Executive Summary
**Project Name:** Drishti  
**SIH Problem Statement ID:** SIH26038 / PS26038  
**Project Title:** Explainable AI for Diabetic Retinopathy Screening in Rural India  
**Target Domain:** Rural and Semi-Urban Healthcare Delivery, Tele-ophthalmology, National Screening Triage  

Drishti is an AI-assisted diabetic retinopathy (DR) screening, triage, and referral platform engineered for rural and resource-constrained environments in India. It empowers primary healthcare workers (ASHA/ANM), local clinics, and patients to capture or upload retinal fundus images, evaluate optical quality instantaneously, obtain AI-based DR grading with Grad-CAM++ explainability maps and lesion overlays, and seamlessly escalate referable cases to certified ophthalmologists and administrative healthcare networks.

> **Clinical Mandate:** Drishti is a clinical decision-support and screening triage system. It does **not** replace ophthalmologist diagnosis or surgical care.

---

## 2. Core Problem Statement & Rural Context
In rural India, diabetes prevalence is rapidly rising, yet access to vitreoretinal specialists and specialized fundus cameras is extremely limited. Diabetic Retinopathy is asymptomatic in early stages but can progress irreversibly to blindness if undetected. 
Key field challenges Drishti addresses:
1. **Scarcity of Specialists:** High patient-to-ophthalmologist ratio in rural districts.
2. **Poor Image Quality in Field Settings:** Low-cost portable fundus lenses often capture blurry, low-contrast, or non-retinal images, leading to inaccurate diagnostic inferences if not filtered pre-screening.
3. **AI Black Box Problem:** Clinicians and health workers cannot trust raw AI scores without verifiable visual evidence (lesion location, hemorrhage detection, Grad-CAM heatmaps).
4. **Referral Breakdown:** Patients flagged as "at risk" rarely receive scheduled specialist consultations without a structured tracking and referral loop.

---

## 3. Target User Roles
The platform strictly serves four distinct user personas:

| Role | Persona | Key Responsibilities & Workflows |
|---|---|---|
| **Patient** | Rural citizen / diabetic patient | Self-screening or assisted screening review, local language view of severity and care recommendations, track historical screening progression, access appointment referrals. |
| **Healthcare Worker (ASHA / ANM / PHC Staff)** | Frontline rural health agent | Register field patients, perform assisted fundus image capture, receive instantaneous optical quality guidance, trigger AI evaluation, counsel patient on referable cases. |
| **Doctor (Ophthalmologist / Specialist)** | District hospital / tele-consultant eye specialist | Review AI-flagged cases in priority queue, inspect dual-pane original fundus + Grad-CAM/lesion overlay, enter clinical diagnosis, issue formal referral or follow-up orders. |
| **Admin (Health Authority / CMO / District Admin)** | Government healthcare official / System administrator | Approve/reject healthcare worker and doctor professional credentials, monitor district DR prevalence trends, track screening volume and referral completion rates. |

---

## 4. Core System Features
1. **Fundus Image Submission & Ingestion:** Support portable fundus camera captures and image uploads with strict format and resolution validation.
2. **Quality Assessment Pipeline:** Pre-inference check for resolution, blur, brightness, contrast, and fundus anatomical suitability (reject non-eye or poor-quality images).
3. **Multi-Model DR Grading:** 5-class severity classification (Grade 0: No DR, Grade 1: Mild, Grade 2: Moderate, Grade 3: Severe, Grade 4: Proliferative DR) with safety ensembling (e.g., Senanur safety net).
4. **Explainable AI (XAI) & Lesion Detection:** Grad-CAM++ activation heatmaps + UNet/SEResNeXt lesion segmentation overlays (hemorrhages, exudates, cotton wool spots, microaneurysms).
5. **Role-Aware Dashboards:** Customized user experience matching rural field worker vs. clinical specialist vs. district health director.
6. **Referral Triage & Doctor Review Queue:** Automatic escalation of Grades 2-4 and urgent pathologies into clinical review pipelines.
7. **District & Epidemiological Analytics:** Aggregated non-PHI reporting on DR incidence, screening turnout, and referral resolution by district.

---

## 5. Explicit Project Exclusions
To maintain strict hackathon feasibility and clinical compliance, Drishti explicitly excludes:
- Autonomous prescription of prescription medicines or surgical interventions.
- Direct billing, insurance claims processing, or e-commerce features.
- Storing unencrypted patient health identifiers (PHI) or raw fundus binary blobs directly in MongoDB collections.
- Dark mode redesigns or extraneous social networking features.
