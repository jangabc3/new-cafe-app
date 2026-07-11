const biRevealItems = document.querySelectorAll('.bi-reveal');

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const biObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      biObserver.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });
  biRevealItems.forEach((item) => biObserver.observe(item));
} else {
  biRevealItems.forEach((item) => item.classList.add('is-visible'));
}
