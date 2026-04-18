/**
 * Meta Conversions API — Client-side helper for Pilgrim's Path
 * 
 * Works alongside the browser pixel (fbq) for redundant event tracking.
 * Sends events to /capi/event which proxies them to Meta's Graph API.
 * Uses matching event_id for deduplication between pixel + CAPI.
 *
 * Usage:
 *   MetaCAPI.lead({ content_name: 'Contact Form' });
 *   MetaCAPI.completeRegistration({}, { em: 'user@example.com', fn: 'Ahmed' });
 *   MetaCAPI.trackEvent('CustomEvent', { key: 'value' });
 */
(function () {
    'use strict';

    var ENDPOINT = '/api/capi-event';

    // ── Helpers ─────────────────────────────────────────────────

    function getCookie(name) {
        var m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
        return m ? decodeURIComponent(m[1]) : null;
    }

    function eventId() {
        return 'eid.' + Date.now() + '.' + Math.random().toString(36).substring(2, 11);
    }

    // ── Core send function ──────────────────────────────────────

    function send(eventName, customData, userData) {
        var eid = eventId();
        customData = customData || {};
        userData = userData || {};

        // 1) Fire browser pixel with same event_id for dedup
        if (typeof fbq !== 'undefined') {
            try {
                fbq('track', eventName, customData, { eventID: eid });
            } catch (e) { /* pixel may not support eventID on older versions */ }
        }

        // 2) Send to CAPI server proxy
        var payload = {
            event_name: eventName,
            event_id: eid,
            event_source_url: window.location.href,
            user_agent: navigator.userAgent,
            fbp: getCookie('_fbp'),
            fbc: getCookie('_fbc'),
            custom_data: customData,
            user_data: userData
        };

        if (typeof fetch !== 'undefined') {
            fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                keepalive: true          // allow send during page unload
            }).then(function (r) { return r.json(); })
              .then(function (d) {
                  if (d.events_received) {
                      console.log('[CAPI] ' + eventName + ' sent ✓ (eid: ' + eid + ')');
                  } else {
                      console.warn('[CAPI] ' + eventName + ' response:', d);
                  }
              })
              .catch(function (err) {
                  console.warn('[CAPI] ' + eventName + ' failed:', err.message);
              });
        }

        return eid;
    }

    // ── Public API ──────────────────────────────────────────────

    window.MetaCAPI = {
        /** Generic event sender */
        trackEvent: send,

        // Standard events (matching what was selected in Events Manager)
        viewContent: function (d, u) { return send('ViewContent', d, u); },
        lead: function (d, u) { return send('Lead', d, u); },
        contact: function (d, u) { return send('Contact', d, u); },
        completeRegistration: function (d, u) { return send('CompleteRegistration', d, u); },
        purchase: function (d, u) { return send('Purchase', d, u); },
        addToCart: function (d, u) { return send('AddToCart', d, u); },
        addToWishlist: function (d, u) { return send('AddToWishlist', d, u); },
        addPaymentInfo: function (d, u) { return send('AddPaymentInfo', d, u); },
        initiateCheckout: function (d, u) { return send('InitiateCheckout', d, u); },
        donate: function (d, u) { return send('Donate', d, u); }
    };

    // ── Auto-fire ViewContent on every page load ────────────────

    if (document.readyState === 'complete') {
        fireVC();
    } else {
        window.addEventListener('load', fireVC);
    }

    function fireVC() {
        send('ViewContent', {
            content_name: document.title,
            content_ids: [window.location.pathname],
            content_type: 'product'
        });
    }

})();
