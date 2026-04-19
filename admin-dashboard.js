/* =============================================
   Pilgrim's Path — Admin Dashboard JavaScript
   9-Module Dashboard with Claude AI Integration
   ============================================= */

// ===== ADMIN AUTH =====
const ADMIN_CREDENTIALS = {
    email: 'admin@pilgrimspath.io',
    // SHA-256 hash of the password — never store plaintext
    passwordHash: 'bc0f4bcc8a76b7663afcf82ba09faf48d254316e55f815305419582a0a94ec79' // CHANGE THIS
};

function hashPassword(password) {
    // Simple SHA-256 via SubtleCrypto
    const encoder = new TextEncoder();
    return crypto.subtle.digest('SHA-256', encoder.encode(password)).then(buf => {
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    });
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('adminLoginBtn');
    const errorEl = document.getElementById('adminLoginError');
    const email = document.getElementById('adminEmail').value.trim().toLowerCase();
    const password = document.getElementById('adminPassword').value;

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    errorEl.textContent = '';

    // Rate-limit: basic client-side delay to slow brute force
    await new Promise(r => setTimeout(r, 500));

    const hash = await hashPassword(password);

    if (email === ADMIN_CREDENTIALS.email && hash === ADMIN_CREDENTIALS.passwordHash) {
        sessionStorage.setItem('pp_admin_auth', Date.now().toString());
        showDashboard();
    } else {
        errorEl.textContent = 'Invalid email or password';
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
    return false;
}

function showDashboard() {
    document.getElementById('adminLoginOverlay').classList.add('hidden');
    document.querySelector('.admin-topbar').style.display = '';
    document.getElementById('adminSidebar').style.display = '';
    document.getElementById('adminMain').style.display = '';
}

function checkAdminAuth() {
    const auth = sessionStorage.getItem('pp_admin_auth');
    if (auth) {
        const elapsed = Date.now() - parseInt(auth);
        // Session valid for 8 hours
        if (elapsed < 8 * 60 * 60 * 1000) {
            showDashboard();
            return;
        }
        sessionStorage.removeItem('pp_admin_auth');
    }
}

// ===== CONFIGURATION =====
const SUPABASE_URL = 'https://giftctxrqvlfekhzpcaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZnRjdHhycXZsZmVraHpwY2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTg0NjQsImV4cCI6MjA4ODI5NDQ2NH0.Dm4tb6lvLMf9CDLo04qA9msYVLjBT-Web48pgk0BOYc';
const CLAUDE_PROXY = '/api/claude';

let demoMode = true;
let currentModule = 'overview';
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();
let calendarItems = JSON.parse(localStorage.getItem('pp_calendar') || '[]');
let aiDrafts = JSON.parse(localStorage.getItem('pp_ai_drafts') || '[]');
let abTests = JSON.parse(localStorage.getItem('pp_ab_tests') || '[]');

// ===== MOCK DATA =====
const MOCK = {
    users: generateMockUsers(186),
    leads: 412,
    vrSessions: 3847,
    revenue: 4280,
    revenueHistory: [1800,2100,2400,2200,3100,3600,4280],
    months: ['Oct','Nov','Dec','Jan','Feb','Mar','Apr'],
    trafficData: generateTrafficData(30),
    countries: [
        { code: 'US', flag: '🇺🇸', name: 'United States', count: 42 },
        { code: 'GB', flag: '🇬🇧', name: 'United Kingdom', count: 28 },
        { code: 'SA', flag: '🇸🇦', name: 'Saudi Arabia', count: 24 },
        { code: 'NG', flag: '🇳🇬', name: 'Nigeria', count: 19 },
        { code: 'MY', flag: '🇲🇾', name: 'Malaysia', count: 16 },
        { code: 'PK', flag: '🇵🇰', name: 'Pakistan', count: 14 },
        { code: 'ID', flag: '🇮🇩', name: 'Indonesia', count: 12 },
        { code: 'CA', flag: '🇨🇦', name: 'Canada', count: 11 },
        { code: 'AE', flag: '🇦🇪', name: 'UAE', count: 10 },
        { code: 'TR', flag: '🇹🇷', name: 'Turkey', count: 8 }
    ],
    transactions: [
        { date: '2026-04-19', user: 'Amina Hassan', type: 'Subscription', plan: 'Individual ($19/yr)', amount: '$19.00', status: 'completed' },
        { date: '2026-04-18', user: 'Omar Sheikh', type: 'Donation', plan: '—', amount: '$50.00', status: 'completed' },
        { date: '2026-04-18', user: 'Fatima Al-Rashid', type: 'Subscription', plan: 'Agency ($999/yr)', amount: '$999.00', status: 'completed' },
        { date: '2026-04-17', user: 'Ibrahim Yusuf', type: 'Subscription', plan: 'Individual ($19/yr)', amount: '$19.00', status: 'completed' },
        { date: '2026-04-17', user: 'Sarah Ahmed', type: 'Donation', plan: '—', amount: '$25.00', status: 'completed' },
        { date: '2026-04-16', user: 'Khalid Bin Walid Agency', type: 'Subscription', plan: 'Agency ($999/yr)', amount: '$999.00', status: 'pending' },
        { date: '2026-04-15', user: 'Maryam Obi', type: 'Donation', plan: '—', amount: '$10.00', status: 'completed' },
        { date: '2026-04-14', user: 'Abdul Rahman', type: 'Subscription', plan: 'Individual ($19/yr)', amount: '$19.00', status: 'completed' }
    ],
    crmLeads: [
        { name: 'Al-Huda Travel', value: '$5,990', stage: 'lead', contact: 'Ahmed K.', days: 3 },
        { name: 'Sacred Journeys Ltd', value: '$11,970', stage: 'lead', contact: 'Omar S.', days: 5 },
        { name: 'Barakah Tours', value: '$5,990', stage: 'qualified', contact: 'Fatima R.', days: 8 },
        { name: 'Noor Pilgrimages', value: '$17,960', stage: 'qualified', contact: 'Hassan M.', days: 12 },
        { name: 'Tawfiq Travels', value: '$5,990', stage: 'proposal', contact: 'Yusuf A.', days: 15 },
        { name: 'Ihsan Group', value: '$11,970', stage: 'proposal', contact: 'Aisha B.', days: 20 },
        { name: 'Madinah Voyages', value: '$5,990', stage: 'closed', contact: 'Bilal T.', days: 30 },
        { name: 'Salam Travel Co', value: '$11,970', stage: 'closed', contact: 'Maryam O.', days: 45 }
    ],
    abTests: [
        { name: 'Hero CTA: "Start Journey" vs "Experience Now"', varA: 'Start Your Journey', varB: 'Experience Now', aConv: 3.2, bConv: 4.7, status: 'active', days: 8, traffic: 2400 },
        { name: 'Pricing: Show Annual vs Monthly', varA: 'Annual Only', varB: 'Monthly Toggle', aConv: 2.8, bConv: 3.1, status: 'active', days: 5, traffic: 1800 },
        { name: 'VR Preview: Autoplay vs Click', varA: 'Click to Play', varB: 'Autoplay', aConv: 5.1, bConv: 6.8, status: 'active', days: 12, traffic: 3200 },
        { name: 'Lead Form: Inline vs Popup', varA: 'Inline Form', varB: 'Popup Modal', aConv: 1.9, bConv: 2.4, status: 'active', days: 3, traffic: 900 }
    ],
    completedTests: [
        { name: 'Donate Button Color', winner: 'Gold (#C9A84C)', lift: '+34%', confidence: '98%', duration: '14 days' },
        { name: 'Nav Position: Sticky vs Fixed', winner: 'Fixed Top', lift: '+12%', confidence: '95%', duration: '10 days' },
        { name: 'Article CTA Placement', winner: 'End of Article', lift: '+28%', confidence: '97%', duration: '18 days' },
        { name: 'Email Subject: Question vs Statement', winner: 'Question Format', lift: '+41%', confidence: '99%', duration: '7 days' }
    ],
    notifications: [
        { icon: 'fa-user-plus', cls: 'gold', text: '<strong>Amina Hassan</strong> signed up for Individual plan', time: '2 hours ago', unread: true },
        { icon: 'fa-dollar-sign', cls: 'green', text: 'New donation of <strong>$50</strong> from Omar Sheikh', time: '4 hours ago', unread: true },
        { icon: 'fa-building', cls: 'blue', text: '<strong>Khalid Bin Walid Agency</strong> requested a demo', time: '6 hours ago', unread: true },
        { icon: 'fa-chart-line', cls: 'gold', text: 'Weekly traffic up <strong>18%</strong> — 3,200 sessions', time: '1 day ago', unread: false },
        { icon: 'fa-flask', cls: 'green', text: 'A/B Test "Hero CTA" reached <strong>95% confidence</strong>', time: '1 day ago', unread: false },
        { icon: 'fa-newspaper', cls: 'blue', text: 'Article "Hajj 2026 Dates" hit <strong>5,000 views</strong>', time: '2 days ago', unread: false },
        { icon: 'fa-exclamation-triangle', cls: 'red', text: 'Paystack webhook timeout — resolved automatically', time: '3 days ago', unread: false }
    ],
    scenes: [
        { name: 'Tawaf (Kaaba)', views: 12400, avgTime: '5:23', completion: 78 },
        { name: 'Safa & Marwa', views: 9800, avgTime: '4:45', completion: 72 },
        { name: 'Mina', views: 7200, avgTime: '3:18', completion: 65 },
        { name: 'Arafah', views: 8900, avgTime: '6:02', completion: 82 },
        { name: 'Muzdalifah', views: 6100, avgTime: '2:45', completion: 58 },
        { name: 'Rami al-Jamarat', views: 5300, avgTime: '3:32', completion: 61 },
        { name: 'Masjid al-Haram', views: 14200, avgTime: '7:15', completion: 85 }
    ],
    articles: [
        { title: 'Hajj 2026 Dates & Schedule', views: 8400, shares: 342, ctr: '4.2%' },
        { title: 'Complete Umrah Step-by-Step', views: 6200, shares: 218, ctr: '3.8%' },
        { title: 'How to Perform Hajj Guide', views: 5800, shares: 195, ctr: '3.5%' },
        { title: 'Tawaf Guide', views: 4100, shares: 156, ctr: '3.1%' },
        { title: 'Ihram Guide for Men & Women', views: 3900, shares: 134, ctr: '2.9%' },
        { title: 'Day of Arafah Guide', views: 3600, shares: 128, ctr: '3.3%' },
        { title: 'What to Pack for Hajj', views: 3200, shares: 112, ctr: '2.7%' },
        { title: 'VR Kaaba Tawaf Guide', views: 2800, shares: 98, ctr: '4.5%' }
    ],
    audienceSegments: [
        { name: 'First-Time Pilgrims', size: '42%', desc: 'Age 25-40, exploring Hajj/Umrah info', engagement: 'High', color: 'gold' },
        { name: 'Returning Pilgrims', size: '23%', desc: 'Have performed before, seeking VR nostalgia', engagement: 'Medium', color: 'blue' },
        { name: 'Islamic Educators', size: '15%', desc: 'Teachers, imams using VR for education', engagement: 'Very High', color: 'green' },
        { name: 'Travel Agencies', size: '8%', desc: 'B2B prospects evaluating platform', engagement: 'Medium', color: 'purple' },
        { name: 'Muslim Parents', size: '12%', desc: 'Teaching children about Hajj virtually', engagement: 'High', color: 'orange' }
    ]
};

function generateMockUsers(count) {
    const firstNames = ['Amina','Omar','Fatima','Ibrahim','Sarah','Khalid','Maryam','Abdul','Aisha','Hassan','Yusuf','Zainab','Ahmed','Layla','Bilal','Khadija','Mustafa','Noor','Ali','Hafsa'];
    const lastNames = ['Hassan','Sheikh','Al-Rashid','Yusuf','Ahmed','Obi','Rahman','Malik','Khan','Patel','Ibrahim','Ali','Hussain','Bakr','Siddiqui','Farooq','Nasser','Saleh','Mahmoud','Chowdhury'];
    const countries = ['US','GB','SA','NG','MY','PK','ID','CA','AE','TR','EG','IN','BD','DE','FR'];
    const plans = ['Free','Free','Free','Free','Individual','Individual','Individual','Agency'];
    const users = [];
    const now = Date.now();
    for (let i = 0; i < count; i++) {
        const createdDaysAgo = Math.floor(Math.random() * 180);
        const lastActiveDaysAgo = Math.floor(Math.random() * Math.min(createdDaysAgo + 1, 30));
        users.push({
            name: firstNames[i % firstNames.length] + ' ' + lastNames[i % lastNames.length],
            email: (firstNames[i % firstNames.length] + '.' + lastNames[i % lastNames.length] + (i > 19 ? i : '') + '@example.com').toLowerCase(),
            country: countries[Math.floor(Math.random() * countries.length)],
            plan: plans[Math.floor(Math.random() * plans.length)],
            joined: new Date(now - createdDaysAgo * 86400000).toISOString().split('T')[0],
            lastActive: lastActiveDaysAgo === 0 ? 'Today' : lastActiveDaysAgo + 'd ago',
            status: lastActiveDaysAgo < 7 ? 'active' : lastActiveDaysAgo < 30 ? 'inactive' : 'churned'
        });
    }
    return users;
}

function generateTrafficData(days) {
    const data = { labels: [], visitors: [], sessions: [], pageViews: [] };
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now - i * 86400000);
        data.labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const base = 80 + Math.floor(Math.random() * 60);
        data.visitors.push(base);
        data.sessions.push(base + Math.floor(Math.random() * 40));
        data.pageViews.push(base * 3 + Math.floor(Math.random() * 100));
    }
    return data;
}

