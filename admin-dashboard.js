/* =============================================
   Pilgrim's Path — Admin Dashboard JavaScript
   9-Module Dashboard with Claude AI Integration
   ============================================= */

// Auth is handled inline in admin.html to bypass SW cache

// ===== CONFIGURATION =====
const SUPABASE_URL = 'https://giftctxrqvlfekhzpcaa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZnRjdHhycXZsZmVraHpwY2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTg0NjQsImV4cCI6MjA4ODI5NDQ2NH0.Dm4tb6lvLMf9CDLo04qA9msYVLjBT-Web48pgk0BOYc';
const CLAUDE_PROXY = '/api/claude';

// LIVE mode is the default. Mock data has been removed; the dashboard now
// reads directly from Supabase. Sections without a real backing data source
// render an empty state instead of fake numbers.
let demoMode = false;
let currentModule = 'overview';
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();
let calendarItems = JSON.parse(localStorage.getItem('pp_calendar') || '[]');
let aiDrafts = JSON.parse(localStorage.getItem('pp_ai_drafts') || '[]');
let abTests = JSON.parse(localStorage.getItem('pp_ab_tests') || '[]');

// ===== LIVE DATA STORE =====
// Populated by Supabase queries. Each section that doesn't have a backing
// table will fall back to an empty state (no fake data).
const LIVE = {
    users: [],            // profiles table rows
    leads: 0,             // count of leads table rows
    vrSessions: null,     // no telemetry table yet → empty state
    revenue: null,        // no transactions table yet → empty state
    revenueHistory: [],   // requires transactions history
    months: [],
    trafficData: { labels: [], visitors: [], sessions: [], pageViews: [] },
    countries: [],        // aggregated from profiles.country
    transactions: [],
    crmLeads: [],
    abTests: JSON.parse(localStorage.getItem('pp_ab_tests') || '[]'),
    completedTests: [],
    notifications: [],    // derived from recent profiles + leads
    scenes: [],
    articles: [],
    audienceSegments: []
};

// Backwards-compat alias so any code that still references MOCK keeps working
// while pointing at the live store.
const MOCK = LIVE;

// Country code → flag emoji map (used by populateCountries when aggregating
// real users from Supabase profiles.country)
const COUNTRY_FLAGS = {
    US:'🇺🇸', GB:'🇬🇧', SA:'🇸🇦', NG:'🇳🇬', MY:'🇲🇾', PK:'🇵🇰', ID:'🇮🇩',
    CA:'🇨🇦', AE:'🇦🇪', TR:'🇹🇷', EG:'🇪🇬', IN:'🇮🇳', BD:'🇧🇩', DE:'🇩🇪',
    FR:'🇫🇷', AU:'🇦🇺', ZA:'🇿🇦', KE:'🇰🇪', MA:'🇲🇦', JO:'🇯🇴', QA:'🇶🇦',
    KW:'🇰🇼', BH:'🇧🇭', OM:'🇴🇲', LB:'🇱🇧', IQ:'🇮🇶', SY:'🇸🇾', YE:'🇾🇪'
};
const COUNTRY_NAMES = {
    US:'United States', GB:'United Kingdom', SA:'Saudi Arabia', NG:'Nigeria',
    MY:'Malaysia', PK:'Pakistan', ID:'Indonesia', CA:'Canada', AE:'UAE',
    TR:'Turkey', EG:'Egypt', IN:'India', BD:'Bangladesh', DE:'Germany',
    FR:'France', AU:'Australia', ZA:'South Africa', KE:'Kenya', MA:'Morocco',
    JO:'Jordan', QA:'Qatar', KW:'Kuwait', BH:'Bahrain', OM:'Oman',
    LB:'Lebanon', IQ:'Iraq', SY:'Syria', YE:'Yemen'
};

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
        case 'journey-content': if(window.PPJourneyContent&&window.PPJourneyContent.mount)window.PPJourneyContent.mount(); break;
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
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'count=exact'
            }
        });
        if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
        const range = res.headers.get('content-range') || '';
        const totalCount = parseInt(range.split('/')[1], 10);
        const rows = await res.json();
        if (Array.isArray(rows)) rows._count = isNaN(totalCount) ? rows.length : totalCount;
        return rows;
    } catch (e) {
        console.warn('[Supabase] fetch failed:', table, e.message);
        return null;
    }
}

