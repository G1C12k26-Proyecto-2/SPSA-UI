// ── Header scroll effect ──
const header = document.getElementById('awHeader');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 60);
});

// ── Mobile menu toggle ──
const menuToggle = document.getElementById('menuToggle');
const nav = document.getElementById('awNav');
if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        const isOpen = nav.style.display === 'flex';
        if (isOpen) {
            nav.removeAttribute('style');
        } else {
            nav.style.display = 'flex';
            nav.style.flexDirection = 'column';
            nav.style.position = 'absolute';
            nav.style.top = '100%';
            nav.style.left = '0';
            nav.style.right = '0';
            nav.style.background = 'rgba(10,10,10,0.97)';
            nav.style.backdropFilter = 'blur(20px)';
            nav.style.padding = '1.5rem 2rem';
            nav.style.borderRadius = '0 0 12px 12px';
            nav.style.borderTop = '1px solid rgba(106,191,94,0.1)';
            nav.style.gap = '1rem';
        }
    });
}

// ── Smooth scroll for anchor links ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (window.innerWidth <= 768 && nav) nav.removeAttribute('style');
        }
    });
});

// ── Scroll-triggered fade-in ──
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            const delay = Array.from(entry.target.parentElement.children).indexOf(entry.target) * 0.08;
            entry.target.style.animation = `fadeInUp 0.6s ease-out ${delay}s forwards`;
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll('.aw-service-card, .aw-project-card, .aw-team-card, .aw-why-item').forEach(el => {
    el.style.opacity = '0';
    observer.observe(el);
});