// ===== MODULE SWITCHING =====
function switchModule(moduleId) {
    currentModule = moduleId;
    document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

    const mod = document.getElementById('mod-' + moduleId);
    if (mod) mod.classList.add('active');

    const link = document.querySelector(`.sidebar-link[data-module="${moduleId}"]`);
    if (link) link.classList.add('active');

    // Close mobile sidebar
    document.getElementById('adminSidebar').classList.remove('open');

    // Initialize module-specific charts if needed
    initModuleCharts(moduleId);
}

function initModuleCharts(moduleId) {
    switch (moduleId) {
        case 'overview': initOverviewCharts(); break;
        case 'ai-hub': initAICharts(); break;
        case 'content': initContentCharts(); break;
        case 'revenue': initRevenueCharts(); break;
    }
}

// ===== DEMO MODE =====
function toggleDemoMode() {
    demoMode = !demoMode;
    const toggle = document.getElementById('demoToggle');
    toggle.classList.toggle('active', demoMode);
    if (demoMode) {
        loadDemoData();
    } else {
        loadLiveData();
    }
}

// ===== SUPABASE HELPERS =====
async function supabaseFetch(table, query) {
    try {
        const url = `${SUPABASE_URL}/rest/v1/${table}${query || ''}`;
        const res = await fetch(url, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });
        if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
        return await res.json();
    } catch (e) {
        console.warn('Supabase fetch failed:', e);
        return null;
    }
}

