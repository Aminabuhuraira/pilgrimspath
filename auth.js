// ===================================
// Pilgrim's Path — Supabase Auth Module
// ===================================

// Supabase project credentials (public — safe for frontend)
const SUPABASE_URL = 'https://giftctxrqvlfekhzpcaa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZnRjdHhycXZsZmVraHpwY2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTg0NjQsImV4cCI6MjA4ODI5NDQ2NH0.Dm4tb6lvLMf9CDLo04qA9msYVLjBT-Web48pgk0BOYc';

// ===== SESSION PERSISTENCE (powers the "Remember me" checkbox) =====
// We use a custom storage proxy so we can swap between localStorage (persistent)
// and sessionStorage (tab-only) BEFORE the session is written by Supabase.
// The decision is made at login time via setSessionPersistence(); returning
// users keep their previous preference stored in localStorage under pp_remember_me.
const _sessionPref = {
    persistent: localStorage.getItem('pp_remember_me') !== '0'  // default: persist
};

const _sbStorage = {
    getItem(key) {
        // Check sessionStorage first (non-persistent session), then localStorage.
        const ss = window.sessionStorage.getItem(key);
        return ss !== null ? ss : window.localStorage.getItem(key);
    },
    setItem(key, value) {
        if (_sessionPref.persistent) {
            window.localStorage.setItem(key, value);
            window.sessionStorage.removeItem(key); // clean up old non-persistent token
        } else {
            window.sessionStorage.setItem(key, value);
            window.localStorage.removeItem(key); // don't persist across browser restarts
        }
    },
    removeItem(key) {
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
    }
};

/**
 * Call this BEFORE signIn() to set whether the session should survive
 * a browser restart. The login form calls this based on the checkbox.
 */
function setSessionPersistence(persist) {
    _sessionPref.persistent = !!persist;
    localStorage.setItem('pp_remember_me', persist ? '1' : '0');
}

// Initialize Supabase client with the custom storage adapter.
// NOTE: the CDN UMD bundle declares `var supabase` globally, so we use a
// different name here to avoid a SyntaxError from redeclaring with const.
const _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: _sbStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

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

    // Best-effort: save profile to profiles table for admin dashboard
    if (data.user) upsertProfile(data.user);

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

    // Best-effort: update profile for admin dashboard
    if (data.user) upsertProfile(data.user);

    return data;
}

/**
 * Sign out the current user
 */
