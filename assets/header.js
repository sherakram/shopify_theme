document.addEventListener('DOMContentLoaded', function() {
  // Get all dropdown toggle buttons
  const dropdownToggles = document.querySelectorAll('[data-dropdown-toggle]');
  let currentOpenDropdown = null;
  
  // Function to close all dropdowns
  function closeAllDropdowns() {
    dropdownToggles.forEach(toggle => {
      toggle.setAttribute('aria-expanded', 'false');
      const dropdown = document.getElementById(toggle.getAttribute('aria-controls'));
      if (dropdown) {
        dropdown.setAttribute('aria-hidden', 'true');
        dropdown.classList.remove('open');
      }
    });
    currentOpenDropdown = null;
  }
  
  // Function to open a dropdown
  function openDropdown(toggle) {
    closeAllDropdowns();
    toggle.setAttribute('aria-expanded', 'true');
    const dropdown = document.getElementById(toggle.getAttribute('aria-controls'));
    if (dropdown) {
      dropdown.setAttribute('aria-hidden', 'false');
      dropdown.classList.add('open');
      currentOpenDropdown = toggle;
      
      // Focus the first item for keyboard users
      setTimeout(() => {
        const firstLink = dropdown.querySelector('a');
        if (firstLink) firstLink.focus();
      }, 10);
    }
  }
  
  // Add click event to each dropdown toggle
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      
      if (isExpanded) {
        closeAllDropdowns();
      } else {
        openDropdown(this);
      }
    });
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (currentOpenDropdown && 
        !currentOpenDropdown.contains(e.target) && 
        !document.getElementById(currentOpenDropdown.getAttribute('aria-controls')).contains(e.target)) {
      closeAllDropdowns();
    }
  });
  
  // Close dropdowns when pressing ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && currentOpenDropdown) {
      closeAllDropdowns();
      currentOpenDropdown.focus();
    }
  });
  
  // Keyboard navigation within dropdowns
  document.addEventListener('keydown', function(e) {
    if (!currentOpenDropdown) return;
    
    const dropdown = document.getElementById(currentOpenDropdown.getAttribute('aria-controls'));
    if (!dropdown) return;
    
    const focusableElements = dropdown.querySelectorAll('a');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          currentOpenDropdown.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          currentOpenDropdown.focus();
        }
      }
    }
  });
  
  // Close dropdowns when a menu item is clicked
  document.querySelectorAll('.dropdown__link').forEach(link => {
    link.addEventListener('click', function() {
      closeAllDropdowns();
    });
  });
});


// Mobile-Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu elements
  const mobileMenuContainer = document.getElementById('mobile-menu-container');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenuClose = document.getElementById('mobile-menu-close');
  const mobileOverlay = document.getElementById('mobile-overlay');
  
  // Track last focused element for accessibility
  let lastFocusedElement;
  
  // Function to open mobile menu
  function openMobileMenu() {
    mobileMenuContainer.classList.add('active');
    mobileMenuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
    
    // Store last focused element
    lastFocusedElement = document.activeElement;
    
    // Focus the close button
    setTimeout(() => {
      mobileMenuClose.focus();
    }, 100);
  }
  
  // Function to close mobile menu
  function closeMobileMenu() {
    mobileMenuContainer.classList.remove('active');
    mobileMenuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = ''; // Re-enable scrolling
    
    // Return focus to the last focused element
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }
  
  // Event listeners for mobile menu
  mobileMenuToggle.addEventListener('click', openMobileMenu);
  mobileMenuClose.addEventListener('click', closeMobileMenu);
  mobileOverlay.addEventListener('click', closeMobileMenu);
  
  // Close menu when pressing ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenuContainer.classList.contains('active')) {
      closeMobileMenu();
    }
  });
  
  // Mobile dropdown functionality
  const mobileDropdownToggles = document.querySelectorAll('.mobile-dropdown-toggle');
  
  mobileDropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !isExpanded);
      
      // Close other dropdowns when opening a new one
      if (!isExpanded) {
        mobileDropdownToggles.forEach(otherToggle => {
          if (otherToggle !== toggle) {
            otherToggle.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });
  });
  
  // Close dropdowns when clicking a link
  document.querySelectorAll('.mobile__dropdown__link').forEach(link => {
    link.addEventListener('click', function() {
      closeMobileMenu();
    });
  });
});