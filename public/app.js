/* ==============================================================================
   CIVIL CONSTRUCTION PROJECT MANAGEMENT & SITE ANALYTICS - APP ENGINE
   Executive Light Theme Engine | Font: Poppins Everywhere
   ============================================================================== */

// Global State & Data Cache
let masterSiteLogs = [];
let filteredCohort = [];
let dashboardDataCache = null;

// Chart Instances
let chartQ1 = null;
let chartQ2 = null;
let chartQ3 = null;
let chartQ4 = null;
let chartQ5 = null;
let chartQ6 = null;
let chartQ7 = null;
let chartQ8 = null;
let chartQ10 = null;
let chartFeatures = null;

// Pagination State
let tableCurrentPage = 1;
const tablePageLimit = 15;

// Main Bootloader
function bootDashboardEngine() {
    console.log('🏗️ [Civil Construction Analytics] Booting Executive Light Dashboard...');
    try { initGSAPAnimations(); } catch (e) { console.error('GSAP Error:', e); }
    try { initTabs(); } catch (e) { console.error('Tabs Error:', e); }
    try { initSimulator(); } catch (e) { console.error('Simulator Error:', e); }

    // Load API Stats & Master Dataset
    loadDashboardStats().then(() => {
        loadMasterLogs().then(() => {
            try { initGlobalFilters(); } catch (e) { console.error('Filters Error:', e); }
            try { renderDatabaseTable(); } catch (e) { console.error('Table Error:', e); }
        });
    }).catch(err => {
        console.error('Initial data fetch failed:', err);
    });
}

// Ensure execution on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootDashboardEngine);
} else {
    bootDashboardEngine();
}

/* ==============================================================================
   1. GSAP MOTION & COUNTER ANIMATIONS
   ============================================================================== */
function initGSAPAnimations() {
    if (typeof gsap === 'undefined') return;

    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    // Hero entrance
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } });
    tl.from('.vip-navbar', { y: -25, opacity: 0, duration: 0.5 })
      .from('.trainee-strip', { opacity: 0, duration: 0.4 }, '-=0.2')
      .from('.hero-pill-badge', { scale: 0.9, opacity: 0, duration: 0.4 }, '-=0.2')
      .from('.hero-headline', { y: 20, opacity: 0, duration: 0.5 }, '-=0.2')
      .from('.hero-description', { y: 15, opacity: 0, duration: 0.4 }, '-=0.3')
      .from('.hero-cta-group', { y: 12, opacity: 0, duration: 0.4 }, '-=0.2')
      .from('.hero-status-card', { x: 25, opacity: 0, duration: 0.5 }, '-=0.3');

    // Stagger KPI Cards
    gsap.from('.kpi-card', {
        y: 25,
        opacity: 0,
        scale: 0.98,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power2.out',
        delay: 0.2
    });
}

function animateCounter(id, targetVal, prefix = '', suffix = '') {
    const el = document.getElementById(id);
    if (!el || typeof gsap === 'undefined') return;

    const obj = { val: 0 };
    gsap.to(obj, {
        val: targetVal,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: () => {
            if (targetVal >= 1000 && !suffix) {
                el.innerText = prefix + Math.floor(obj.val).toLocaleString() + suffix;
            } else if (Number.isInteger(targetVal)) {
                el.innerText = prefix + Math.floor(obj.val) + suffix;
            } else {
                el.innerText = prefix + obj.val.toFixed(1) + suffix;
            }
        }
    });
}

/* ==============================================================================
   2. DATA FETCHING & API INTEGRATION
   ============================================================================== */
async function loadDashboardStats() {
    try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error('API /api/stats responded with status ' + res.status);
        const data = await res.json();
        dashboardDataCache = data;
        console.log('✅ Dashboard stats loaded successfully:', data);

        populateKPIs(data.metadata);
        populateAllowedOptions(data.allowed_categories);
        initAllCharts(data.questions, data.classification, data.feature_importance);
        populateQ9Table(data.questions.q9_lagging_packages);

    } catch (err) {
        console.error('Error fetching /api/stats:', err);
    }
}

