// transitions.js

// Fungsi inisialisasi animasi on-scroll menggunakan IntersectionObserver
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('[data-animate]');

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const animationType = el.getAttribute('data-animate');
        const delay = el.getAttribute('data-delay') || 0;

        el.style.animationDelay = `${delay}ms`;
        el.classList.add(animationType, 'animated');

        obs.unobserve(el);
      }
    });
  }, {
    threshold: 0.1
  });

  animatedElements.forEach(el => observer.observe(el));
  observer.takeRecords();
}

// Parallax effect handler
function initParallax() {
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  if (!parallaxElements.length) return;

  const handleParallax = () => {
    parallaxElements.forEach(el => {
      const speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      const yPos = -window.scrollY * speed;
      el.style.transform = `translateY(${yPos}px)`;
    });
  };

  window.addEventListener('scroll', handleParallax);
  handleParallax();
}

// Smooth scroll for anchor links
function initSmoothScroll() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  anchorLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;
      const offsetTop = targetEl.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    });
  });
}

// Apply data-page-transition classes
function initPageTransitions() {
  const pageTransitionElements = document.querySelectorAll('[data-page-transition]');
  pageTransitionElements.forEach(el => {
    const type = el.getAttribute('data-page-transition');
    el.classList.add(`transition-${type}`);
  });
}

// Handle navigation direction before swap
document.addEventListener('astro:before-preparation', ({ from, to }) => {
  if (from && to) {
    const fromDepth = new URL(from).pathname.split('/').filter(Boolean).length;
    const toDepth = new URL(to).pathname.split('/').filter(Boolean).length;
    let navDirection = 'same';
    if (toDepth > fromDepth) navDirection = 'deeper';
    else if (toDepth < fromDepth) navDirection = 'shallower';
    localStorage.setItem('navigationDirection', navDirection);
  }
});

// Main init on page load
document.addEventListener('astro:page-load', () => {
  initScrollAnimations();
  initParallax();
  initSmoothScroll();
  initPageTransitions();

  // Terapkan direction-specific transition attribute
  const navDirection = localStorage.getItem('navigationDirection');
  if (navDirection) {
    document.documentElement.setAttribute('data-navigation', navDirection);
    setTimeout(() => localStorage.removeItem('navigationDirection'), 1000);
  }
});