async function loadLiveData() {
    // Try loading real user data from Supabase
    const users = await supabaseFetch('profiles', '?select=*&order=created_at.desc&limit=200');
    const leads = await supabaseFetch('leads', '?select=id&head=true');

    if (users && users.length > 0) {
        document.getElementById('statTotalUsers').textContent = users.length.toLocaleString();
        // Additional live data processing could go here
    } else {
        // Fallback to demo if no live data
        demoMode = true;
        document.getElementById('demoToggle').classList.add('active');
        loadDemoData();
    }
}

function loadDemoData() {
    // Overview stats
    document.getElementById('statTotalUsers').textContent = MOCK.users.length.toLocaleString();
    document.getElementById('statUsersTrend').textContent = '12%';
    document.getElementById('statVRSessions').textContent = MOCK.vrSessions.toLocaleString();
    document.getElementById('statVRTrend').textContent = '18%';
    document.getElementById('statRevenue').textContent = '$' + MOCK.revenue.toLocaleString();
    document.getElementById('statRevTrend').textContent = '24%';
    document.getElementById('statLeads').textContent = MOCK.leads.toLocaleString();
    document.getElementById('statLeadsTrend').textContent = '15%';

    // User stats
    const newThisWeek = MOCK.users.filter(u => {
        const d = new Date(u.joined);
        return (Date.now() - d) < 7 * 86400000;
    }).length;
    document.getElementById('usersNewWeek').textContent = newThisWeek;
    document.getElementById('usersActive30').textContent = MOCK.users.filter(u => u.status === 'active').length;
    document.getElementById('usersPremium').textContent = MOCK.users.filter(u => u.plan === 'Individual').length;
    document.getElementById('usersAgency').textContent = MOCK.users.filter(u => u.plan === 'Agency').length;

    populateUsersTable(MOCK.users);
    populateCountries(MOCK.countries);
    populateRecentActivity();
    populateTopArticles();
    populateABTests();
    populateCompletedTests();
    populateNotifications();
    populateCRMPipeline();
    populateAudienceSegments();
    populateTransactions();
    renderCalendar();
    renderUpcoming();
    loadSavedDrafts();
    initOverviewCharts();
}

// ===== CHART INITIALIZATION =====
let charts = {};

function destroyChart(id) {
    if (charts[id]) {
        charts[id].destroy();
        delete charts[id];
    }
}

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#8B95A8', font: { family: 'DM Sans', size: 11 } } }
    },
    scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5A6478', font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5A6478', font: { size: 10 } } }
    }
};