async function loadMasterLogs() {
    try {
        const res = await fetch('/api/logs?limit=all');
        if (!res.ok) throw new Error('API /api/logs responded with status ' + res.status);
        const resJson = await res.json();
        masterSiteLogs = resJson.data || [];
        filteredCohort = [...masterSiteLogs];
        console.log(`✅ Loaded ${masterSiteLogs.length} total site log records for local interactive cross-filtering.`);
        updateFilterCountBadge();
        renderDatabaseTable();
    } catch (err) {
        console.error('Error loading master logs:', err);
    }
}

/* ==============================================================================
   3. POPULATE METRICS & DROPDOWNS
   ============================================================================== */
function populateKPIs(meta) {
    if (!meta) return;
    animateCounter('kpi-projects', meta.total_projects || 2500);
    animateCounter('kpi-packages', meta.total_packages || 2800);
    animateCounter('kpi-logs', meta.total_logs || 3200);

    const elValue = document.getElementById('kpi-contract-value');
    if (elValue) elValue.innerText = 'PKR 3.42T';

    const elConcrete = document.getElementById('kpi-concrete');
    if (elConcrete) elConcrete.innerText = '1.78M m³';

    const elAcc = document.getElementById('kpi-accuracy');
    if (elAcc) elAcc.innerText = '96.0%';
}

function populateAllowedOptions(cats) {
    if (!cats) return;

    const citySelect = document.getElementById('filter-city');
    const typeSelect = document.getElementById('filter-type');
    const weatherSelect = document.getElementById('filter-weather');
    const inspSelect = document.getElementById('filter-inspection');
    const subSelect = document.getElementById('filter-subcontractor');

    if (citySelect && cats.cities) {
        cats.cities.forEach(c => {
            citySelect.innerHTML += `<option value="${c}">${c}</option>`;
        });
    }

    if (typeSelect && cats.project_types) {
        cats.project_types.forEach(t => {
            typeSelect.innerHTML += `<option value="${t}">${t}</option>`;
        });
    }

    if (weatherSelect && cats.weather_conditions) {
        cats.weather_conditions.forEach(w => {
            weatherSelect.innerHTML += `<option value="${w}">${w}</option>`;
        });
    }

    if (inspSelect && cats.inspection_statuses) {
        cats.inspection_statuses.forEach(i => {
            inspSelect.innerHTML += `<option value="${i}">${i}</option>`;
        });
    }

    if (subSelect && cats.subcontractors) {
        cats.subcontractors.forEach(s => {
            subSelect.innerHTML += `<option value="${s}">${s}</option>`;
        });
    }
}

