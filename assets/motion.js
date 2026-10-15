export const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

export function reveal(nodes) {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
  [...nodes].forEach((node) => {
    node.classList.add("will-reveal");
    observer.observe(node);
  });
}

export function pulse(node) {
  if (reducedMotion.matches || !node) return;
  node.classList.remove("pulse");
  void node.offsetWidth;
  node.classList.add("pulse");
}