async function signOut() {
    const { error } = await _sb.auth.signOut();
    if (error) throw error;
    window.location.href = '/';
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
 * Resolve a live session that is safe to use for server-side verification.
 * Trusts the locally-stored Supabase JWT (which is self-verifying). Only
 * makes a network call when the token is expired or expiring within 5 minutes.
 */
async function getVerifiedSession() {
    try {
        let session = await getSession();
        if (!session || !session.access_token) return null;

        // Proactively refresh if expiring within 5 minutes
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
        if (!expiresAt || Date.now() > expiresAt - 300_000) {
            try {
                const { data } = await _sb.auth.refreshSession();
                if (data && data.session && data.session.access_token) {
                    session = data.session;
                }
            } catch (_) { /* non-fatal — use existing token */ }
        }

        return session && session.access_token ? session : null;
    } catch (e) {
        return null;
    }
}

/**
 * Send password reset email
 */
async function resetPassword(email) {
    const { data, error } = await _sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login'
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
            redirectTo: window.location.origin + '/dashboard'
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
 * Upsert user profile into the profiles table (best-effort, silent fail).
 * Called after sign-in / sign-up so the admin dashboard always has data
 * even before the SQL trigger is set up.
 */
async function upsertProfile(user) {
    if (!user) return;
    try {
        const meta = user.user_metadata || {};
        await _sb.from('profiles').upsert({
            id: user.id,
            email: user.email,
            first_name: meta.first_name || '',
            last_name: meta.last_name || '',
            display_name: meta.display_name || '',
            country: meta.country || '',
            avatar_url: meta.avatar_url || '',
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    } catch(e) {
        // Profiles table may not exist yet — that's fine
    }
}

/**
 * Record a verified payment for admin reporting.
 * Best-effort only so checkout never fails because analytics storage is down.
 */
async function recordTransaction(transaction = {}) {
    const reference = (transaction.reference || '').trim();
    if (!reference) throw new Error('Payment reference is required');

    const user = await getCurrentUser().catch(() => null);
    const payload = {
        reference,
        email: (transaction.email || user?.email || '').trim(),
        amount: Number(transaction.amount || 0),
        currency: (transaction.currency || 'USD').trim().toUpperCase(),
        status: (transaction.status || 'completed').trim().toLowerCase(),
        type: (transaction.type || 'purchase').trim().toLowerCase(),
        plan: (transaction.plan || '').trim(),
        source: (transaction.source || '').trim(),
        provider: (transaction.provider || 'paystack').trim().toLowerCase(),
        paid_at: transaction.paidAt || new Date().toISOString(),
        user_id: user?.id || null,
        metadata: transaction.metadata || {}
    };

    if (!payload.email) throw new Error('Payment email is required');
    if (!Number.isFinite(payload.amount) || payload.amount <= 0) throw new Error('Payment amount is invalid');

    const { data, error } = await _sb.from('transactions').insert(payload).select().maybeSingle();
    if (error && !/duplicate key|unique/i.test(error.message || '')) throw error;
    return data || payload;
}

/**
 * Grant the server-side pp_access VR cookie using the current Supabase
 * session. Idempotent and safe to call multiple times. Resolves true on
 * success, false otherwise. Awaiting this BEFORE navigating to /journey/*
 * prevents the requireVrAccess → /login loop.
 */
async function ppGrantVrAccess(sessionOrToken) {
    try {
        // Resolve a session. If caller passed a session OBJECT, check whether
        // its access_token has expired and refresh if so — otherwise the
        // server's Supabase verification rejects the stale Bearer with 401
        // and the cookie never lands, sending the user into the /login loop.
        let session;
        if (typeof sessionOrToken === 'string') {
            session = { access_token: sessionOrToken };
        } else if (sessionOrToken && sessionOrToken.access_token) {
            const expMs = sessionOrToken.expires_at ? sessionOrToken.expires_at * 1000 : 0;
            const stale = !expMs || Date.now() > expMs - 60_000; // within 60s of expiry
            session = stale ? await getVerifiedSession() : sessionOrToken;
        } else {
            session = await getVerifiedSession();
        }
        if (!session || !session.access_token) return false;

        const r = await fetch('/api/grant-vr-access', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Authorization': 'Bearer ' + session.access_token }
        });
        if (r.ok) return true;

        // If the server rejected the token (401), try ONCE more with a
        // freshly-refreshed session. This handles the edge case where the
        // token expired between getVerifiedSession() and the fetch.
        if (r.status === 401 && typeof sessionOrToken !== 'string') {
            const fresh = await getVerifiedSession();
            if (fresh && fresh.access_token && fresh.access_token !== session.access_token) {
                const r2 = await fetch('/api/grant-vr-access', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Authorization': 'Bearer ' + fresh.access_token }
                });
                return r2.ok;
            }
        }
        return false;
    } catch (e) { return false; }
}
if (typeof window !== 'undefined') window.ppGrantVrAccess = ppGrantVrAccess;

/**
 * Require authentication — redirects to login if not signed in.
 * Call this at the top of protected pages (e.g. dashboard).
 */
async function requireAuth() {
    const session = await getVerifiedSession();
    if (!session) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = '/login?next=' + next;
        return null;
    }
    return session.user;
}

/**
 * Redirect away from login/register if already authenticated
 */
async function redirectIfLoggedIn(destination = '/dashboard') {
    const session = await getVerifiedSession();
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
            <a href="/dashboard" class="nav-user-btn" title="Go to Dashboard">
                <span class="nav-user-avatar">${initials}</span>
                <span class="nav-user-name">${name.split(' ')[0]}</span>
            </a>
        `;
    }

    // Also update mobile menu
    const mobileCta = document.querySelector('.mobile-cta');
    if (user && mobileCta) {
        mobileCta.textContent = 'My Dashboard';
        mobileCta.href = '/dashboard';
    }
}
