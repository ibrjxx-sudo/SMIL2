(() => {
  const publicView = document.getElementById("public-view");
  if (!publicView) return;

  const progressBar = document.querySelector("#scroll-progress span");
  const header = document.querySelector(".site-header");
  const hero = document.querySelector(".hero");
  const heroVisual = document.querySelector(".hero-visual");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const revealSelector = [
    ".reveal",
    "[data-scroll-reveal]",
    ".service-grid > *",
    ".public-doctors-grid > *",
    ".gallery-grid > *",
    ".public-testimonials-grid > *",
    ".public-articles-grid > *",
    ".public-faq-list > *"
  ].join(",");

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    publicView.querySelectorAll(revealSelector).forEach((element) => element.classList.add("is-revealed"));
    return;
  }

  document.body.classList.add("scroll-effects-ready");

  const revealedElements = new WeakSet();
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      revealedElements.add(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" });

  const observeRevealElements = (scope = publicView) => {
    if (scope.matches?.(revealSelector) && !revealedElements.has(scope)) {
      revealObserver.observe(scope);
    }
    scope.querySelectorAll?.(revealSelector).forEach((element) => {
      if (!revealedElements.has(element)) revealObserver.observe(element);
    });
  };

  observeRevealElements();

  const contentObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) observeRevealElements(node);
      });
    });
  });
  contentObserver.observe(publicView, { childList: true, subtree: true });

  let scrollFrame = 0;
  const updateScrollEffects = () => {
    scrollFrame = 0;
    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollRange > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollRange)) : 0;

    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);

    if (hero && heroVisual) {
      const bounds = hero.getBoundingClientRect();
      const visibility = Math.min(1, Math.max(0, (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height)));
      const offset = (visibility - .5) * -30;
      heroVisual.style.setProperty("--hero-shift", `${offset.toFixed(1)}px`);
    }
  };

  const queueScrollEffects = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollEffects);
  };

  window.addEventListener("scroll", queueScrollEffects, { passive: true });
  window.addEventListener("resize", queueScrollEffects, { passive: true });
  updateScrollEffects();

  const navigationLinks = [...document.querySelectorAll('.main-nav a[href^="#"], .mobile-bottom-nav a[href^="#"]')];
  const sections = navigationLinks
    .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
    .filter((section, index, allSections) => section && allSections.indexOf(section) === index);

  if (sections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const activeHash = `#${entry.target.id}`;
        navigationLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === activeHash;
          link.classList.toggle("is-active", isActive);
          if (link.classList.contains("mobile-nav-item")) {
            link.classList.toggle("active", isActive);
          }
        });
      });
    }, { rootMargin: "-24% 0px -64% 0px" });

    sections.forEach((section) => sectionObserver.observe(section));
  }
})();
