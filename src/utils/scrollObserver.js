export function initScrollAnimations(options = {}) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate");
        if (options.once) observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    ...options.observerOptions
  });

  document.querySelectorAll("[data-scroll]").forEach(el => {
    observer.observe(el);
  });
}