function initOverviewCharts() {
    // Traffic Chart
    const ctx1 = document.getElementById('trafficChart');
    if (!ctx1) return;
    destroyChart('traffic');
    charts.traffic = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: MOCK.trafficData.labels,
            datasets: [
                {
                    label: 'Visitors',
                    data: MOCK.trafficData.visitors,
                    borderColor: '#C9A84C',
                    backgroundColor: 'rgba(201,168,76,0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4
                },
                {
                    label: 'Sessions',
                    data: MOCK.trafficData.sessions,
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59,130,246,0.08)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }
            ]
        },
        options: {
            ...chartDefaults,
            interaction: { intersect: false, mode: 'index' }
        }
    });

    // Funnel Chart
    const ctx2 = document.getElementById('funnelChart');
    if (!ctx2) return;
    destroyChart('funnel');
    charts.funnel = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['Site Visitors', 'VR Sessions', 'Leads', 'Free Users', 'Paid Users', 'Agency'],
            datasets: [{
                data: [3847, 2180, 412, 186, 48, 8],
                backgroundColor: ['#C9A84C', '#E8D5A0', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'],
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: {
            ...chartDefaults,
            indexAxis: 'y',
            plugins: { ...chartDefaults.plugins, legend: { display: false } }
        }
    });
}

function initAICharts() {
    // Campaign performance
    const ctx1 = document.getElementById('campaignChart');
    if (!ctx1) return;
    destroyChart('campaign');
    charts.campaign = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [
                { label: 'Impressions (K)', data: [42, 58, 71, 84], backgroundColor: '#C9A84C', borderRadius: 4 },
                { label: 'Clicks', data: [1.6, 2.1, 2.8, 3.2], backgroundColor: '#3B82F6', borderRadius: 4 }
            ]
        },
        options: chartDefaults
    });

    // Spend vs Revenue
    const ctx2 = document.getElementById('spendRevenueChart');
    if (!ctx2) return;
    destroyChart('spendRevenue');
    charts.spendRevenue = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr'],
            datasets: [
                { label: 'Ad Spend', data: [800, 950, 1100, 1240], borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4 },
                { label: 'Revenue', data: [2200, 3100, 3600, 4280], borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4 }
            ]
        },
        options: { ...chartDefaults, interaction: { intersect: false, mode: 'index' } }
    });
}

function initContentCharts() {
    const ctx = document.getElementById('sceneChart');
    if (!ctx) return;
    destroyChart('scene');
    charts.scene = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: MOCK.scenes.map(s => s.name),
            datasets: [{
                label: 'Views',
                data: MOCK.scenes.map(s => s.views),
                backgroundColor: 'rgba(201,168,76,0.6)',
                borderColor: '#C9A84C',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: { ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }
    });
}

function initRevenueCharts() {
    const ctx1 = document.getElementById('revenueChart');
    if (ctx1) {
        destroyChart('revenue');
        charts.revenue = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: MOCK.months,
                datasets: [{
                    label: 'Revenue ($)',
                    data: MOCK.revenueHistory,
                    borderColor: '#C9A84C',
                    backgroundColor: 'rgba(201,168,76,0.15)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointBackgroundColor: '#C9A84C'
                }]
            },
            options: { ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }
        });
    }

    const ctx2 = document.getElementById('planChart');
    if (ctx2) {
        destroyChart('plan');
        charts.plan = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['Free', 'Individual ($19/yr)', 'Agency ($999/yr)'],
                datasets: [{
                    data: [130, 48, 8],
                    backgroundColor: ['#5A6478', '#C9A84C', '#8B5CF6'],
                    borderColor: '#1A1F35',
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#8B95A8', font: { family: 'DM Sans', size: 11 }, padding: 16 } }
                }
            }
        });
    }
}

// ===== POPULATE FUNCTIONS =====
function populateUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    const flagMap = { US: '🇺🇸', GB: '🇬🇧', SA: '🇸🇦', NG: '🇳🇬', MY: '🇲🇾', PK: '🇵🇰', ID: '🇮🇩', CA: '🇨🇦', AE: '🇦🇪', TR: '🇹🇷', EG: '🇪🇬', IN: '🇮🇳', BD: '🇧🇩', DE: '🇩🇪', FR: '🇫🇷' };
    const planTag = { Free: 'tag-info', Individual: 'tag-gold', Agency: 'tag-purple' };
    const statusTag = { active: 'tag-success', inactive: 'tag-warning', churned: 'tag-danger' };

    tbody.innerHTML = users.slice(0, 50).map(u => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px">
                    <div style="width:32px;height:32px;border-radius:8px;background:var(--gold-glow);color:var(--gold);display:flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700">${u.name.split(' ').map(n => n[0]).join('')}</div>
                    <div>
                        <div style="font-weight:600;color:var(--text-primary);font-size:0.82rem">${escapeHTML(u.name)}</div>
                        <div style="font-size:0.72rem;color:var(--text-muted)">${escapeHTML(u.email)}</div>
                    </div>
                </div>
            </td>
            <td><span class="tag ${planTag[u.plan] || 'tag-info'}">${u.plan}</span></td>
            <td>${flagMap[u.country] || '🌍'} ${u.country}</td>
            <td>${u.joined}</td>
            <td>${u.lastActive}</td>
            <td><span class="tag ${statusTag[u.status] || 'tag-info'}">${u.status}</span></td>
        </tr>
    `).join('');
}

function populateCountries(countries) {
    const el = document.getElementById('topCountries');
    if (!el) return;
    el.innerHTML = countries.map(c => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:1.2rem">${c.flag}</span>
                <span style="font-size:0.82rem;color:var(--text-secondary)">${c.name}</span>
            </div>
            <span style="font-weight:700;color:var(--text-primary);font-size:0.82rem">${c.count}</span>
        </div>
    `).join('');
}

