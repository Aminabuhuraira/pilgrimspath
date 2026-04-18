/**
 * Pilgrim's Path — Inline Lead Capture
 * Injects an email capture CTA box into articles (before footer)
 * and handles lead storage to Supabase.
 * 
 * Include on any page: <script src="lead-capture.js" defer></script>
 */
(function() {
    'use strict';

    // Skip if already captured
    if (localStorage.getItem('pp_lead_email')) return;

    // Supabase config (public anon key — safe for frontend)
    var SB_URL = 'https://giftctxrqvlfekhzpcaa.supabase.co';
    var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpZnRjdHhycXZsZmVraHpwY2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTg0NjQsImV4cCI6MjA4ODI5NDQ2NH0.Dm4tb6lvLMf9CDLo04qA9msYVLjBT-Web48pgk0BOYc';

    // Don't show on login/register/dashboard pages
    var skip = ['/login.html', '/dashboard.html', '/admin.html'];
    if (skip.some(function(p) { return location.pathname.indexOf(p) !== -1; })) return;

    // Check if user is already logged in
    if (window.supabase) {
        try {
            var sb = window.supabase.createClient(SB_URL, SB_KEY);
            sb.auth.getUser().then(function(res) {
                if (res.data && res.data.user) {
                    localStorage.setItem('pp_lead_email', res.data.user.email);
                    return; // Already logged in, don't show CTA
                }
                injectCTA();
            }).catch(function() { injectCTA(); });
        } catch(e) { injectCTA(); }
    } else {
        injectCTA();
    }

    function injectCTA() {
        var footer = document.querySelector('footer.footer');
        if (!footer) return;

        var box = document.createElement('section');
        box.id = 'leadCaptureBox';
        box.innerHTML = 
            '<div style="max-width:680px;margin:0 auto;background:linear-gradient(135deg,#FFFEF7,#FDF6E3);border:2px solid rgba(201,162,39,0.2);border-radius:20px;padding:40px 32px;text-align:center;">' +
                '<div style="font-size:2rem;margin-bottom:12px;">🕋</div>' +
                '<h3 style="font-family:\'Playfair Display\',serif;font-size:1.4rem;margin-bottom:8px;color:#2A2A3C;">Walk the Sacred Sites Before You Go</h3>' +
                '<p style="color:#666;font-size:0.9rem;margin-bottom:20px;line-height:1.7;">Get a free 360° VR preview of Makkah\'s sacred sites + a Hajj preparation checklist sent to your inbox.</p>' +
                '<form id="inlineLeadForm" onsubmit="window.__captureLead(event)" style="display:flex;gap:10px;max-width:420px;margin:0 auto;flex-wrap:wrap;">' +
                    '<input type="email" id="inlineLeadEmail" required placeholder="your@email.com" style="flex:1;min-width:200px;padding:14px 18px;border:2px solid #e0e0e0;border-radius:12px;font-size:0.95rem;font-family:\'Poppins\',sans-serif;outline:none;">' +
                    '<button type="submit" id="inlineLeadBtn" style="padding:14px 24px;border:none;border-radius:12px;background:linear-gradient(135deg,#C9A227,#8B7355);color:white;font-family:\'Poppins\',sans-serif;font-size:0.9rem;font-weight:600;cursor:pointer;white-space:nowrap;">Get Free Preview</button>' +
                '</form>' +
                '<p style="font-size:0.7rem;color:#bbb;margin-top:12px;">No spam · Unsubscribe anytime</p>' +
            '</div>';
        box.style.padding = '0 20px 60px';

        footer.parentNode.insertBefore(box, footer);
    }

    window.__captureLead = function(e) {
        e.preventDefault();
        var email = document.getElementById('inlineLeadEmail').value.trim();
        var btn = document.getElementById('inlineLeadBtn');
        if (!email) return;

        btn.textContent = 'Sending...';
        btn.disabled = true;

        // Store in Supabase
        try {
            var sb = window.supabase.createClient(SB_URL, SB_KEY);
            sb.from('leads').insert({
                email: email,
                source: 'article-cta',
                page: window.location.pathname,
                created_at: new Date().toISOString()
            }).then(function() {}).catch(function() {});
        } catch(e) {}

        // Store locally
        localStorage.setItem('pp_lead_email', email);

        // Fire Meta events
        if (typeof MetaCAPI !== 'undefined') {
            MetaCAPI.lead({ content_name: 'Article CTA', content_category: 'Lead Capture' }, { em: email });
        }
        if (typeof fbq !== 'undefined') {
            fbq('track', 'Lead', { content_name: 'Article CTA' });
        }

        // Show success
        var box = document.getElementById('leadCaptureBox');
        if (box) {
            box.innerHTML = 
                '<div style="max-width:680px;margin:0 auto;background:linear-gradient(135deg,#FFFEF7,#FDF6E3);border:2px solid rgba(201,162,39,0.3);border-radius:20px;padding:40px 32px;text-align:center;">' +
                    '<div style="font-size:2rem;margin-bottom:12px;">✅</div>' +
                    '<h3 style="font-family:\'Playfair Display\',serif;font-size:1.4rem;margin-bottom:8px;color:#2A2A3C;">Check Your Inbox!</h3>' +
                    '<p style="color:#666;font-size:0.9rem;margin-bottom:20px;">Your free VR preview link is on its way.</p>' +
                    '<a href="hajj-vr.html" style="display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:12px;background:linear-gradient(135deg,#C9A227,#8B7355);color:white;text-decoration:none;font-weight:600;font-family:\'Poppins\',sans-serif;">Start VR Preview Now <i class="fas fa-arrow-right"></i></a>' +
                '</div>';
        }
    };
})();
