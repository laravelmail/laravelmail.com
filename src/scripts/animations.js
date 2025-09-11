document.addEventListener('astro:page-load', () => {
  // ===== Intersection Observer for scroll animations =====
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  
  if (animatedElements.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Get the delay class number (e.g., 'delay-2' -> 2)
          const delayClass = Array.from(entry.target.classList)
            .find(className => className.startsWith('delay-'));
          
          // Add animated class immediately to start the animation
          // The delay is handled by CSS animation-delay
          entry.target.classList.add('animated');
          
          // Once the animation has played, unobserve the element
          observer.unobserve(entry.target);
        }
      });
    }, { 
      threshold: 0.2,
      rootMargin: '0px 0px -100px 0px'
    });
    
    animatedElements.forEach(element => {
      observer.observe(element);
    });
  }
  
  // ===== Smooth scrolling for anchor links =====
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // ===== Navbar scroll effect =====
  const header = document.querySelector('header');
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    };
    
    // Initial check
    handleScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
  }
  
  // ===== Button hover/click effects =====
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    // Add ripple effect on click
    button.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.classList.add('ripple-effect');
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      this.appendChild(ripple);
      
      // Remove ripple after animation completes
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
  
  // ===== Scroll progress indicator =====
  const progressBar = document.createElement('div');
  progressBar.classList.add('scroll-progress-bar');
  document.body.appendChild(progressBar);
  
  window.addEventListener('scroll', () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    
    const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;
    progressBar.style.width = `${scrollPercentage}%`;
  });
  
  // ===== Enhanced FAQ accordion animations =====
  const faqItems = document.querySelectorAll('.faq-item details');
  faqItems.forEach(item => {
    item.addEventListener('toggle', () => {
      const content = item.querySelector('.faq-content');
      const summary = item.querySelector('summary');
      
      if (item.open) {
        // Add open animation classes
        content.classList.add('faq-open');
        summary.classList.add('faq-summary-open');
      } else {
        // Add closing animation classes
        content.classList.remove('faq-open');
        summary.classList.remove('faq-summary-open');
      }
    });
  });
  
  // ===== Enhanced Parallax scrolling effect =====
  const parallaxElements = document.querySelectorAll('.parallax');
  
  if (parallaxElements.length > 0) {
    const handleParallax = () => {
      const scrollTop = window.scrollY;
      
      parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.speed) || 0.5;
        const offset = scrollTop * speed;
        
        // Apply the transform with translateY for vertical parallax
        element.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    };
    
    // Initial call to set positions
    handleParallax();
    
    // Add scroll event listener with passive option for better performance
    window.addEventListener('scroll', handleParallax, { passive: true });
    
    // Also update on resize for responsive layouts
    window.addEventListener('resize', handleParallax, { passive: true });
  }
  
  // ===== Highlight active navigation link =====
  const navLinks = document.querySelectorAll('nav a');
  const currentPath = window.location.pathname;
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    
    // Check if the current path matches the link path
    // or if we're on the homepage and the link is to the homepage
    if (
      (currentPath === linkPath) || 
      (currentPath === '/' && linkPath === '/') ||
      (currentPath.startsWith(linkPath) && linkPath !== '/')
    ) {
      link.classList.add('active-nav-link');
    }
  });
  
  // ===== Mobile menu enhanced toggle =====
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      // Toggle the menu with animation
      const isMenuOpen = !mobileMenu.classList.contains('hidden');
      
      if (!isMenuOpen) {
        // Show menu
        mobileMenu.classList.remove('hidden');
        mobileMenu.classList.add('mobile-menu-open');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.classList.add('menu-open');
        
        // Focus first menu item for keyboard navigation
        const firstMenuItem = mobileMenu.querySelector('a');
        if (firstMenuItem) {
          firstMenuItem.focus();
        }
      } else {
        // Hide menu
        mobileMenu.classList.add('mobile-menu-closing');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.classList.remove('menu-open');
        
        // Wait for animation to finish before hiding
        setTimeout(() => {
          mobileMenu.classList.remove('mobile-menu-open');
          mobileMenu.classList.remove('mobile-menu-closing');
          mobileMenu.classList.add('hidden');
        }, 300);
      }
    });
    
    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('mobile-menu-closing');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.classList.remove('menu-open');
        menuToggle.focus(); // Return focus to toggle button
        
        setTimeout(() => {
          mobileMenu.classList.remove('mobile-menu-open');
          mobileMenu.classList.remove('mobile-menu-closing');
          mobileMenu.classList.add('hidden');
        }, 300);
      }
    });
  }
});