function populateRecentActivity() {
    const el = document.getElementById('recentActivity');
    if (!el) return;
    const activities = [
        { dot: 'gold', text: '<strong>Amina Hassan</strong> signed up for Individual plan', time: '2h ago' },
        { dot: 'green', text: '<strong>Omar Sheikh</strong> donated $50', time: '4h ago' },
        { dot: 'blue', text: '<strong>Fatima Al-Rashid</strong> completed Tawaf VR scene', time: '5h ago' },
        { dot: 'gold', text: '<strong>Ibrahim Y.</strong> started free trial', time: '6h ago' },
        { dot: 'green', text: '<strong>Sarah Ahmed</strong> donated $25', time: '8h ago' },
        { dot: 'blue', text: '<strong>Khalid Agency</strong> requested demo', time: '1d ago' },
        { dot: 'red', text: 'Paystack webhook timeout (resolved)', time: '1d ago' },
        { dot: 'gold', text: '<strong>Maryam Obi</strong> signed up', time: '1d ago' }
    ];
    el.innerHTML = activities.map(a => `
        <div class="activity-item">
            <div class="activity-dot ${a.dot}"></div>
            <div>
                <div class="activity-text">${a.text}</div>
                <div class="activity-time">${a.time}</div>
            </div>
        </div>
    `).join('');
}

