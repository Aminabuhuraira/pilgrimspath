// ===================================
// Pilgrim's Path — Supabase Auth Module
// ===================================

// Supabase project credentials (public — safe for frontend)
const SUPABASE_URL = 'https://giftctxrqvlfekhzpcaa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZnRjdHhycXZsZmVraHpwY2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTg0NjQsImV4cCI6MjA4ODI5NDQ2NH0.Dm4tb6lvLMf9CDLo04qA9msYVLjBT-Web48pgk0BOYc';

// Initialize Supabase client
// NOTE: the CDN UMD bundle declares `var supabase` globally, so we use a
// different name here to avoid a SyntaxError from redeclaring with const.
const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== AUTH FUNCTIONS =====

/**
 * Register a new user with email/password + profile metadata
 */
async function signUp(email, password, metadata = {}) {
    const { data, error } = await _sb.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: metadata.firstName || '',
                last_name: metadata.lastName || '',
                country: metadata.country || '',
                display_name: `${metadata.firstName || ''} ${metadata.lastName || ''}`.trim()
            }
        }
    });

    if (error) throw error;
    return data;
}

/**
 * Sign in with email/password
 */
async function signIn(email, password) {
    const { data, error } = await _sb.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
}

/**
 * Sign out the current user
 */
async function signOut() {
    const { error } = await _sb.auth.signOut();
    if (error) throw error;
    window.location.href = 'index.html';
}

/**
 * Get the currently logged-in user (null if not logged in)
 */
async function getCurrentUser() {
    const { data: { user } } = await _sb.auth.getUser();
    return user;
}

/**
 * Get the current session
 */
async function getSession() {
    const { data: { session } } = await _sb.auth.getSession();
    return session;
}

/**
 * Send password reset email
 */
async function resetPassword(email) {
    const { data, error } = await _sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login.html'
    });

    if (error) throw error;
    return data;
}

/**
 * Sign in with Google OAuth
 */
async function signInWithGoogle() {
    const { data, error } = await _sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/dashboard.html'
        }
    });

    if (error) throw error;
    return data;
}

// ===== AUTH STATE HELPERS =====

/**
 * Listen for auth state changes (login, logout, token refresh)
 */
function onAuthStateChange(callback) {
    _sb.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

/**
 * Expose the Supabase client for admin/advanced use
 */
function getSupabaseClient() {
    return _sb;
}

/**
 * Require authentication — redirects to login if not signed in.
 * Call this at the top of protected pages (e.g. dashboard).
 */
async function requireAuth() {
    const session = await getSession();
    if (!session) {
        // Save where they wanted to go
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'login.html';
        return null;
    }
    return session.user;
}

/**
 * Redirect away from login/register if already authenticated
 */
async function redirectIfLoggedIn(destination = 'dashboard.html') {
    const session = await getSession();
    if (session) {
        window.location.href = destination;
    }
}

/**
 * Get user display name from metadata
 */
function getUserDisplayName(user) {
    if (!user) return 'Pilgrim';
    const meta = user.user_metadata || {};
    if (meta.display_name) return meta.display_name;
    if (meta.first_name) return `${meta.first_name} ${meta.last_name || ''}`.trim();
    return user.email?.split('@')[0] || 'Pilgrim';
}

/**
 * Get user initials for avatar
 */
function getUserInitials(user) {
    if (!user) return 'PP';
    const meta = user.user_metadata || {};
    const first = (meta.first_name || user.email || 'P')[0].toUpperCase();
    const last = (meta.last_name || '')[0]?.toUpperCase() || '';
    return first + last || 'PP';
}

/**
 * Update navbar UI based on auth state — call on any page with a navbar.
 * Replaces "Start Free Journey" CTA with user avatar when logged in.
 */
async function updateNavForAuth() {
    const user = await getCurrentUser();
    const navCta = document.querySelector('.nav-cta');
    
    if (user && navCta) {
        const name = getUserDisplayName(user);
        const initials = getUserInitials(user);
        
        navCta.outerHTML = `
            <a href="dashboard.html" class="nav-user-btn" title="Go to Dashboard">
                <span class="nav-user-avatar">${initials}</span>
                <span class="nav-user-name">${name.split(' ')[0]}</span>
            </a>
        `;
    }

    // Also update mobile menu
    const mobileCta = document.querySelector('.mobile-cta');
    if (user && mobileCta) {
        mobileCta.textContent = 'My Dashboard';
        mobileCta.href = 'dashboard.html';
    }
}
