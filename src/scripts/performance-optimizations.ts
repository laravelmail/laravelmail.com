/**
 * Performance Optimization Script
 * Implements lazy loading, image optimization, and performance monitoring
 */

// Lazy loading for images
document.addEventListener('DOMContentLoaded', () => {
  // Lazy load images
  const lazyImages = document.querySelectorAll('img[data-src]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src as string;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });
    
    lazyImages.forEach((img) => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for browsers without IntersectionObserver
    lazyImages.forEach((img) => {
      img.src = img.dataset.src as string;
      img.removeAttribute('data-src');
    });
  }
  
  // Preload critical resources
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Preload key images
      const criticalImages = document.querySelectorAll('img[loading="eager"]');
      criticalImages.forEach((img) => {
        if (img instanceof HTMLImageElement) {
          img.decode().catch(() => {});
        }
      });
    });
  }
});

// Performance monitoring
export function trackPerformance() {
  if ('performance' in window && 'mark' in window.performance) {
    performance.mark('page-load-start');
  }
  
  document.addEventListener('astro:after-swap', () => {
    if ('performance' in window && 'mark' in window.performance) {
      performance.mark('page-load-end');
      performance.measure('page-load-time', 'page-load-start', 'page-load-end');
      
      const measures = performance.getEntriesByName('page-load-time');
      if (measures.length > 0) {
        const loadTime = measures[0].duration;
        console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
        
        // Send to analytics if available
        if (window.dataLayer) {
          window.dataLayer.push({
            event: 'performance_metrics',
            load_time: loadTime,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  });
}

// Optimize fonts
export function optimizeFonts() {
  // Font loading strategy
  const fontElements = document.querySelectorAll('link[rel="preload"][as="font"]');
  fontElements.forEach((font) => {
    font.addEventListener('load', () => {
      document.documentElement.classList.add('fonts-loaded');
    });
    font.addEventListener('error', () => {
      document.documentElement.classList.add('fonts-loaded');
    });
  });
}

// Initialize optimizations
trackPerformance();
optimizeFonts();