function populateTopArticles() {
    const el = document.getElementById('topArticles');
    if (!el) return;
    el.innerHTML = MOCK.articles.map((a, i) => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:0.7rem;font-weight:700;color:var(--text-muted);width:20px">#${i + 1}</span>
                <span style="font-size:0.82rem;color:var(--text-primary)">${a.title}</span>
            </div>
            <div style="display:flex;gap:16px;font-size:0.72rem;color:var(--text-muted)">
                <span><i class="fas fa-eye"></i> ${a.views.toLocaleString()}</span>
                <span><i class="fas fa-share"></i> ${a.shares}</span>
            </div>
        </div>
    `).join('');
}

function populateABTests() {
    const el = document.getElementById('abTestsList');
    if (!el) return;
    el.innerHTML = MOCK.abTests.map(t => {
        const leading = t.bConv > t.aConv ? 'B' : 'A';
        const lift = Math.abs(((t.bConv - t.aConv) / t.aConv) * 100).toFixed(0);
        return `
        <div style="background:var(--bg-input);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <strong style="color:var(--text-primary);font-size:0.88rem">${t.name}</strong>
                <span class="tag tag-success">Running ${t.days}d</span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:8px">
                <div style="padding:10px;background:var(--bg-card);border-radius:8px;border:1px solid ${leading === 'A' ? 'var(--gold-border)' : 'var(--border)'}">
                    <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:2px">Variant A ${leading === 'A' ? '👑' : ''}</div>
                    <div style="font-size:0.78rem;color:var(--text-secondary)">${t.varA}</div>
                    <div style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-top:4px">${t.aConv}%</div>
                </div>
                <div style="padding:10px;background:var(--bg-card);border-radius:8px;border:1px solid ${leading === 'B' ? 'var(--gold-border)' : 'var(--border)'}">
                    <div style="font-size:0.7rem;color:var(--text-muted);margin-bottom:2px">Variant B ${leading === 'B' ? '👑' : ''}</div>
                    <div style="font-size:0.78rem;color:var(--text-secondary)">${t.varB}</div>
                    <div style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-top:4px">${t.bConv}%</div>
                </div>
            </div>
            <div style="display:flex;gap:16px;font-size:0.72rem;color:var(--text-muted)">
                <span><i class="fas fa-users"></i> ${t.traffic.toLocaleString()} visitors</span>
                <span><i class="fas fa-arrow-up" style="color:var(--success)"></i> +${lift}% lift</span>
            </div>
        </div>`;
    }).join('');
}

function populateCompletedTests() {
    const el = document.getElementById('completedTests');
    if (!el) return;
    el.innerHTML = MOCK.completedTests.map(t => `
        <tr>
            <td><strong style="color:var(--text-primary)">${t.name}</strong></td>
            <td>${t.winner}</td>
            <td><span class="tag tag-success">${t.lift}</span></td>
            <td>${t.confidence}</td>
            <td>${t.duration}</td>
            <td><span class="tag tag-gold">Winner Applied</span></td>
        </tr>
    `).join('');
}

function populateNotifications() {
    const el = document.getElementById('notifList');
    if (!el) return;
    el.innerHTML = MOCK.notifications.map(n => `
        <div class="notif-item ${n.unread ? 'unread' : ''}">
            <div class="notif-icon ${n.cls}"><i class="fas ${n.icon}"></i></div>
            <div>
                <div class="notif-text">${n.text}</div>
                <div class="notif-time">${n.time}</div>
            </div>
        </div>
    `).join('');
}

function populateCRMPipeline() {
    const el = document.getElementById('pipelineBoard');
    if (!el) return;
    const stages = [
        { id: 'lead', title: 'New Leads', color: 'var(--info)' },
        { id: 'qualified', title: 'Qualified', color: 'var(--warning)' },
        { id: 'proposal', title: 'Proposal Sent', color: 'var(--purple)' },
        { id: 'closed', title: 'Closed Won', color: 'var(--success)' }
    ];

    el.innerHTML = stages.map(stage => {
        const leads = MOCK.crmLeads.filter(l => l.stage === stage.id);
        return `
        <div class="pipeline-column">
            <div class="pipeline-column-header">
                <span class="pipeline-column-title" style="border-left:3px solid ${stage.color};padding-left:8px">${stage.title}</span>
                <span class="pipeline-count">${leads.length}</span>
            </div>
            ${leads.map(l => `
                <div class="pipeline-card">
                    <div class="pipeline-card-name">${l.name}</div>
                    <div class="pipeline-card-value">${l.value}</div>
                    <div class="pipeline-card-meta">
                        <span><i class="fas fa-user"></i> ${l.contact}</span>
                        <span><i class="fas fa-clock"></i> ${l.days}d</span>
                    </div>
                </div>
            `).join('')}
        </div>`;
    }).join('');
}

function populateAudienceSegments() {
    const el = document.getElementById('audienceSegments');
    if (!el) return;
    el.innerHTML = MOCK.audienceSegments.map(s => `
        <div style="padding:12px 0;border-bottom:1px solid var(--border)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <strong style="color:var(--text-primary);font-size:0.85rem">${s.name}</strong>
                <span class="tag tag-${s.color}">${s.size}</span>
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px">${s.desc}</div>
            <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:0.7rem;color:var(--text-muted)">Engagement:</span>
                <span style="font-size:0.72rem;font-weight:600;color:var(--${s.color})">${s.engagement}</span>
            </div>
        </div>
    `).join('');
}

function populateTransactions() {
    const el = document.getElementById('transactionsTable');
    if (!el) return;
    el.innerHTML = MOCK.transactions.map(t => `
        <tr>
            <td>${t.date}</td>
            <td><strong style="color:var(--text-primary)">${t.user}</strong></td>
            <td>${t.type}</td>
            <td>${t.plan}</td>
            <td style="font-weight:700;color:var(--gold)">${t.amount}</td>
            <td><span class="tag tag-${t.status === 'completed' ? 'success' : 'warning'}">${t.status}</span></td>
        </tr>
    `).join('');
}

// ===== CLAUDE AI INTEGRATION =====
async function callClaude(messages, systemPrompt) {
    try {
        const res = await fetch(CLAUDE_PROXY, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages,
                system: systemPrompt || 'You are an expert Islamic travel and pilgrimage marketing strategist for Pilgrim\'s Path, a virtual 360° Hajj & Umrah VR experience platform. Pricing: Free tier, $19/year Individual, $999/year Agency. Always provide actionable, culturally sensitive marketing advice.',
                stream: false
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || err.error || 'API error');
        }

        const data = await res.json();
        return data.content?.[0]?.text || data.content || 'No response generated.';
    } catch (e) {
        console.error('Claude API error:', e);
        return `⚠️ AI Error: ${e.message}\n\nIf running locally, ensure ANTHROPIC_API_KEY is set in your environment. The Claude AI proxy at /api/claude must be available.`;
    }
}

// Campaign Studio
const AI_PROMPTS = {
    hajj2026: 'Create a comprehensive Hajj 2026 early-bird marketing campaign. Target: Muslim families in US/UK planning their first Hajj. Budget: $500/month. Channels: Facebook, Instagram. Goal: Drive VR experience sign-ups and convert to Individual plans ($19/yr). Include ad copy, audience targeting, and content calendar.',
    umrah: 'Design an Umrah preparation campaign targeting young Muslim professionals (25-35). Highlight our VR Umrah experience for pre-trip preparation. Include social media strategy, email sequences, and retargeting ideas.',
    ramadan: 'Create a Ramadan marketing campaign leveraging our VR Hajj experience. Focus: spiritual preparation, educational content, family engagement. Include special Ramadan pricing offers and content ideas.',
    agency: 'Develop a B2B outreach strategy for Islamic travel agencies. Value prop: white-label VR Hajj experience for their clients. Agency plan: $999/year. Include email templates, LinkedIn strategy, and partnership proposal outline.',
    retarget: 'Design a retargeting campaign for users who visited the VR experience but didn\'t sign up. Include Facebook pixel audiences, email re-engagement, and conversion-optimized landing page recommendations.'
};

function setAIPrompt(key) {
    document.getElementById('aiPromptInput').value = AI_PROMPTS[key] || '';
}

async function generateCampaign() {
    const input = document.getElementById('aiPromptInput').value.trim();
    if (!input) return;

    const responseBox = document.getElementById('aiResponseBox');
    const btn = document.getElementById('aiGenerateBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner" style="width:14px;height:14px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.8s linear infinite;display:inline-block"></div> Generating...';
    responseBox.innerHTML = '<div class="loading"><div class="spinner"></div> Claude is generating your campaign strategy...</div>';

    const response = await callClaude([{ role: 'user', content: input }]);

    responseBox.textContent = response;
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate Campaign';
}

function clearAIResponse() {
    document.getElementById('aiResponseBox').innerHTML = '<span style="color:var(--text-muted)">Click "Generate Campaign" to get AI-powered campaign suggestions...</span>';
    document.getElementById('aiPromptInput').value = '';
}

function copyAIResponse() {
    const text = document.getElementById('aiResponseBox').textContent;
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
}

function saveAIDraft() {
    const prompt = document.getElementById('aiPromptInput').value;
    const response = document.getElementById('aiResponseBox').textContent;
    if (!response || response.includes('Click "Generate')) return;

    const draft = {
        id: Date.now(),
        prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
        response,
        date: new Date().toLocaleDateString()
    };
    aiDrafts.unshift(draft);
    localStorage.setItem('pp_ai_drafts', JSON.stringify(aiDrafts));
    loadSavedDrafts();
    showToast('Draft saved');
}

function loadSavedDrafts() {
    const el = document.getElementById('savedDrafts');
    if (!el) return;
    if (aiDrafts.length === 0) {
        el.innerHTML = '<div class="empty-state"><i class="fas fa-bookmark"></i><p>No saved drafts yet</p></div>';
        return;
    }
    el.innerHTML = aiDrafts.slice(0, 10).map(d => `
        <div style="padding:12px;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer" onclick="loadDraft(${d.id})">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <strong style="color:var(--text-primary);font-size:0.82rem">${escapeHTML(d.prompt)}</strong>
                <span style="font-size:0.7rem;color:var(--text-muted)">${d.date}</span>
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted);max-height:40px;overflow:hidden">${escapeHTML(d.response.substring(0, 150))}...</div>
        </div>
    `).join('');
}

function loadDraft(id) {
    const draft = aiDrafts.find(d => d.id === id);
    if (draft) {
        document.getElementById('aiResponseBox').textContent = draft.response;
    }
}

function clearAllDrafts() {
    aiDrafts = [];
    localStorage.removeItem('pp_ai_drafts');
    loadSavedDrafts();
    showToast('Drafts cleared');
}

// Audience Intelligence
async function analyzeAudience() {
    const input = document.getElementById('audiencePrompt').value.trim();
    if (!input) return;

    const responseBox = document.getElementById('audienceResponse');
    responseBox.innerHTML = '<div class="loading"><div class="spinner"></div> Analyzing audience data...</div>';

    const context = `Current audience data:\n${MOCK.audienceSegments.map(s => `- ${s.name}: ${s.size} of users, ${s.desc}, Engagement: ${s.engagement}`).join('\n')}\n\nTop countries: ${MOCK.countries.map(c => `${c.name} (${c.count})`).join(', ')}\n\nUser question: ${input}`;

    const response = await callClaude([{ role: 'user', content: context }],
        'You are an audience analytics expert for Pilgrim\'s Path, a virtual Hajj & Umrah VR platform. Analyze the provided audience data and answer the user\'s question with actionable insights.'
    );
    responseBox.textContent = response;
}

// Content Generator
function setContentType(type) {
    const prompts = {
        social: 'Write 5 Instagram/Facebook posts promoting our VR Hajj experience. Include emojis and hashtags.',
        email: 'Write an email campaign (subject + body) to re-engage users who signed up but haven\'t tried the VR experience yet.',
        ad: 'Write Facebook ad copy (headline, primary text, description) for our Hajj 2026 early-bird campaign targeting Muslim millennials.',
        blog: 'Create a detailed blog outline for "How Virtual Reality is Revolutionizing Hajj Preparation" — include sections, key points, and SEO keywords.',
        seo: 'Write SEO meta titles and descriptions for these pages: Homepage, VR Hajj Experience, Pricing, Blog. Keep under character limits.'
    };
    document.getElementById('contentPrompt').value = prompts[type] || '';
}

async function generateContent() {
    const input = document.getElementById('contentPrompt').value.trim();
    if (!input) return;

    const responseBox = document.getElementById('contentResponseBox');
    responseBox.innerHTML = '<div class="loading"><div class="spinner"></div> Generating content...</div>';

    const response = await callClaude([{ role: 'user', content: input }],
        'You are a content marketing expert specializing in Islamic travel and pilgrimage. Create compelling, culturally respectful content for Pilgrim\'s Path VR platform. Be creative and engaging.'
    );
    responseBox.textContent = response;
}

function copyContent() {
    const text = document.getElementById('contentResponseBox').textContent;
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
}

// ===== CALENDAR =====
function renderCalendar() {
    const el = document.getElementById('calendarGrid');
    const titleEl = document.getElementById('calendarTitle');
    if (!el) return;

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    titleEl.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const today = new Date();

    let html = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d =>
        `<div class="calendar-header-cell">${d}</div>`
    ).join('');

    // Previous month padding
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-cell other-month"></div>';
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = d === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
        const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const items = calendarItems.filter(i => i.date === dateStr);
        const dotHtml = items.length > 0 ? `<div class="calendar-dot ${items[0].type === 'social' ? 'gold' : items[0].type === 'email' ? 'blue' : 'green'}"></div>` : '';

        html += `<div class="calendar-cell ${isToday ? 'today' : ''}" onclick="selectCalendarDay('${dateStr}')">
            <span class="calendar-day">${d}</span>
            ${dotHtml}
        </div>`;
    }

    el.innerHTML = html;
}

function changeMonth(dir) {
    calendarMonth += dir;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendar();
}

function addCalendarItem() {
    const title = document.getElementById('calendarItemTitle').value.trim();
    const date = document.getElementById('calendarItemDate').value;
    const type = document.getElementById('calendarItemType').value;
    if (!title || !date) return;

    calendarItems.push({ title, date, type, id: Date.now() });
    localStorage.setItem('pp_calendar', JSON.stringify(calendarItems));
    renderCalendar();
    renderUpcoming();
    document.getElementById('calendarItemTitle').value = '';
    showToast('Content scheduled');
}

function renderUpcoming() {
    const el = document.getElementById('upcomingContent');
    if (!el) return;
    const upcoming = calendarItems
        .filter(i => i.date >= new Date().toISOString().split('T')[0])
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 10);

    if (upcoming.length === 0) {
        el.innerHTML = '<div class="empty-state"><i class="fas fa-calendar"></i><p>No upcoming content scheduled</p></div>';
        return;
    }

    const typeIcons = { social: 'fa-hashtag', email: 'fa-envelope', blog: 'fa-pen', ad: 'fa-bullhorn', video: 'fa-video' };
    el.innerHTML = upcoming.map(i => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
            <div style="width:28px;height:28px;border-radius:6px;background:var(--gold-glow);color:var(--gold);display:flex;align-items:center;justify-content:center;font-size:0.7rem"><i class="fas ${typeIcons[i.type] || 'fa-file'}"></i></div>
            <div style="flex:1">
                <div style="font-size:0.82rem;color:var(--text-primary)">${escapeHTML(i.title)}</div>
                <div style="font-size:0.7rem;color:var(--text-muted)">${i.date}</div>
            </div>
        </div>
    `).join('');
}

