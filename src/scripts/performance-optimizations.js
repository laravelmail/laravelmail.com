// Performance optimizations for Laravel Mail

document.addEventListener('DOMContentLoaded', function() {
  // Preload critical resources
  if ('requestIdleCallback' in window) {
    requestIdleCallback(function() {
      // Preload hero image
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = '/logo.svg';
      document.head.appendChild(link);
    });
  }

  // Optimize font loading
  const fontElements = document.querySelectorAll('link[rel="stylesheet"][href*="fontsource"]');
  fontElements.forEach(font => {
    font.setAttribute('media', 'print');
    font.setAttribute('onload', "this.media='all'");
  });

  // Implement intersection observer for lazy loading
  const lazyImages = document.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '200px',
      threshold: 0.01
    });

    lazyImages.forEach(img => observer.observe(img));
  } else {
    // Fallback for browsers without IntersectionObserver
    lazyImages.forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }

  // Optimize view transitions
  if ('startViewTransition' in document) {
    document.addEventListener('astro:before-preparation', () => {
      // Smooth transitions between pages
      document.body.style.willChange = 'transform';
    });
  }

  // Reduce motion for accessibility
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    document.body.style.setProperty('--transition-duration', '0.01ms');
  }
});