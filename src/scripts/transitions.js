// Enhanced page transitions
document.addEventListener('astro:page-load', () => {
  // Add animation classes to elements with data-animate attribute
  const animatedElements = document.querySelectorAll('[data-animate]');
  
  animatedElements.forEach((element, index) => {
    const animationType = element.getAttribute('data-animate');
    const delay = element.getAttribute('data-delay') || index * 100;
    
    // Set animation delay
    element.style.animationDelay = `${delay}ms`;
    
    // Add animation class based on data-animate attribute
    setTimeout(() => {
      element.classList.add(animationType);
      element.classList.add('animated');
    }, 10);
  });
  
  // Parallax effect for elements with data-parallax attribute
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  
  if (parallaxElements.length > 0) {
    const handleParallax = () => {
      parallaxElements.forEach(element => {
        const speed = element.getAttribute('data-parallax') || 0.1;
        const yPos = -(window.scrollY * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    };
    
    window.addEventListener('scroll', handleParallax);
  }
  
  // Smooth scroll for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  
  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = link.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        const offsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset;
        
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Page transition effects
  const pageTransitionElements = document.querySelectorAll('[data-page-transition]');
  
  pageTransitionElements.forEach(element => {
    const transitionType = element.getAttribute('data-page-transition');
    element.classList.add(`transition-${transitionType}`);
  });
});

// Handle navigation events
document.addEventListener('astro:before-preparation', ({ from, to, direction }) => {
  // Store navigation direction in localStorage to use it after page load
  if (from && to) {
    const fromPath = new URL(from).pathname;
    const toPath = new URL(to).pathname;
    
    // Determine navigation direction based on path depth
    const fromDepth = fromPath.split('/').filter(Boolean).length;
    const toDepth = toPath.split('/').filter(Boolean).length;
    
    let navDirection = 'same';
    
    if (toDepth > fromDepth) {
      navDirection = 'deeper';
    } else if (toDepth < fromDepth) {
      navDirection = 'shallower';
    }
    
    localStorage.setItem('navigationDirection', navDirection);
  }
});

// Apply direction-specific transitions
document.addEventListener('astro:page-load', () => {
  const navDirection = localStorage.getItem('navigationDirection');
  
  if (navDirection) {
    document.documentElement.setAttribute('data-navigation', navDirection);
    
    // Clean up after transition completes
    setTimeout(() => {
      localStorage.removeItem('navigationDirection');
    }, 1000);
  }
}); 
