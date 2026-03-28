const ANIMATED_CLASSES = ['.fade-up', '.fade-left', '.fade-right', '.scale-in'].join(',');

export function initScrollReveal(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-vis');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(ANIMATED_CLASSES).forEach((el) => observer.observe(el));
}