function selectCalendarDay(dateStr) {
    document.getElementById('calendarItemDate').value = dateStr;
}

async function generate30DayPlan() {
    const responseBox = document.getElementById('upcomingContent');
    responseBox.innerHTML = '<div class="loading" style="padding:20px"><div class="spinner"></div> AI generating 30-day content plan...</div>';

    const response = await callClaude([{
        role: 'user',
        content: 'Generate a 30-day content calendar for Pilgrim\'s Path VR platform starting from today. Include: social media posts (Instagram, Facebook), email campaigns, blog articles, and ad campaigns. Format each item as: DATE | TYPE | TITLE | DESCRIPTION. Focus on Hajj 2026 preparation, VR experience promotion, and user engagement.'
    }], 'You are a content calendar strategist for Pilgrim\'s Path. Create a practical, actionable 30-day content plan. Use ISO dates starting from today 2026-04-19.');

    // Parse response and add to calendar
    const lines = response.split('\n').filter(l => l.includes('|'));
    let added = 0;
    lines.forEach(line => {
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 3) {
            const dateMatch = parts[0].match(/\d{4}-\d{2}-\d{2}/);
            if (dateMatch) {
                const typeMap = { social: 'social', email: 'email', blog: 'blog', ad: 'ad', video: 'video' };
                const typeRaw = parts[1].toLowerCase();
                const type = Object.keys(typeMap).find(k => typeRaw.includes(k)) || 'social';
                calendarItems.push({
                    title: parts[2],
                    date: dateMatch[0],
                    type,
                    id: Date.now() + added
                });
                added++;
            }
        }
    });

    if (added > 0) {
        localStorage.setItem('pp_calendar', JSON.stringify(calendarItems));
        renderCalendar();
        showToast(`Added ${added} items to calendar`);
    }
    renderUpcoming();
}

