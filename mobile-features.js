// Mobile Features - Version Minimale
let mobileCurrentMonth = new Date().getMonth();
let mobileCurrentYear = new Date().getFullYear();

// Navigation mobile
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(sectionName)?.classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`)?.classList.add('active');
}

// Menu toggle
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('mobileMenu')?.classList.toggle('active');
    });

    document.getElementById('closeMenu')?.addEventListener('click', () => {
        document.getElementById('mobileMenu')?.classList.remove('active');
    });

    // Navigation bottom
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.getAttribute('data-section');
            if (section) showSection(section);
        });
    });
});

window.showSection = showSection;