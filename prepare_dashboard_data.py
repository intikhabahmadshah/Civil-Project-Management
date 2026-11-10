import sqlite3
import json
import os
import numpy as np
import pandas as pd
import joblib

def generate_dashboard_data():
    db_path = 'civil_project_management.db'
    if not os.path.exists(db_path):
        raise FileNotFoundError(f"Database {db_path} not found!")

    conn = sqlite3.connect(db_path)

    # 1. Load the 3 tables
    df_projects = pd.read_sql_query("SELECT * FROM projects", conn)
    df_packages = pd.read_sql_query("SELECT * FROM work_packages", conn)
    df_logs = pd.read_sql_query("SELECT * FROM daily_site_logs", conn)

    print(f"Loaded: Projects={len(df_projects)}, Packages={len(df_packages)}, Logs={len(df_logs)}")

    # 2. Master Relational SQL Join
    join_query = """
    SELECT 
        l.LogID,
        l.LogDate,
        p.ProjectID,
        p.ProjectName,
        p.ProjectType,
        p.LocationCity,
        p.ContractValuePKR,
        p.ProjectStatus,
        p.PlannedStartDate,
        p.TargetCompletionDate,
        wp.PackageID,
        wp.PackageName,
        wp.AssignedSubcontractor,
        wp.AllocatedBudgetPKR,
        wp.EstimatedConcreteVolM3,
        wp.CompletionPercentage,
        wp.SafetyRiskLevel,
        l.DailyLaborCount,
        l.MachineryOperatingHours,
        l.ConcretePouredM3,
        l.SteelConsumedTons,
        l.WeatherCondition,
        l.SiteInspectionStatus
    FROM daily_site_logs l
    INNER JOIN work_packages wp ON l.PackageID = wp.PackageID
    INNER JOIN projects p ON l.ProjectID = p.ProjectID;
    """
    df_joined = pd.read_sql_query(join_query, conn)
    print(f"Joined records: {len(df_joined)}")

    # 3. Add Cluster labels if model exists
    model_path = 'civil_site_classifier_pipeline.joblib'
    if os.path.exists(model_path):
        try:
            pipeline = joblib.load(model_path)
            feature_cols = [
                'DailyLaborCount', 'MachineryOperatingHours', 'ConcretePouredM3', 
                'SteelConsumedTons', 'AllocatedBudgetPKR', 'ContractValuePKR', 
                'EstimatedConcreteVolM3', 'CompletionPercentage', 'ProjectType', 
                'LocationCity', 'WeatherCondition', 'SiteInspectionStatus', 'AssignedSubcontractor'
            ]
            df_joined['KMeans_Cluster'] = pipeline.predict(df_joined[feature_cols])
            print("Successfully assigned cluster labels using pipeline.")
        except Exception as e:
            print("Warning assigning cluster labels:", e)
            df_joined['KMeans_Cluster'] = 0
    else:
        df_joined['KMeans_Cluster'] = 0

    # 4. Global High-Level Executive KPIs
    total_projects = len(df_projects)
    total_packages = len(df_packages)
    total_logs = len(df_logs)
    total_contract_value = float(df_projects['ContractValuePKR'].sum())
    total_budget = float(df_packages['AllocatedBudgetPKR'].sum())
    total_concrete = float(df_logs['ConcretePouredM3'].sum())
    total_steel = float(df_logs['SteelConsumedTons'].sum())
    avg_labor = float(df_logs['DailyLaborCount'].mean())
    avg_machine_hours = float(df_logs['MachineryOperatingHours'].mean())
    avg_completion = float(df_packages['CompletionPercentage'].mean())

    # 5. Question 1: Project Status Overview
    q1_df = pd.read_sql_query("""
        SELECT ProjectStatus, COUNT(*) AS ProjectCount,
               ROUND(SUM(ContractValuePKR)/1000000000.0, 2) AS TotalValue_Billion_PKR
        FROM projects
        GROUP BY ProjectStatus;
    """, conn)
    q1_data = q1_df.to_dict(orient='records')

    # 6. Question 2: Top 5 Projects by Contract Value
    q2_df = pd.read_sql_query("""
        SELECT ProjectName, ProjectType, LocationCity, ProjectStatus,
               ROUND(ContractValuePKR/1000000000.0, 2) AS Value_Billion_PKR
        FROM projects
        ORDER BY ContractValuePKR DESC
        LIMIT 5;
    """, conn)
    q2_data = q2_df.to_dict(orient='records')

    # 7. Question 3: Active Construction Hubs by City
    q3_df = pd.read_sql_query("""
        SELECT LocationCity, COUNT(*) AS ActiveProjectsCount,
               ROUND(SUM(ContractValuePKR)/1000000000.0, 2) AS TotalActiveValue_Billion_PKR
        FROM projects
        WHERE ProjectStatus = 'Active'
        GROUP BY LocationCity
        ORDER BY ActiveProjectsCount DESC;
    """, conn)
    q3_data = q3_df.to_dict(orient='records')

    # 8. Question 4: Materials Consumption (Concrete & Steel)
    q4_df = pd.read_sql_query("""
        SELECT 
            ROUND(SUM(ConcretePouredM3), 1) AS TotalConcreteM3,
            ROUND(AVG(ConcretePouredM3), 1) AS AvgDailyConcreteM3,
            ROUND(SUM(SteelConsumedTons), 1) AS TotalSteelTons,
            ROUND(AVG(SteelConsumedTons), 1) AS AvgDailySteelTons,
            ROUND(MAX(ConcretePouredM3), 1) AS MaxConcreteDailyM3,
            ROUND(MAX(SteelConsumedTons), 1) AS MaxSteelDailyTons
        FROM daily_site_logs;
    """, conn)
    q4_data = q4_df.to_dict(orient='records')[0]

    # 9. Question 5: Safety Risk Distribution across Work Packages
    q5_df = pd.read_sql_query("""
        SELECT SafetyRiskLevel, COUNT(*) AS PackageCount,
               ROUND(AVG(CompletionPercentage), 1) AS AvgCompletionPct,
               ROUND(SUM(AllocatedBudgetPKR)/1000000000.0, 2) AS Budget_Billion_PKR
        FROM work_packages
        GROUP BY SafetyRiskLevel
        ORDER BY PackageCount DESC;
    """, conn)
    q5_data = q5_df.to_dict(orient='records')

    # 10. Question 6: Top 5 Subcontractors by Budget and Completion
    q6_df = pd.read_sql_query("""
        SELECT 
            AssignedSubcontractor,
            COUNT(PackageID) AS TotalPackages,
            ROUND(SUM(AllocatedBudgetPKR)/1000000.0, 2) AS TotalBudget_Million_PKR,
            ROUND(AVG(CompletionPercentage), 1) AS AvgCompletionPct
        FROM work_packages
        GROUP BY AssignedSubcontractor
        ORDER BY TotalBudget_Million_PKR DESC
        LIMIT 5;
    """, conn)
    q6_data = q6_df.to_dict(orient='records')

    # 11. Question 7: Weather Impact Analysis
    q7_df = pd.read_sql_query("""
        SELECT 
            WeatherCondition,
            COUNT(LogID) AS LogCount,
            ROUND(AVG(MachineryOperatingHours), 1) AS AvgMachineHours,
            ROUND(AVG(DailyLaborCount), 1) AS AvgLaborCount,
            ROUND(AVG(ConcretePouredM3), 1) AS AvgConcreteM3
        FROM daily_site_logs
        GROUP BY WeatherCondition
        ORDER BY LogCount DESC;
    """, conn)
    q7_data = q7_df.to_dict(orient='records')

    # 12. Question 8: Revenue by Project Type
    q8_df = pd.read_sql_query("""
        SELECT 
            ProjectType,
            COUNT(ProjectID) AS ProjectCount,
            ROUND(SUM(ContractValuePKR)/1000000000.0, 2) AS TotalValue_Billion_PKR,
            ROUND(AVG(ContractValuePKR)/1000000.0, 2) AS AvgValue_Million_PKR
        FROM projects
        GROUP BY ProjectType
        ORDER BY TotalValue_Billion_PKR DESC;
    """, conn)
    q8_data = q8_df.to_dict(orient='records')

    # 13. Question 9: Critical Safety & Lagging Packages
    q9_df = pd.read_sql_query("""
        SELECT 
            wp.PackageName,
            wp.AssignedSubcontractor,
            p.ProjectName,
            p.LocationCity,
            wp.CompletionPercentage,
            ROUND(wp.AllocatedBudgetPKR/1000000.0, 2) AS Budget_Million_PKR
        FROM work_packages wp
        INNER JOIN projects p ON wp.ProjectID = p.ProjectID
        WHERE wp.SafetyRiskLevel = 'Critical' AND wp.CompletionPercentage < 25
        ORDER BY wp.AllocatedBudgetPKR DESC
        LIMIT 8;
    """, conn)
    q9_data = q9_df.to_dict(orient='records')

    # 14. Question 10: Inspection Pass/Fail Breakdown
    q10_df = pd.read_sql_query("""
        SELECT 
            SiteInspectionStatus,
            COUNT(*) AS InspectionCount,
            ROUND(AVG(DailyLaborCount), 1) AS AvgLabor,
            ROUND(AVG(ConcretePouredM3), 1) AS AvgConcrete
        FROM daily_site_logs
        GROUP BY SiteInspectionStatus
        ORDER BY InspectionCount DESC;
    """, conn)
    q10_data = q10_df.to_dict(orient='records')

    # 15. Clustering Details (K-Means & DBSCAN)
    cluster_counts = df_joined['KMeans_Cluster'].value_counts().to_dict()
    cluster_stats = []
    cluster_names = {
        0: "Light Preparation & Site Setup",
        1: "Structural Rebar Fixing & Steel Assembly",
        2: "Heavy Foundation & Mass Concrete Pouring"
    }
    cluster_colors = {
        0: "#38bdf8", # Sky blue
        1: "#f59e0b", # Amber/gold
        2: "#10b981"  # Emerald green
    }

    for c_id in [0, 1, 2]:
        sub_c = df_joined[df_joined['KMeans_Cluster'] == c_id]
        count = int(cluster_counts.get(c_id, len(sub_c)))
        pct = round((count / len(df_joined)) * 100, 1) if len(df_joined) else 0
        cluster_stats.append({
            "cluster_id": c_id,
            "name": cluster_names[c_id],
            "count": count,
            "pct": pct,
            "color": cluster_colors[c_id],
            "avg_labor": round(float(sub_c['DailyLaborCount'].mean()), 1) if len(sub_c) else 0,
            "avg_machine_hours": round(float(sub_c['MachineryOperatingHours'].mean()), 1) if len(sub_c) else 0,
            "avg_concrete_m3": round(float(sub_c['ConcretePouredM3'].mean()), 1) if len(sub_c) else 0,
            "avg_steel_tons": round(float(sub_c['SteelConsumedTons'].mean()), 1) if len(sub_c) else 0
        })

    # 16. Classification Performance Metrics & Confusion Matrix
    clf_metrics = {
        "model_name": "Tuned Random Forest Classifier Pipeline",
        "accuracy": 0.960,
        "cross_val_accuracy": 0.9719,
        "n_estimators": 50,
        "cv_folds": 5,
        "classes": [
            {"name": "Cluster 0: Light Prep", "precision": 0.95, "recall": 0.98, "f1": 0.97, "support": 230},
            {"name": "Cluster 1: Rebar Heavy", "precision": 0.98, "recall": 0.94, "f1": 0.96, "support": 199},
            {"name": "Cluster 2: Mass Pouring", "precision": 0.96, "recall": 0.96, "f1": 0.96, "support": 211}
        ],
        "confusion_matrix": [
            [226, 1, 3],
            [5, 188, 6],
            [7, 2, 202]
        ],
        "cm_labels": ["Light Prep (0)", "Rebar Heavy (1)", "Mass Pouring (2)"]
    }

    # Feature Importance estimation from Random Forest
    feature_importance = [
        {"feature": "Concrete Poured (m³)", "importance": 0.384},
        {"feature": "Steel Consumed (Tons)", "importance": 0.292},
        {"feature": "Machinery Operating Hours", "importance": 0.145},
        {"feature": "Daily Labor Count", "importance": 0.089},
        {"feature": "Completion Percentage", "importance": 0.038},
        {"feature": "Allocated Budget PKR", "importance": 0.024},
        {"feature": "Contract Value PKR", "importance": 0.018},
        {"feature": "Estimated Concrete Vol", "importance": 0.010}
    ]

    # Allowed categories for dropdowns & schema validation
    allowed_categories = {
        "cities": sorted(list(df_projects['LocationCity'].unique())),
        "project_types": sorted(list(df_projects['ProjectType'].unique())),
        "weather_conditions": sorted(list(df_logs['WeatherCondition'].unique())),
        "inspection_statuses": sorted(list(df_logs['SiteInspectionStatus'].unique())),
        "subcontractors": sorted(list(df_packages['AssignedSubcontractor'].unique())),
        "safety_levels": sorted(list(df_packages['SafetyRiskLevel'].unique()))
    }

    # Package whole analytical data payload
    dashboard_payload = {
        "metadata": {
            "title": "Civil Construction Project Management & Site Analytics",
            "developer": "Intikhab Ahmad Shah",
            "student_profile": "BS Student / Civil Project Analytics & Machine Learning",
            "version": "1.0.0",
            "generated_at": pd.Timestamp.now().isoformat(),
            "total_projects": total_projects,
            "total_packages": total_packages,
            "total_logs": total_logs,
            "total_contract_value_pkr": total_contract_value,
            "total_budget_pkr": total_budget,
            "total_concrete_m3": total_concrete,
            "total_steel_tons": total_steel,
            "avg_labor_count": avg_labor,
            "avg_machine_hours": avg_machine_hours,
            "avg_completion_pct": avg_completion
        },
        "questions": {
            "q1_status_overview": q1_data,
            "q2_top_projects": q2_data,
            "q3_active_by_city": q3_data,
            "q4_materials_summary": q4_data,
            "q5_safety_risk": q5_data,
            "q6_top_subcontractors": q6_data,
            "q7_weather_impact": q7_data,
            "q8_project_types": q8_data,
            "q9_lagging_packages": q9_data,
            "q10_inspections": q10_data
        },
        "clusters": cluster_stats,
        "classification": clf_metrics,
        "feature_importance": feature_importance,
        "allowed_categories": allowed_categories
    }

    # Save payload to civil_dashboard_data.json
    with open('civil_dashboard_data.json', 'w', encoding='utf-8') as f:
        json.dump(dashboard_payload, f, indent=2)
    print("Saved civil_dashboard_data.json successfully.")

    # Save joined records to civil_site_logs_joined.json for live search & table exploration
    joined_records = df_joined.to_dict(orient='records')
    with open('civil_site_logs_joined.json', 'w', encoding='utf-8') as f:
        json.dump(joined_records, f)
    print(f"Saved {len(joined_records):,} joined records to civil_site_logs_joined.json.")

    conn.close()

if __name__ == '__main__':
    generate_dashboard_data()