// Map a Supabase profile row → admin-table user shape
function profileToUser(p){
    const first = (p.first_name||'').trim();
    const last  = (p.last_name||'').trim();
    const name  = (p.display_name||'').trim() || `${first} ${last}`.trim() || (p.email||'').split('@')[0] || 'User';
    const joined = (p.created_at||'').split('T')[0] || '';
    let lastActive = '—';
    let status = 'inactive';
    if(p.last_sign_in_at){
        const days = Math.floor((Date.now() - new Date(p.last_sign_in_at).getTime())/86400000);
        lastActive = days === 0 ? 'Today' : days + 'd ago';
        status = days < 7 ? 'active' : days < 30 ? 'inactive' : 'churned';
    }
    return {
        name, email: p.email||'',
        country: p.country||'',
        plan: p.plan||'Free',
        joined, lastActive, status
    };
}

async function loadLiveData() {
    // 0. Restore admin-created data persisted in localStorage
    try {
        const savedTests = localStorage.getItem('pp_ab_tests');
        if(savedTests) LIVE.abTests = JSON.parse(savedTests);
        const savedLeads = localStorage.getItem('pp_crm_leads');
        if(savedLeads) LIVE.crmLeads = JSON.parse(savedLeads);
    } catch(e) { console.warn('localStorage restore failed', e); }

    // 1. Profiles → users
    const profiles = await supabaseFetch('profiles', '?select=*&order=created_at.desc&limit=500');
    LIVE.users = (profiles || []).map(profileToUser);

    // 2. Leads count
    const leads = await supabaseFetch('leads', '?select=id&limit=1');
    LIVE.leads = (leads && typeof leads._count === 'number') ? leads._count : (leads ? leads.length : 0);

    // 3. Aggregate countries from profiles
    const countryCounts = {};
    LIVE.users.forEach(u => { if(u.country) countryCounts[u.country] = (countryCounts[u.country]||0)+1; });
    LIVE.countries = Object.entries(countryCounts)
        .sort((a,b)=>b[1]-a[1])
        .slice(0,10)
        .map(([code,count]) => ({
            code,
            flag: COUNTRY_FLAGS[code] || '🌍',
            name: COUNTRY_NAMES[code] || code,
            count
        }));

    // 4. Recent activity = recent signups + recent leads
    const recentLeads = await supabaseFetch('leads', '?select=email,created_at,source&order=created_at.desc&limit=5');
    LIVE.notifications = [];
    LIVE.users.slice(0,5).forEach(u => {
        LIVE.notifications.push({
            icon:'fa-user-plus', cls:'gold',
            text:`<strong>${escapeHTML(u.name)}</strong> joined Pilgrim's Path`,
            time: timeAgo(u.joined), unread:false
        });
    });
    (recentLeads||[]).forEach(l => {
        LIVE.notifications.push({
            icon:'fa-envelope', cls:'blue',
            text:`<strong>${escapeHTML(l.email)}</strong> signed up via ${escapeHTML(l.source||'site')}`,
            time: timeAgo(l.created_at), unread:false
        });
    });
    LIVE.notifications.sort((a,b)=> a.time.localeCompare(b.time));

    // 5. Render everything
    renderLiveStats();
    populateUsersTable(LIVE.users);
    populateCountries(LIVE.countries);
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

function renderLiveStats(){
    setStat('statTotalUsers', LIVE.users.length);
    setStat('statUsersTrend', '—');
    setStat('statVRSessions', LIVE.vrSessions==null ? '—' : LIVE.vrSessions);
    setStat('statVRTrend', '—');
    setStat('statRevenue', LIVE.revenue==null ? '—' : ('$'+LIVE.revenue.toLocaleString()));
    setStat('statRevTrend', '—');
    setStat('statLeads', LIVE.leads);
    setStat('statLeadsTrend', '—');

    // Per-tab user metrics
    const newThisWeek = LIVE.users.filter(u => {
        if(!u.joined) return false;
        return (Date.now() - new Date(u.joined).getTime()) < 7*86400000;
    }).length;
    setStat('usersNewWeek', newThisWeek);
    setStat('usersActive30', LIVE.users.filter(u => u.status === 'active').length);
    setStat('usersPremium', LIVE.users.filter(u => u.plan === 'Individual').length);
    setStat('usersAgency', LIVE.users.filter(u => u.plan === 'Agency').length);
}

function setStat(id, val){
    const el = document.getElementById(id); if(!el) return;
    if(typeof val === 'number') el.textContent = val.toLocaleString();
    else el.textContent = val;
}

function timeAgo(iso){
    if(!iso) return '';
    const d = new Date(iso); if(isNaN(d)) return '';
    const s = Math.floor((Date.now()-d.getTime())/1000);
    if(s<60) return 'just now';
    if(s<3600) return Math.floor(s/60)+'m ago';
    if(s<86400) return Math.floor(s/3600)+'h ago';
    if(s<2592000) return Math.floor(s/86400)+'d ago';
    return d.toISOString().split('T')[0];
}

function loadDemoData() {
    // Demo mode is no longer the default. This shim keeps the function name
    // working for any legacy callers, but routes everything through the live
    // loader so the dashboard never displays fabricated numbers.
    return loadLiveData();
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
    const td = LIVE.trafficData || { labels: [], visitors: [], sessions: [] };
    if(!td.labels || td.labels.length === 0){
        const wrap = ctx1.parentElement; if(wrap) wrap.innerHTML = '<div style="padding:48px;text-align:center;color:var(--text-muted);font-size:0.82rem"><i class="fas fa-chart-line" style="font-size:2rem;display:block;margin-bottom:10px;opacity:.5"></i>Traffic analytics not connected. Integrate Vercel Analytics or Google Analytics to see daily traffic here.</div>';
    } else {
        charts.traffic = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: td.labels,
                datasets: [
                    { label: 'Visitors', data: td.visitors, borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.1)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 },
                    { label: 'Sessions', data: td.sessions, borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 }
                ]
            },
            options: { ...chartDefaults, interaction: { intersect: false, mode: 'index' } }
        });
    }

    // Funnel Chart — only render when we have any of: leads, users
    const ctx2 = document.getElementById('funnelChart');
    if (!ctx2) return;
    destroyChart('funnel');
    const totalUsers = LIVE.users.length;
    const totalLeads = LIVE.leads || 0;
    if(totalUsers === 0 && totalLeads === 0){
        const wrap = ctx2.parentElement; if(wrap) wrap.innerHTML = '<div style="padding:48px;text-align:center;color:var(--text-muted);font-size:0.82rem"><i class="fas fa-funnel-dollar" style="font-size:2rem;display:block;margin-bottom:10px;opacity:.5"></i>Conversion funnel will populate once leads and users start coming in.</div>';
        return;
    }
    const paid = LIVE.users.filter(u => u.plan==='Individual').length;
    const agency = LIVE.users.filter(u => u.plan==='Agency').length;
    const free = LIVE.users.filter(u => u.plan==='Free').length;
    charts.funnel = new Chart(ctx2, {
        type: 'bar',
        data: {
            labels: ['Email Leads', 'All Users', 'Free Users', 'Paid Users', 'Agency'],
            datasets: [{
                data: [totalLeads, totalUsers, free, paid, agency],
                backgroundColor: ['#3B82F6', '#C9A84C', '#10B981', '#8B5CF6', '#F59E0B'],
                borderRadius: 6,
                borderSkipped: false
            }]
        },
        options: { ...chartDefaults, indexAxis: 'y', plugins: { ...chartDefaults.plugins, legend: { display: false } } }
    });
}