function populateQ9Table(packages) {
    const tbody = document.getElementById('q9-table-body');
    if (!tbody || !packages) return;

    tbody.innerHTML = '';
    packages.forEach(pkg => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${pkg.PackageName}</strong></td>
                <td>${pkg.AssignedSubcontractor}</td>
                <td>${pkg.ProjectName}</td>
                <td><i class="fa-solid fa-location-dot text-brand-blue"></i> ${pkg.LocationCity}</td>
                <td><strong class="text-brand-crimson">${pkg.CompletionPercentage}%</strong></td>
                <td>PKR ${pkg.Budget_Million_PKR}M</td>
                <td><span class="badge-pill failed">Critical Risk</span></td>
            </tr>
        `;
    });
}

/* ==============================================================================
   4. CHART.JS VISUAL ANALYTICS INITIALIZATION (LIGHT MODE)
   ============================================================================== */
function initAllCharts(qData, clfData, featData) {
    if (typeof Chart === 'undefined') return;

    // Chart.js Global Theme for Executive Light Mode
    Chart.defaults.color = '#475569';
    Chart.defaults.font.family = "'Poppins', sans-serif";
    Chart.defaults.borderColor = 'rgba(226, 232, 240, 0.9)';

    // --- CHART Q1: Project Status (Doughnut) ---
    const ctxQ1 = document.getElementById('chart-q1');
    if (ctxQ1 && qData && qData.q1_status_overview) {
        const labels = qData.q1_status_overview.map(d => d.ProjectStatus);
        const counts = qData.q1_status_overview.map(d => d.ProjectCount);
        chartQ1 = new Chart(ctxQ1, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: ['#059669', '#0284C7', '#D97706'],
                    borderWidth: 2,
                    borderColor: '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15, color: '#0F172A' } }
                },
                cutout: '68%'
            }
        });
    }

    // --- CHART Q2: Top 5 Projects by Contract Value (Horizontal Bar) ---
    const ctxQ2 = document.getElementById('chart-q2');
    if (ctxQ2 && qData && qData.q2_top_projects) {
        const labels = qData.q2_top_projects.map(d => d.ProjectName.length > 22 ? d.ProjectName.substring(0, 22) + '...' : d.ProjectName);
        const vals = qData.q2_top_projects.map(d => d.Value_Billion_PKR);
        chartQ2 = new Chart(ctxQ2, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Contract Value (Billion PKR)',
                    data: vals,
                    backgroundColor: 'rgba(217, 119, 6, 0.85)',
                    borderColor: '#B45309',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(226, 232, 240, 0.9)' }, title: { display: true, text: 'Billion PKR', color: '#475569' } },
                    y: { grid: { display: false } }
                }
            }
        });
    }

    // --- CHART Q3: Active Hubs by City (Bar Chart) ---
    const ctxQ3 = document.getElementById('chart-q3');
    if (ctxQ3 && qData && qData.q3_active_by_city) {
        const labels = qData.q3_active_by_city.map(d => d.LocationCity);
        const counts = qData.q3_active_by_city.map(d => d.ActiveProjectsCount);
        chartQ3 = new Chart(ctxQ3, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Active Projects',
                    data: counts,
                    backgroundColor: 'rgba(2, 132, 199, 0.85)',
                    borderColor: '#0284C7',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: 'rgba(226, 232, 240, 0.9)' }, title: { display: true, text: 'Count', color: '#475569' } }
                }
            }
        });
    }

    // --- CHART Q8: Revenue by Project Type (Bar) ---
    const ctxQ8 = document.getElementById('chart-q8');
    if (ctxQ8 && qData && qData.q8_project_types) {
        const labels = qData.q8_project_types.map(d => d.ProjectType.replace('Concrete', '').replace('Infrastructure', ''));
        const revs = qData.q8_project_types.map(d => d.TotalValue_Billion_PKR);
        chartQ8 = new Chart(ctxQ8, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Total Value (Billion PKR)',
                    data: revs,
                    backgroundColor: 'rgba(124, 58, 237, 0.8)',
                    borderColor: '#7C3AED',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { autoSkip: false, maxRotation: 25 }, grid: { display: false } },
                    y: { grid: { color: 'rgba(226, 232, 240, 0.9)' }, title: { display: true, text: 'Billion PKR', color: '#475569' } }
                }
            }
        });
    }

    // --- CHART Q6: Top 5 Subcontractors (DUAL AXIS CHART WITH PROPER SCALE 0 TO 25,000M) ---
    const ctxQ6 = document.getElementById('chart-q6');
    if (ctxQ6 && qData && qData.q6_top_subcontractors) {
        const subs = qData.q6_top_subcontractors.map(d => d.AssignedSubcontractor.replace('Construction', 'Const.').replace('Infrastructure', 'Infra.'));
        const budgets = qData.q6_top_subcontractors.map(d => d.TotalBudget_Million_PKR);
        const comp = qData.q6_top_subcontractors.map(d => d.AvgCompletionPct);

        chartQ6 = new Chart(ctxQ6, {
            type: 'bar',
            data: {
                labels: subs,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Total Budget (Million PKR)',
                        data: budgets,
                        backgroundColor: 'rgba(2, 132, 199, 0.85)',
                        borderColor: '#0284C7',
                        borderWidth: 1.5,
                        borderRadius: 6,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'Average Completion (%)',
                        data: comp,
                        borderColor: '#E11D48',
                        backgroundColor: '#E11D48',
                        borderWidth: 3,
                        pointRadius: 6,
                        pointBackgroundColor: '#FFFFFF',
                        pointBorderColor: '#E11D48',
                        pointBorderWidth: 2.5,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'top', labels: { boxWidth: 14, padding: 15, color: '#0F172A' } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.type === 'bar') {
                                    return ` Budget: ${context.parsed.y.toLocaleString()} Million PKR`;
                                } else {
                                    return ` Avg Completion: ${context.parsed.y.toFixed(1)}%`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        max: 25000, // PROPER SCALING: Comfortably accommodates 19,963M without touching top
                        title: { display: true, text: 'Total Budget (Million PKR)', color: '#0284C7', font: { weight: 'bold' } },
                        grid: { color: 'rgba(226, 232, 240, 0.9)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        max: 100, // Completion % from 0 to 100%
                        title: { display: true, text: 'Average Completion (%)', color: '#E11D48', font: { weight: 'bold' } },
                        grid: { drawOnChartArea: false }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // --- CHART Q4: Materials Summary (Concrete & Steel) ---
    const ctxQ4 = document.getElementById('chart-q4');
    if (ctxQ4 && qData && qData.q4_materials_summary) {
        chartQ4 = new Chart(ctxQ4, {
            type: 'bar',
            data: {
                labels: ['Daily Avg Concrete (m³)', 'Max Daily Concrete (m³)', 'Daily Avg Steel (Tons)', 'Max Daily Steel (Tons)'],
                datasets: [{
                    label: 'Material Output',
                    data: [
                        qData.q4_materials_summary.AvgDailyConcreteM3,
                        qData.q4_materials_summary.MaxConcreteDailyM3,
                        qData.q4_materials_summary.AvgDailySteelTons * 10,
                        qData.q4_materials_summary.MaxSteelDailyTons * 10
                    ],
                    backgroundColor: ['#059669', '#10B981', '#D97706', '#F59E0B'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                if (ctx.dataIndex >= 2) {
                                    return ` Value: ${(ctx.parsed.y / 10).toFixed(1)} Tons`;
                                }
                                return ` Value: ${ctx.parsed.y.toLocaleString()} m³`;
                            }
                        }
                    }
                },
                scales: {
                    x: { ticks: { autoSkip: false, maxRotation: 20 }, grid: { display: false } },
                    y: { grid: { color: 'rgba(226, 232, 240, 0.9)' } }
                }
            }
        });
    }

    // --- CHART Q7: Weather Impact (Multi-bar) ---
    const ctxQ7 = document.getElementById('chart-q7');
    if (ctxQ7 && qData && qData.q7_weather_impact) {
        const labels = qData.q7_weather_impact.map(d => d.WeatherCondition);
        const machineHours = qData.q7_weather_impact.map(d => d.AvgMachineHours);
        const laborCounts = qData.q7_weather_impact.map(d => d.AvgLaborCount / 10);
        chartQ7 = new Chart(ctxQ7, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Avg Machine Operating Hrs',
                        data: machineHours,
                        backgroundColor: 'rgba(2, 132, 199, 0.85)',
                        borderRadius: 5
                    },
                    {
                        label: 'Avg Daily Labor (x10 Workers)',
                        data: laborCounts,
                        backgroundColor: 'rgba(217, 119, 6, 0.85)',
                        borderRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { color: '#0F172A' } } },
                scales: {
                    x: { ticks: { autoSkip: false, maxRotation: 20 }, grid: { display: false } },
                    y: { grid: { color: 'rgba(226, 232, 240, 0.9)' } }
                }
            }
        });
    }

    // --- CHART Q5: Safety Risk Levels (Polar Area) ---
    const ctxQ5 = document.getElementById('chart-q5');
    if (ctxQ5 && qData && qData.q5_safety_risk) {
        const labels = qData.q5_safety_risk.map(d => d.SafetyRiskLevel);
        const counts = qData.q5_safety_risk.map(d => d.PackageCount);
        chartQ5 = new Chart(ctxQ5, {
            type: 'polarArea',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        'rgba(5, 150, 105, 0.75)',
                        'rgba(2, 132, 199, 0.75)',
                        'rgba(217, 119, 6, 0.75)',
                        'rgba(225, 29, 72, 0.75)'
                    ],
                    borderColor: '#FFFFFF',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10, color: '#0F172A' } } },
                scales: { r: { grid: { color: 'rgba(226, 232, 240, 0.9)' } } }
            }
        });
    }

    // --- CHART Q10: Inspection Status (Doughnut) ---
    const ctxQ10 = document.getElementById('chart-q10');
    if (ctxQ10 && qData && qData.q10_inspections) {
        const labels = qData.q10_inspections.map(d => d.SiteInspectionStatus);
        const counts = qData.q10_inspections.map(d => d.InspectionCount);
        chartQ10 = new Chart(ctxQ10, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: ['#059669', '#7C3AED', '#D97706', '#E11D48'],
                    borderColor: '#FFFFFF',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, color: '#0F172A' } } },
                cutout: '60%'
            }
        });
    }

    // --- CHART FEATURES: Feature Importance (Horizontal Bar) ---
    const ctxFeat = document.getElementById('chart-features');
    if (ctxFeat && featData) {
        const labels = featData.map(d => d.feature);
        const vals = featData.map(d => (d.importance * 100).toFixed(1));
        chartFeatures = new Chart(ctxFeat, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Importance (%)',
                    data: vals,
                    backgroundColor: 'rgba(5, 150, 105, 0.85)',
                    borderColor: '#059669',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(226, 232, 240, 0.9)' }, title: { display: true, text: 'Importance %', color: '#475569' } },
                    y: { grid: { display: false } }
                }
            }
        });
    }
}

/* ==============================================================================
   5. TAB SWITCHER
   ============================================================================== */
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

/* ==============================================================================
   6. INTERACTIVE SIMULATOR & PREDICTOR
   ============================================================================== */
function initSimulator() {
    const slConcrete = document.getElementById('sim-concrete');
    const slSteel = document.getElementById('sim-steel');
    const slLabor = document.getElementById('sim-labor');
    const slMachine = document.getElementById('sim-machine');
    const slCompletion = document.getElementById('sim-completion');

    const dispConcrete = document.getElementById('disp-concrete');
    const dispSteel = document.getElementById('disp-steel');
    const dispLabor = document.getElementById('disp-labor');
    const dispMachine = document.getElementById('disp-machine');
    const dispCompletion = document.getElementById('disp-completion');

    // Live display sync on slider drag
    if (slConcrete && dispConcrete) slConcrete.addEventListener('input', () => dispConcrete.innerText = `${slConcrete.value} m³`);
    if (slSteel && dispSteel) slSteel.addEventListener('input', () => dispSteel.innerText = `${slSteel.value} Tons`);
    if (slLabor && dispLabor) slLabor.addEventListener('input', () => dispLabor.innerText = `${slLabor.value} Workers`);
    if (slMachine && dispMachine) slMachine.addEventListener('input', () => dispMachine.innerText = `${parseFloat(slMachine.value).toFixed(1)} Hrs`);
    if (slCompletion && dispCompletion) slCompletion.addEventListener('input', () => dispCompletion.innerText = `${parseFloat(slCompletion.value).toFixed(1)} %`);

    // Preset Buttons
    const presetBtns = document.querySelectorAll('.btn-preset');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const preset = btn.getAttribute('data-preset');
            if (preset === 'mass-pour') {
                setSimulatorValues(145, 6.5, 95, 16.0, 42.5);
            } else if (preset === 'rebar-fix') {
                setSimulatorValues(28, 24.0, 115, 8.5, 30.0);
            } else if (preset === 'light-prep') {
                setSimulatorValues(15, 2.5, 45, 4.0, 15.0);
            }
            runSimulation();
        });
    });

    function setSimulatorValues(concrete, steel, labor, machine, completion) {
        if (slConcrete) { slConcrete.value = concrete; dispConcrete.innerText = `${concrete} m³`; }
        if (slSteel) { slSteel.value = steel; dispSteel.innerText = `${steel} Tons`; }
        if (slLabor) { slLabor.value = labor; dispLabor.innerText = `${labor} Workers`; }
        if (slMachine) { slMachine.value = machine; dispMachine.innerText = `${machine.toFixed(1)} Hrs`; }
        if (slCompletion) { slCompletion.value = completion; dispCompletion.innerText = `${completion.toFixed(1)} %`; }
    }

    // Run Simulation Button
    const btnRun = document.getElementById('btn-run-simulation');
    if (btnRun) {
        btnRun.addEventListener('click', runSimulation);
    }
}

async function runSimulation() {
    const concrete = parseFloat(document.getElementById('sim-concrete')?.value || 120);
    const steel = parseFloat(document.getElementById('sim-steel')?.value || 8.5);
    const labor = parseInt(document.getElementById('sim-labor')?.value || 85);
    const machine = parseFloat(document.getElementById('sim-machine')?.value || 14.5);
    const completion = parseFloat(document.getElementById('sim-completion')?.value || 35.0);

    const type = document.getElementById('sim-type')?.value || 'Commercial High-Rise';
    const city = document.getElementById('sim-city')?.value || 'Lahore';
    const weather = document.getElementById('sim-weather')?.value || 'Clear / Sunny';
    const subcontractor = document.getElementById('sim-subcontractor')?.value || 'Descon Engineering';

    const payload = {
        DailyLaborCount: labor,
        MachineryOperatingHours: machine,
        ConcretePouredM3: concrete,
        SteelConsumedTons: steel,
        AllocatedBudgetPKR: 45000000.0,
        ContractValuePKR: 850000000.0,
        EstimatedConcreteVolM3: 25000.0,
        CompletionPercentage: completion,
        ProjectType: type,
        LocationCity: city,
        WeatherCondition: weather,
        SiteInspectionStatus: 'Passed',
        AssignedSubcontractor: subcontractor
    };

    try {
        const res = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        updateSimulationResultUI(data);

    } catch (err) {
        console.error('Simulation request failed:', err);
    }
}

function updateSimulationResultUI(res) {
    if (!res) return;

    const phaseName = document.getElementById('res-phase-name');
    const clusterPill = document.getElementById('res-cluster-pill');
    const resBadge = document.getElementById('res-badge');
    const confText = document.getElementById('res-confidence');
    const confBar = document.getElementById('res-confidence-bar');

    const prob0 = document.getElementById('prob-0');
    const prob1 = document.getElementById('prob-1');
    const prob2 = document.getElementById('prob-2');
    const probBar0 = document.getElementById('prob-bar-0');
    const probBar1 = document.getElementById('prob-bar-1');
    const probBar2 = document.getElementById('prob-bar-2');

    const recsList = document.getElementById('res-recs-list');

    if (phaseName) phaseName.innerText = res.phase_name || 'General Activity';
    if (clusterPill) clusterPill.innerText = `Cluster ${res.cluster_id}`;

    // Styling based on cluster
    if (resBadge) {
        if (res.cluster_id === 0) {
            resBadge.style.background = 'rgba(2, 132, 199, 0.1)';
            resBadge.style.borderColor = '#0284C7';
            if (clusterPill) clusterPill.style.color = '#0284C7';
        } else if (res.cluster_id === 1) {
            resBadge.style.background = 'rgba(217, 119, 6, 0.1)';
            resBadge.style.borderColor = '#D97706';
            if (clusterPill) clusterPill.style.color = '#D97706';
        } else {
            resBadge.style.background = 'rgba(5, 150, 105, 0.1)';
            resBadge.style.borderColor = '#059669';
            if (clusterPill) clusterPill.style.color = '#059669';
        }
    }

    if (confText) confText.innerText = `${res.confidence_pct}%`;
    if (confBar) confBar.style.width = `${res.confidence_pct}%`;

    if (res.probabilities) {
        if (prob0) prob0.innerText = `${res.probabilities.light_prep_pct}%`;
        if (prob1) prob1.innerText = `${res.probabilities.rebar_heavy_pct}%`;
        if (prob2) prob2.innerText = `${res.probabilities.mass_pouring_pct}%`;

        if (probBar0) probBar0.style.width = `${res.probabilities.light_prep_pct}%`;
        if (probBar1) probBar1.style.width = `${res.probabilities.rebar_heavy_pct}%`;
        if (probBar2) probBar2.style.width = `${res.probabilities.mass_pouring_pct}%`;
    }

    if (recsList && res.recommendations) {
        recsList.innerHTML = '';
        res.recommendations.forEach(rec => {
            recsList.innerHTML += `<li>${rec}</li>`;
        });
    }
}

/* ==============================================================================
   7. MASTER DATABASE EXPLORER TABLE & LOCAL SEARCH
   ============================================================================== */
function initGlobalFilters() {
    const selCity = document.getElementById('filter-city');
    const selType = document.getElementById('filter-type');
    const selWeather = document.getElementById('filter-weather');
    const selInsp = document.getElementById('filter-inspection');
    const selSub = document.getElementById('filter-subcontractor');
    const btnReset = document.getElementById('btn-reset-filters');
    const tableSearch = document.getElementById('table-search');

    const applyFilters = () => {
        const city = selCity?.value || 'All';
        const type = selType?.value || 'All';
        const weather = selWeather?.value || 'All';
        const insp = selInsp?.value || 'All';
        const sub = selSub?.value || 'All';
        const search = (tableSearch?.value || '').toLowerCase().trim();

        filteredCohort = masterSiteLogs.filter(item => {
            if (city !== 'All' && item.LocationCity !== city) return false;
            if (type !== 'All' && item.ProjectType !== type) return false;
            if (weather !== 'All' && item.WeatherCondition !== weather) return false;
            if (insp !== 'All' && item.SiteInspectionStatus !== insp) return false;
            if (sub !== 'All' && item.AssignedSubcontractor !== sub) return false;

            if (search) {
                const matchProject = item.ProjectName && item.ProjectName.toLowerCase().includes(search);
                const matchPackage = item.PackageName && item.PackageName.toLowerCase().includes(search);
                const matchSub = item.AssignedSubcontractor && item.AssignedSubcontractor.toLowerCase().includes(search);
                const matchCity = item.LocationCity && item.LocationCity.toLowerCase().includes(search);
                const matchId = item.LogID && String(item.LogID).toLowerCase().includes(search);
                if (!matchProject && !matchPackage && !matchSub && !matchCity && !matchId) return false;
            }
            return true;
        });

        tableCurrentPage = 1;
        updateFilterCountBadge();
        renderDatabaseTable();
    };

    if (selCity) selCity.addEventListener('change', applyFilters);
    if (selType) selType.addEventListener('change', applyFilters);
    if (selWeather) selWeather.addEventListener('change', applyFilters);
    if (selInsp) selInsp.addEventListener('change', applyFilters);
    if (selSub) selSub.addEventListener('change', applyFilters);
    if (tableSearch) tableSearch.addEventListener('input', applyFilters);

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (selCity) selCity.value = 'All';
            if (selType) selType.value = 'All';
            if (selWeather) selWeather.value = 'All';
            if (selInsp) selInsp.value = 'All';
            if (selSub) selSub.value = 'All';
            if (tableSearch) tableSearch.value = '';
            filteredCohort = [...masterSiteLogs];
            tableCurrentPage = 1;
            updateFilterCountBadge();
            renderDatabaseTable();
        });
    }

    // Pagination buttons
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');

    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            if (tableCurrentPage > 1) {
                tableCurrentPage--;
                renderDatabaseTable();
            }
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredCohort.length / tablePageLimit);
            if (tableCurrentPage < totalPages) {
                tableCurrentPage++;
                renderDatabaseTable();
            }
        });
    }

    // CSV Export
    const btnExport = document.getElementById('btn-export-csv');
    if (btnExport) {
        btnExport.addEventListener('click', exportFilteredCSV);
    }
}

function updateFilterCountBadge() {
    const elF = document.getElementById('filtered-count');
    const elT = document.getElementById('total-count');
    if (elF) elF.innerText = filteredCohort.length.toLocaleString();
    if (elT) elT.innerText = masterSiteLogs.length.toLocaleString();
}

function renderDatabaseTable() {
    const tbody = document.getElementById('logs-table-body');
    const pageInd = document.getElementById('page-indicator');
    const pageStart = document.getElementById('page-start');
    const pageEnd = document.getElementById('page-end');
    const totalRecs = document.getElementById('table-total-records');
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');

    if (!tbody) return;

    const total = filteredCohort.length;
    const totalPages = Math.ceil(total / tablePageLimit) || 1;

    if (tableCurrentPage > totalPages) tableCurrentPage = totalPages;

    const startIdx = (tableCurrentPage - 1) * tablePageLimit;
    const endIdx = Math.min(startIdx + tablePageLimit, total);
    const currentSlice = filteredCohort.slice(startIdx, endIdx);

    tbody.innerHTML = '';

    if (currentSlice.length === 0) {
        tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 2rem; color: #64748B;">No matching site logs found for the selected filter criteria.</td></tr>`;
    } else {
        currentSlice.forEach(row => {
            const inspClass = row.SiteInspectionStatus === 'Passed' ? 'passed' :
                             row.SiteInspectionStatus === 'Failed' ? 'failed' :
                             row.SiteInspectionStatus === 'Under Review' ? 'review' : 'pending';

            const clusterClass = row.KMeans_Cluster === 0 ? 'c0' : row.KMeans_Cluster === 1 ? 'c1' : 'c2';
            const clusterName = row.KMeans_Cluster === 0 ? 'Light Prep (0)' :
                               row.KMeans_Cluster === 1 ? 'Rebar Heavy (1)' : 'Mass Pour (2)';

            tbody.innerHTML += `
                <tr>
                    <td><code>#${row.LogID}</code></td>
                    <td>${row.LogDate || '-'}</td>
                    <td><strong>${row.ProjectName || '-'}</strong></td>
                    <td>${row.ProjectType || '-'}</td>
                    <td><i class="fa-solid fa-location-dot text-brand-blue"></i> ${row.LocationCity || '-'}</td>
                    <td>${row.AssignedSubcontractor || '-'}</td>
                    <td>${row.DailyLaborCount}</td>
                    <td>${row.MachineryOperatingHours}h</td>
                    <td><strong class="text-brand-emerald">${row.ConcretePouredM3} m³</strong></td>
                    <td><strong class="text-brand-gold">${row.SteelConsumedTons} T</strong></td>
                    <td><span class="badge-pill ${inspClass}">${row.SiteInspectionStatus}</span></td>
                    <td><span class="badge-pill ${clusterClass}">${clusterName}</span></td>
                </tr>
            `;
        });
    }

    if (pageStart) pageStart.innerText = total > 0 ? (startIdx + 1) : 0;
    if (pageEnd) pageEnd.innerText = endIdx;
    if (totalRecs) totalRecs.innerText = total.toLocaleString();
    if (pageInd) pageInd.innerText = `Page ${tableCurrentPage} of ${totalPages}`;

    if (btnPrev) btnPrev.disabled = tableCurrentPage <= 1;
    if (btnNext) btnNext.disabled = tableCurrentPage >= totalPages;
}

function exportFilteredCSV() {
    if (!filteredCohort || filteredCohort.length === 0) {
        alert('No records available to export.');
        return;
    }

    const headers = ['LogID', 'LogDate', 'ProjectName', 'ProjectType', 'LocationCity', 'PackageName', 'AssignedSubcontractor', 'DailyLaborCount', 'MachineryOperatingHours', 'ConcretePouredM3', 'SteelConsumedTons', 'WeatherCondition', 'SiteInspectionStatus', 'KMeans_Cluster'];

    let csvContent = headers.join(',') + '\n';

    filteredCohort.forEach(row => {
        const line = headers.map(h => {
            let val = row[h] !== undefined ? String(row[h]) : '';
            val = val.replace(/"/g, '""');
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                val = `"${val}"`;
            }
            return val;
        }).join(',');
        csvContent += line + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Civil_Site_Logs_Filtered_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
