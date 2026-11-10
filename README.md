# Civil Construction Project Management & Site Analytics Dashboard

**PSEB - Tech Destination - Bootcamp**  
**Trainee Name:** Intikhab Ahmad Shah  
**Trainee ID:** `TRN-2026-000059`  
**Trainer:** Respected Ma'am Mahnoor Salman  
**Venue:** Iqra University - IU, Islamabad  

---

## 📌 Project Overview

This project provides an interactive Executive Light-Themed Dashboard for **Civil Construction Project Management & Daily Site Operations**.

The system combines **3 relational tables** in SQLite with:
- **2,500 Construction Projects**
- **2,800 Work Packages**
- **3,200 Daily Site Logs** across 9 major Pakistani cities

It answers **10 Key Business Questions** with interactive charts, groups daily site logs into 3 natural operational phases using **K-Means clustering**, and predicts site activity using a **96.0% accurate Random Forest classifier**.

---

## 🏗️ What the Dashboard Includes

1. **Executive Overview (6 Key Numbers):**
   - Total Projects: **2,500**
   - Total Contract Value: **PKR 3.42 Trillion**
   - Work Packages: **2,800** (PKR 111 Billion budget)
   - Daily Site Logs: **3,200**
   - Total Concrete Poured: **1.78 Million m³**
   - AI Classifier Accuracy: **96.0%**

2. **The 10 Business Questions Solved & Visualized:**
   - **Q1:** Project Status Overview (Active, Completed, On Hold)
   - **Q2:** Top 5 Projects by Contract Value (up to PKR 2.5 Billion each)
   - **Q3:** Active Construction Hubs by City (Karachi, Lahore, Islamabad, Multan, etc.)
   - **Q4:** Daily & Total Concrete Poured vs Steel Consumed
   - **Q5:** Work Packages by Safety Risk Level (Low, Medium, High, Critical)
   - **Q6:** Top 5 Subcontractors by Budget Allocation & Completion (Properly scaled to 25,000M PKR: FWO ~19,963M, Izhar ~18,964M)
   - **Q7:** Weather Impact on Machinery Operating Hours & Labor Count
   - **Q8:** Revenue Breakdown by Project Type
   - **Q9:** Critical Safety Risk Packages with Less than 25% Progress
   - **Q10:** Quality Inspection Pass / Fail Status

3. **Clustering & Machine Learning:**
   - **Cluster 0:** Light Preparation & Site Setup (low materials, site prep)
   - **Cluster 1:** Structural Rebar & Steel Fixing (high steel rebar fixing)
   - **Cluster 2:** Heavy Foundation & Mass Concrete Pouring (high concrete volume)
   - Confusion Matrix with **96.0% Accuracy** on holdout test set (640 samples).

4. **Real-Time Site Activity Simulator:**
   - Interactive sliders for Concrete ($m^3$), Steel (tons), Labor count, Machine hours, and Completion %.
   - Shift presets: *Mass Pouring Shift*, *Rebar Fixing Shift*, *Site Setup Shift*.
   - Live AI predictions with confidence score, probability breakdown, and practical civil engineering action steps.

5. **Master SQLite Database Explorer:**
   - Search across project names, package titles, subcontractors, and cities.
   - Filter by City, Project Type, Weather, Inspection, and Subcontractor.
   - 15 records per page with next/prev buttons.
   - **Export to CSV** button to download filtered logs.

---

## ⚡ How to Run

Double-click the batch file:
```cmd
Run_Dashboard.bat
```
Or run from terminal:
```bash
node server.js
```
Open **`http://localhost:3000`** in your browser.

---

## 👨‍💻 Student & Course Credentials

- **Name:** Intikhab Ahmad Shah
- **Trainee ID:** `TRN-2026-000059`
- **Program:** PSEB - Tech Destination - Bootcamp
- **Trainer:** Respected Ma'am Mahnoor Salman
- **Venue:** Iqra University - IU, Islamabad
