// ── Header scroll effect ──
const header = document.getElementById('bpHeader');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
});

// ── Mobile menu toggle ──
const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('bpNav');
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        const isOpen = nav.style.display === 'flex';
        nav.style.display = isOpen ? 'none' : 'flex';
        nav.style.flexDirection = 'column';
        nav.style.position = 'absolute';
        nav.style.top = '100%';
        nav.style.left = '0';
        nav.style.right = '0';
        nav.style.background = 'var(--psa-forest)';
        nav.style.padding = '1rem 2rem';
        nav.style.borderRadius = '0 0 12px 12px';
        if (isOpen) nav.removeAttribute('style');
    });
}

// ── Smooth scroll for anchor links ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Close mobile menu if open
            if (window.innerWidth <= 768 && nav) nav.removeAttribute('style');
        }
    });
});

// ── Scroll-triggered animations ──
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll('.bp-feature-card, .bp-step, .bp-impact-card, .bp-testimonial-card').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
});
