// scripts/main.js

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Floating menu toggle
const menuToggle = document.getElementById('menuToggle');
const floatingMenu = document.getElementById('floatingMenu');

if (menuToggle && floatingMenu) {
  menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = floatingMenu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    floatingMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
  });

  // Close floating menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!floatingMenu.contains(e.target) && !menuToggle.contains(e.target)) {
      floatingMenu.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      floatingMenu.setAttribute('aria-hidden', 'true');
    }
  });

  // Close with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      floatingMenu.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      floatingMenu.setAttribute('aria-hidden', 'true');
    }
  });
}
