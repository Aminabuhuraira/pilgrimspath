// ===================================
// Pilgrim's Path - Interactive Scripts
// Mobile Optimized
// ===================================

// Preloader - faster on mobile
window.addEventListener('load', () => {
    const isMobile = window.innerWidth <= 768;
    setTimeout(() => {
        document.getElementById('preloader').classList.add('hidden');
    }, isMobile ? 1000 : 2000);
});

// Navbar scroll effect
const navbar = document.getElementById('navbar');
let lastScroll = 0;
let ticking = false;

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
            ticking = false;
        });
        ticking = true;
    }
});

// Mobile menu with improved touch handling
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
let menuOpen = false;

hamburger.addEventListener('click', toggleMobileMenu);

function toggleMobileMenu() {
    menuOpen = !menuOpen;
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    
    // Animate hamburger
    const spans = hamburger.querySelectorAll('span');
    if (menuOpen) {
        spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
    } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '1';
        spans[2].style.transform = '';
    }
}

function closeMobileMenu() {
    if (menuOpen) {
        toggleMobileMenu();
    }
}

// Close menu on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMobileMenu();
        closeModal();
        closeSuccessModal();
    }
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (menuOpen && !mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
        closeMobileMenu();
    }
});

// Counter animation for stats
function animateCounter(element, target) {
    const duration = 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Intersection Observer for counter animation
const statNumbers = document.querySelectorAll('.stat-number');
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = parseInt(entry.target.dataset.target);
            animateCounter(entry.target, target);
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

statNumbers.forEach(stat => statsObserver.observe(stat));

// Panorama rotation control with touch support
let isPanoramaPlaying = true;
const panoramaImage = document.getElementById('panoramaImage');
const playPauseBtn = document.getElementById('playPauseBtn');

// Touch/drag support for panorama
let isDragging = false;
let startX = 0;
let currentTranslate = 0;

if (panoramaImage) {
    panoramaImage.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        panoramaImage.classList.add('paused');
        isPanoramaPlaying = false;
        if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }, { passive: true });

    panoramaImage.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const currentX = e.touches[0].clientX;
        const diff = startX - currentX;
        currentTranslate += diff * 0.5;
        startX = currentX;
    }, { passive: true });

    panoramaImage.addEventListener('touchend', () => {
        isDragging = false;
    });
}

function togglePanoramaRotation() {
    isPanoramaPlaying = !isPanoramaPlaying;
    
    if (isPanoramaPlaying) {
        panoramaImage.classList.remove('paused');
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        panoramaImage.classList.add('paused');
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

// Fullscreen panorama
function toggleFullscreen() {
    const viewer = document.getElementById('panoramaViewer');
    
    if (!document.fullscreenElement) {
        viewer.requestFullscreen().catch(err => {
            console.log('Fullscreen error:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// Panorama thumbnail selection
const thumbnails = document.querySelectorAll('.thumbnail');
const panoramaImages = {
    kaaba: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=2000',
    madinah: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=2000',
    mina: 'https://images.unsplash.com/photo-1564769625673-cb690a0d5022?w=2000',
    arafat: 'https://images.unsplash.com/photo-1565019001607-0dee94ca6dc2?w=2000'
};

thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
        thumbnails.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        
        const panoramaKey = thumb.dataset.panorama;
        panoramaImage.style.backgroundImage = `url('${panoramaImages[panoramaKey]}')`;
    });
});

// Modal functionality
const registerModal = document.getElementById('registerModal');
const successModal = document.getElementById('successModal');

function openModal() {
    registerModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    registerModal.classList.remove('active');
    document.body.style.overflow = '';
}

function openSuccessModal() {
    successModal.classList.add('active');
}

function closeSuccessModal() {
    successModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close modal on backdrop click
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeSuccessModal();
    }
});

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

// Form submission — Supabase sign-up
async function handleRegistration(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const country = document.getElementById('country').value;

    try {
        let result = null;
        if (typeof signUp === 'function') {
            result = await signUp(email, password, { firstName, lastName, country });
        }
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        closeModal();
        form.reset();

        // Update success modal based on whether we have a session
        const successModal = document.getElementById('successModal');
        if (successModal) {
            const msgEl = successModal.querySelector('p');
            const btnEl = successModal.querySelector('.primary-btn');
            if (result && result.session) {
                // Email confirmation disabled — logged in immediately
                if (msgEl) msgEl.textContent = 'Your account has been created successfully. Welcome aboard!';
                if (btnEl) {
                    btnEl.setAttribute('onclick', "window.location.href='dashboard.html'");
                    btnEl.querySelector('span').textContent = 'Go to Dashboard';
                }
            } else {
                // Email confirmation required — don't send to dashboard
                if (msgEl) msgEl.textContent = 'Your account has been created! Please check your email to confirm your account, then sign in.';
                if (btnEl) {
                    btnEl.setAttribute('onclick', "window.location.href='login.html'");
                    btnEl.querySelector('span').textContent = 'Go to Sign In';
                }
            }
        }
        setTimeout(() => openSuccessModal(), 300);
    } catch (err) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        alert(err.message || 'Registration failed. Please try again.');
    }
}