function initAICharts() {
    // Campaign performance — no real ad-platform integration yet, show empty state
    const ctx1 = document.getElementById('campaignChart');
    if (ctx1 && !charts.campaign) {
        const wrap = ctx1.parentElement;
        if(wrap) wrap.innerHTML = '<div style="padding:48px;text-align:center;color:var(--text-muted);font-size:0.82rem"><i class="fas fa-bullhorn" style="font-size:2rem;display:block;margin-bottom:10px;opacity:.5"></i>Campaign metrics require a Meta/Google Ads API integration. Use the AI prompts above to draft campaigns now.</div>';
    }
    const ctx2 = document.getElementById('spendRevenueChart');
    if (ctx2 && !charts.spendRevenue) {
        const wrap = ctx2.parentElement;
        if(wrap) wrap.innerHTML = '<div style="padding:48px;text-align:center;color:var(--text-muted);font-size:0.82rem"><i class="fas fa-chart-area" style="font-size:2rem;display:block;margin-bottom:10px;opacity:.5"></i>Spend vs revenue will appear once ad-spend data and the <code>transactions</code> table are connected.</div>';
    }
}

function initContentCharts() {
    const ctx = document.getElementById('sceneChart');
    if (!ctx) return;
    destroyChart('scene');
    const scenes = LIVE.scenes || [];
    if(scenes.length === 0){
        const wrap = ctx.parentElement; if(wrap) wrap.innerHTML = '<div style="padding:48px;text-align:center;color:var(--text-muted);font-size:0.82rem"><i class="fas fa-vr-cardboard" style="font-size:2rem;display:block;margin-bottom:10px;opacity:.5"></i>VR scene analytics will appear once journey telemetry is connected.</div>';
        return;
    }
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
        const history = LIVE.revenueHistory || [];
        if(history.length === 0){
            const wrap = ctx1.parentElement; if(wrap) wrap.innerHTML = '<div style="padding:48px;text-align:center;color:var(--text-muted);font-size:0.82rem"><i class="fas fa-chart-line" style="font-size:2rem;display:block;margin-bottom:10px;opacity:.5"></i>Revenue chart will populate once a Supabase <code>transactions</code> table is added and Paystack webhooks log payments.</div>';
        } else {
            charts.revenue = new Chart(ctx1, {
                type: 'line',
                data: { labels: LIVE.months, datasets: [{ label: 'Revenue ($)', data: history, borderColor: '#C9A84C', backgroundColor: 'rgba(201,168,76,0.15)', fill: true, tension: 0.4, borderWidth: 2, pointBackgroundColor: '#C9A84C' }] },
                options: { ...chartDefaults, plugins: { ...chartDefaults.plugins, legend: { display: false } } }
            });
        }
    }

    const ctx2 = document.getElementById('planChart');
    if (ctx2) {
        destroyChart('plan');
        const free = LIVE.users.filter(u=>u.plan==='Free').length;
        const ind  = LIVE.users.filter(u=>u.plan==='Individual').length;
        const agy  = LIVE.users.filter(u=>u.plan==='Agency').length;
        if(free+ind+agy === 0){
            const wrap = ctx2.parentElement; if(wrap) wrap.innerHTML = '<div style="padding:48px;text-align:center;color:var(--text-muted);font-size:0.82rem"><i class="fas fa-chart-pie" style="font-size:2rem;display:block;margin-bottom:10px;opacity:.5"></i>Plan distribution will appear once users are signing up.</div>';
        } else {
            charts.plan = new Chart(ctx2, {
                type: 'doughnut',
                data: { labels: ['Free', 'Individual ($19/yr)', 'Agency ($999/yr)'], datasets: [{ data: [free, ind, agy], backgroundColor: ['#5A6478', '#C9A84C', '#8B5CF6'], borderColor: '#1A1F35', borderWidth: 3 }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#8B95A8', font: { family: 'DM Sans', size: 11 }, padding: 16 } } } }
            });
        }
    }
}

// ===== POPULATE FUNCTIONS =====
function populateUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    if(!users || users.length === 0){
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted)"><i class="fas fa-users" style="font-size:1.6rem;display:block;margin-bottom:8px;opacity:.5"></i>No users yet — once people sign up they will appear here.</td></tr>';
        return;
    }
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
    if(!countries || countries.length === 0){
        el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.82rem"><i class="fas fa-globe" style="display:block;margin-bottom:6px;opacity:.5"></i>No country data yet</div>';
        return;
    }
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
    const activities = (LIVE.notifications || []).slice(0,8).map(n => ({
        dot: n.cls || 'gold', text: n.text, time: n.time
    }));
    if(activities.length === 0){
        el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.82rem"><i class="fas fa-bell-slash" style="display:block;margin-bottom:6px;opacity:.5"></i>No recent activity yet</div>';
        return;
    }
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
    const articles = LIVE.articles || [];
    if(articles.length === 0){
        el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:0.82rem"><i class="fas fa-newspaper" style="display:block;margin-bottom:6px;opacity:.5"></i>Article analytics will appear here once page-view tracking is connected.</div>';
        return;
    }
    el.innerHTML = articles.map((a, i) => `
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
    const tests = LIVE.abTests || [];
    if(tests.length === 0){
        el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-muted);font-size:0.82rem;background:var(--bg-input);border-radius:10px"><i class="fas fa-flask" style="font-size:1.6rem;display:block;margin-bottom:8px;opacity:.5"></i>No active A/B tests. Create your first test using the form above.</div>';
        return;
    }
    el.innerHTML = tests.map(t => {
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
    const done = LIVE.completedTests || [];
    if(done.length === 0){
        el.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted)">No completed tests yet.</td></tr>';
        return;
    }
    el.innerHTML = done.map(t => `
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
    const list = LIVE.notifications || [];
    if(list.length === 0){
        el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-muted);font-size:0.82rem"><i class="fas fa-bell-slash" style="font-size:1.6rem;display:block;margin-bottom:8px;opacity:.5"></i>You\'re all caught up. New signups and donations will show here.</div>';
        return;
    }
    el.innerHTML = list.map(n => `
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
    const allLeads = LIVE.crmLeads || [];
    if(allLeads.length === 0){
        el.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-muted);background:var(--bg-input);border-radius:12px"><i class="fas fa-handshake" style="font-size:2rem;display:block;margin-bottom:10px;opacity:.5"></i><strong>No agency leads yet</strong><p style="margin-top:6px;font-size:0.82rem">Use “Add Lead” to start your B2B pipeline. Leads are stored locally in this browser until a CRM table is added to Supabase.</p></div>';
        return;
    }

    el.innerHTML = stages.map(stage => {
        const leads = allLeads.filter(l => l.stage === stage.id);
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
    const segs = LIVE.audienceSegments || [];
    if(segs.length === 0){
        el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:0.82rem"><i class="fas fa-users" style="font-size:1.4rem;display:block;margin-bottom:8px;opacity:.5"></i>Audience segments require behavioural analytics. Use the “Audience Intelligence” AI prompt to analyse your real users.</div>';
        return;
    }
    el.innerHTML = segs.map(s => `
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
    const txs = LIVE.transactions || [];
    if(txs.length === 0){
        el.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-muted)"><i class="fas fa-receipt" style="font-size:1.6rem;display:block;margin-bottom:8px;opacity:.5"></i>No transactions yet. Connect Paystack webhooks to a Supabase <code>transactions</code> table to populate this view.</td></tr>';
        return;
    }
    el.innerHTML = txs.map(t => `
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

    const segLines = (LIVE.audienceSegments||[]).map(s => `- ${s.name}: ${s.size} of users, ${s.desc}, Engagement: ${s.engagement}`).join('\n') || '- (no segment data — use overall stats)';
    const countryLines = (LIVE.countries||[]).map(c => `${c.name} (${c.count})`).join(', ') || '(no country data yet)';
    const context = `Real platform data:\nUsers: ${LIVE.users.length}\nLeads: ${LIVE.leads}\n\nSegments:\n${segLines}\n\nTop countries: ${countryLines}\n\nUser question: ${input}`;

    const response = await callClaude([{ role: 'user', content: context }],
        'You are an audience analytics expert for Pilgrim\'s Path, a virtual Hajj & Umrah VR platform. Analyze the provided real audience data and answer the user\'s question with actionable insights.'
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
        aConv: 0,
        bConv: 0,
        status: 'active',
        days: 0,
        traffic: 0
    };

    LIVE.abTests.push(test);
    localStorage.setItem('pp_ab_tests', JSON.stringify(LIVE.abTests));
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
    LIVE.crmLeads.unshift({
        name, value, stage: 'lead',
        contact: 'New Contact',
        days: 0
    });
    localStorage.setItem('pp_crm_leads', JSON.stringify(LIVE.crmLeads));
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
            const filtered = LIVE.users.filter(u =>
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                (u.country||'').toLowerCase().includes(q)
            );
            populateUsersTable(filtered);
        });
    }
});

function exportUsersCSV() {
    let csv = 'Name,Email,Plan,Country,Joined,Last Active,Status\n';
    LIVE.users.forEach(u => {
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
    // Always load LIVE data on first paint. The demo toggle (if still in the
    // DOM) just re-runs the live loader; mock data has been removed.
    const toggle = document.getElementById('demoToggle');
    if(toggle) toggle.classList.remove('active');
    loadLiveData();
});