// ===== A/B TESTING =====
function showNewTestForm() {
    document.getElementById('newTestForm').style.display = 'block';
}
function hideNewTestForm() {
    document.getElementById('newTestForm').style.display = 'none';
}

function createABTest() {
    const name = document.getElementById('testName').value.trim();
    const type = document.getElementById('testType').value;
    const varA = document.getElementById('variantA').value.trim();
    const varB = document.getElementById('variantB').value.trim();
    if (!name || !varA || !varB) return;

    const test = {
        id: Date.now(),
        name: `${type}: ${name}`,
        varA, varB,
        aConv: (Math.random() * 3 + 1).toFixed(1),
        bConv: (Math.random() * 3 + 1.5).toFixed(1),
        status: 'active',
        days: 0,
        traffic: 0
    };

    MOCK.abTests.push(test);
    populateABTests();
    hideNewTestForm();
    document.getElementById('testName').value = '';
    document.getElementById('variantA').value = '';
    document.getElementById('variantB').value = '';
    showToast('A/B test created');
}

// ===== CRM =====
function addCRMLead() {
    const name = prompt('Agency name:');
    if (!name) return;
    const value = prompt('Deal value (e.g. $5,990):') || '$5,990';
    MOCK.crmLeads.unshift({
        name, value, stage: 'lead',
        contact: 'New Contact',
        days: 0
    });
    populateCRMPipeline();
    showToast('Lead added to pipeline');
}

// ===== NOTIFICATIONS =====
function markAllRead() {
    document.querySelectorAll('.notif-item.unread').forEach(n => n.classList.remove('unread'));
    showToast('All notifications marked as read');
}

// ===== USER SEARCH & EXPORT =====
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            const filtered = MOCK.users.filter(u =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.country.toLowerCase().includes(q)
            );
            populateUsersTable(filtered);
        });
    }
});

function exportUsersCSV() {
    let csv = 'Name,Email,Plan,Country,Joined,Last Active,Status\n';
    MOCK.users.forEach(u => {
        csv += `"${u.name}","${u.email}","${u.plan}","${u.country}","${u.joined}","${u.lastActive}","${u.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pilgrimspath-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ===== UTILITY =====
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'var(--gold)',
        color: 'var(--bg-primary)',
        padding: '10px 20px',
        borderRadius: '8px',
        fontSize: '0.82rem',
        fontWeight: '600',
        zIndex: '9999',
        animation: 'fadeInModule 0.3s ease',
        fontFamily: 'DM Sans, sans-serif'
    });
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function setChartRange(range) {
    // Update active button
    event.target.parentElement.querySelectorAll('.btn').forEach(b => {
        b.style.borderColor = 'var(--border-light)';
        b.style.color = 'var(--text-secondary)';
    });
    event.target.style.borderColor = 'var(--gold-border)';
    event.target.style.color = 'var(--gold)';
    // In a live setup this would refetch data for the range
    showToast(`Showing ${range} data`);
}

function scheduleContent() {
    switchModule('calendar');
    showToast('Switch to calendar to schedule');
}

// ===== SIDEBAR TOGGLE =====
document.getElementById('sidebarToggle').addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open');
});

document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('adminSidebar');
    const toggle = document.getElementById('sidebarToggle');
    if (window.innerWidth <= 768 && sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) && !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
    }
});

// ===== GLOBAL SEARCH =====
document.getElementById('globalSearch').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    if (q.length < 2) return;

    // Simple: switch to matching module
    const moduleMap = {
        'user': 'users', 'lead': 'users', 'signup': 'users',
        'ai': 'ai-hub', 'campaign': 'ai-hub', 'marketing': 'ai-hub', 'claude': 'ai-hub',
        'test': 'ab-testing', 'a/b': 'ab-testing', 'experiment': 'ab-testing',
        'calendar': 'calendar', 'schedule': 'calendar', 'content plan': 'calendar',
        'article': 'content', 'vr': 'content', 'scene': 'content',
        'revenue': 'revenue', 'payment': 'revenue', 'subscription': 'revenue', 'donate': 'revenue',
        'agency': 'crm', 'crm': 'crm', 'pipeline': 'crm', 'partner': 'crm',
        'notification': 'notifications', 'alert': 'notifications',
        'setting': 'settings', 'integration': 'settings', 'config': 'settings'
    };

    for (const [keyword, module] of Object.entries(moduleMap)) {
        if (q.includes(keyword)) {
            switchModule(module);
            break;
        }
    }
});

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
    // Check if already authenticated
    checkAdminAuth();

    if (demoMode) {
        document.getElementById('demoToggle').classList.add('active');
        loadDemoData();
    } else {
        loadLiveData();
    }
});
