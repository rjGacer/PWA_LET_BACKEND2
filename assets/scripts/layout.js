async function loadComponent(id, file) {
  const res = await fetch(file);
  document.getElementById(id).innerHTML = await res.text();
}

// Global function for category navigation (backup)
window.navigateToCategory = function(categoryId) {
  console.log('[Layout.js] navigateToCategory called with categoryId:', categoryId);
  const url = 'subject.html?categoryId=' + categoryId;
  console.log('[Layout.js] Navigating to URL:', url);
  window.location.href = url;
};

window.addEventListener("DOMContentLoaded", async () => {

  await loadComponent("sidebar", "../components/sidebar.html");
  await loadComponent("header", "../components/header.html");

  // Populate user info from localStorage
  function populateUserInfo() {
    const userName = localStorage.getItem('userName') || 'Teacher';
    const userRole = localStorage.getItem('userRole') || 'Admin';
    
    const profileName = document.querySelector('.profile-info h4');
    const profileRole = document.querySelector('.profile-info p');
    const profileAvatar = document.querySelector('.profile-avatar');
    
    if (profileName) profileName.textContent = userName;
    if (profileRole) profileRole.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);
    if (profileAvatar) profileAvatar.textContent = userName.charAt(0).toUpperCase();
  }

  // Delay to ensure sidebar is loaded
  setTimeout(() => {
    // Attach event listeners to category navigation links
    const categoryLinks = document.querySelectorAll('.category-nav-link');
    console.log('[Layout.js] Found', categoryLinks.length, 'category nav links');
    
    categoryLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault(); // Prevent default navigation first
        
        const href = this.getAttribute('href');
        console.log('[Layout.js] Category link clicked, href:', href);
        
        // Extract categoryId from href
        const match = href.match(/categoryId=(\d+)/);
        if (match) {
          const categoryId = match[1];
          console.log('[Layout.js] Extracted categoryId:', categoryId);
          console.log('[Layout.js] Setting sessionStorage categoryId:', categoryId);
          sessionStorage.setItem('selectedCategoryId', categoryId);
          
          // Clear any old URL params and set new ones
          const newUrl = 'subject.html?categoryId=' + categoryId;
          console.log('[Layout.js] Navigating to:', newUrl);
          window.location.href = newUrl;
        } else {
          // If no categoryId found, just navigate to the href
          console.log('[Layout.js] No categoryId found, navigating to:', href);
          window.location.href = href;
        }
      });
    });
  }, 100);

  // Event delegation for interactions
  document.addEventListener("click", (e) => {

    // dropdown toggle
    const btn = e.target.closest(".dropdown-btn");
    if (btn) {
      btn.nextElementSibling.classList.toggle("show");
    }

    // mobile sidebar toggle
    if (e.target.closest("#menuToggle")) {
      document.querySelector(".sidebar").classList.toggle("show-sidebar");
    }

    // Logout button
    const logoutBtn = e.target.closest('#logoutBtn');
    if (logoutBtn) {
      e.preventDefault();
      e.stopPropagation();
      logout();
    }

  });

  // Populate user info after components load
  setTimeout(populateUserInfo, 100);

});