// Scroll animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.experience-card, .step-card, .testimonial-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    scrollObserver.observe(el);
});

// Add visible class styles
const style = document.createElement('style');
style.textContent = `
    .experience-card.visible,
    .step-card.visible,
    .testimonial-card.visible {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    
    if (hero && scrolled < window.innerHeight) {
        const parallaxElements = hero.querySelectorAll('.hero-bg::before, .floating-particles');
        hero.style.setProperty('--parallax-offset', `${scrolled * 0.3}px`);
    }
});

// Add twinkling stars animation dynamically - reduced on mobile
function createStars() {
    const isMobile = window.innerWidth <= 768;
    const starCount = isMobile ? 20 : 50;
    
    const starsContainer = document.createElement('div');
    starsContainer.className = 'dynamic-stars';
    starsContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
    `;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.style.cssText = `
            position: absolute;
            width: ${Math.random() * 3 + 1}px;
            height: ${Math.random() * 3 + 1}px;
            background: ${Math.random() > 0.5 ? '#C9A227' : '#D4AF37'};
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            opacity: ${Math.random() * 0.4 + 0.2};
            animation: twinkle ${Math.random() * 3 + 2}s ease-in-out infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        starsContainer.appendChild(star);
    }
    
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.appendChild(starsContainer);
    }
}

// Initialize stars on load
document.addEventListener('DOMContentLoaded', createStars);

// Magnetic button effect - only on non-touch devices
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

if (!isTouchDevice) {
    document.querySelectorAll('.primary-btn, .secondary-btn').forEach(button => {
        button.addEventListener('mousemove', (e) => {
            const rect = button.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            button.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = '';
        });
    });
}

// Smooth reveal for sections
const sections = document.querySelectorAll('section');
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('section-visible');
        }
    });
}, { threshold: 0.1 });

sections.forEach(section => sectionObserver.observe(section));

// Add CSS for section visibility
const sectionStyle = document.createElement('style');
sectionStyle.textContent = `
    section {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.8s ease, transform 0.8s ease;
    }
    
    section.section-visible {
        opacity: 1;
        transform: translateY(0);
    }
    
    .hero {
        opacity: 1;
        transform: none;
    }
`;
document.head.appendChild(sectionStyle);

// Interactive hotspots
document.querySelectorAll('.hotspot').forEach(hotspot => {
    hotspot.addEventListener('mouseenter', function() {
        this.querySelector('.hotspot-pulse').style.animationPlayState = 'paused';
    });
    
    hotspot.addEventListener('mouseleave', function() {
        this.querySelector('.hotspot-pulse').style.animationPlayState = 'running';
    });
});

// Hamburger animation
hamburger.addEventListener('click', function() {
    const spans = this.querySelectorAll('span');
    if (this.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
    } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '1';
        spans[2].style.transform = '';
    }
});

// Console welcome message
console.log(`
%c☪ Pilgrim's Path %c
%cVirtual Hajj & Umrah Experience
%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
May your journey be blessed.
`, 
'color: #C9A227; font-size: 24px; font-weight: bold;',
'',
'color: #666; font-size: 14px;',
'color: #C9A227;'
);

// Viewport height fix for mobile browsers (100vh issue)
function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setVH();
window.addEventListener('resize', setVH);
window.addEventListener('orientationchange', () => {
    setTimeout(setVH, 100);
});

// Prevent pull-to-refresh on mobile when scrolling modals
document.querySelectorAll('.modal-content').forEach(modal => {
    modal.addEventListener('touchmove', (e) => {
        e.stopPropagation();
    }, { passive: true });
});

// Lazy load images for performance
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    }, { rootMargin: '50px' });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Handle form input focus on mobile (prevent zoom)
document.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('focus', () => {
        if (window.innerWidth <= 768) {
            document.body.classList.add('input-focused');
        }
    });
    
    input.addEventListener('blur', () => {
        document.body.classList.remove('input-focused');
    });
});

// Smooth scroll polyfill for older mobile browsers
function smoothScrollTo(element) {
    if (!element) return;
    
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition - 80; // 80px offset for navbar
    const duration = 800;
    let start = null;

    function animation(currentTime) {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        window.scrollTo(0, startPosition + distance * ease);
        
        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        }
    }

    requestAnimationFrame(animation);
}

// Update scrollToSection to use smooth scroll
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        closeMobileMenu();
        smoothScrollTo(section);
    }
}
