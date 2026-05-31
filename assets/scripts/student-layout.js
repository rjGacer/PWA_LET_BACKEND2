/**
 * student-layout.js
 * Complete sidebar and topbar functionality in one file
 */

(function () {
  "use strict";

  // ======================================
  // HTML TEMPLATES (embedded in JS)
  // ======================================

  const SIDEBAR_HTML = `
<div class="sidebar" id="mainSidebar">

  <!-- Collapse button -->
  <button class="collapse-toggle-btn" id="collapseBtn" title="Collapse Sidebar (Ctrl+B)">
    <i class="fa-solid fa-angles-left" id="collapseIcon"></i>
  </button>

  <!-- Logo -->
  <div class="logo">
    <div class="logo-circle">
      <i class="fa-solid fa-book-open-reader"></i>
    </div>
    <h1>LearnIQ</h1>
  </div>

  <!-- Menu -->
  <nav class="menu">
    <a href="../student/studentDashboard.html" class="menu-item" data-page="studentDashboard">
      <i class="fa-solid fa-table-cells-large"></i>
      <span>Dashboard</span>
    </a>
    <a href="../student/studentModules.html" class="menu-item" data-page="studentModules">
      <i class="fa-regular fa-window-restore"></i>
      <span>Modules</span>
    </a>
    <a href="../student/studentQuiz.html" class="menu-item" data-page="studentQuiz">
      <i class="fa-regular fa-file-lines"></i>
      <span>Quiz Mode</span>
    </a>
   <!-- <a href="../student/studentPractice.html" class="menu-item" data-page="studentPractice">
      <i class="fa-solid fa-brain"></i>
      <span>Practice</span>
    </a> -->
    <a href="../student/studentHistory.html" class="menu-item" data-page="studentHistory">
      <i class="fa-solid fa-clock-rotate-left"></i>
      <span>History</span>
    </a>
   <!-- <a href="../student/studentLeaderboard.html" class="menu-item" data-page="studentLeaderboard">
      <i class="fa-solid fa-ranking-star"></i>
      <span>Leaderboard</span>
    </a> -->
    <a href="../student/studentSettings.html" class="menu-item" data-page="studentSettings">
      <i class="fa-solid fa-gear"></i>
      <span>Settings</span>
    </a>
  </nav>

  <!-- Support Card -->
  <div class="support-card">
    <h3>Support 24/7</h3>
    <p>Contact us anytime</p>
    <button class="support-btn">Start</button>
    <div class="circle1"></div>
    <div class="circle2"></div>
    <div class="circle3"></div>
  </div>

  <!-- Logout -->
  <div class="logout" id="logoutBtn">
    <i class="fa-solid fa-right-from-bracket"></i>
    <span>Log Out</span>
  </div>

</div>`;

  const TOPBAR_HTML = `
<div class="topbar">

  <div class="search-box">
    <i class="fa-solid fa-magnifying-glass"></i>
    <input type="text" placeholder="Search modules, quizzes...">
  </div>

  <div class="top-right">
    <div class="bell" id="notificationBell" style="position: relative; cursor: pointer;">
      <i class="fa-regular fa-bell"></i>
      <span class="notification-badge" style="display: none; position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center;">0</span>
      <div id="notificationDropdown" style="display: none; position: absolute; top: 40px; right: 0; background: white; border: 1px solid #e5e7eb; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); width: 350px; max-height: 400px; overflow-y: auto; z-index: 1000;">
        <div style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">Notifications</h3>
        </div>
        <div id="notificationList" style="padding: 8px 0;">
          <div style="padding: 16px; text-align: center; color: #6b7280; font-size: 14px;">No notifications</div>
        </div>
      </div>
    </div>
    <div class="profile">
      <img id="topbarProfilePic" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%232f49e0'/%3E%3C/svg%3E" alt="Profile">
      <span id="topbarStudentName">Loading...</span>
    </div>
  </div>

</div>`;

  // ======================================
  // INJECT HTML INTO CONTAINERS
  // ======================================

  function injectTemplates() {
    const sidebarContainer = document.getElementById("sidebar-container");
    const topbarContainer = document.getElementById("topbar-container");

    if (sidebarContainer && !sidebarContainer.querySelector("#mainSidebar")) {
      sidebarContainer.innerHTML = SIDEBAR_HTML;
    }

    if (topbarContainer && !topbarContainer.querySelector(".topbar")) {
      topbarContainer.innerHTML = TOPBAR_HTML;
    }
  }

  // ======================================
  // ACTIVE MENU HIGHLIGHT
  // ======================================

  function setActiveMenu() {
    let currentPage = window.location.pathname.split("/").pop().toLowerCase();
    
    // Handle edge cases
    if (!currentPage || currentPage === "" || currentPage === "student/") {
      currentPage = "studentdashboard.html";
    }

    const menuItems = document.querySelectorAll("#mainSidebar .menu-item");
    let activeFound = false;

    menuItems.forEach(item => {
      item.classList.remove("active");
      const href = item.getAttribute("href") || "";
      const hrefPage = href.split("/").pop().toLowerCase();

      if (hrefPage === currentPage) {
        item.classList.add("active");
        activeFound = true;
      }
    });

    // Dashboard fallback
    if (!activeFound && (currentPage === "studentdashboard.html" || currentPage === "")) {
      const dashboardItem = document.querySelector('#mainSidebar .menu-item[href*="studentDashboard"]');
      if (dashboardItem) dashboardItem.classList.add("active");
    }
  }

  // ======================================
  // SIDEBAR COLLAPSE (Desktop)
  // ======================================

  const COLLAPSED_KEY = "sidebar_collapsed";

  function initSidebarCollapse() {
    const sidebar = document.getElementById("mainSidebar");
    const collapseBtn = document.getElementById("collapseBtn");
    const collapseIcon = document.getElementById("collapseIcon");

    if (!sidebar || !collapseBtn) return;

    // Restore saved collapse state
    const savedState = localStorage.getItem(COLLAPSED_KEY);
    if (savedState === "true" && window.innerWidth > 1024) {
      sidebar.classList.add("collapsed");
      if (collapseIcon) {
        collapseIcon.classList.remove("fa-angles-left");
        collapseIcon.classList.add("fa-angles-right");
      }
    }

    // Collapse button click handler
    collapseBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (window.innerWidth > 1024) {
        sidebar.classList.toggle("collapsed");
        const isCollapsed = sidebar.classList.contains("collapsed");
        localStorage.setItem(COLLAPSED_KEY, isCollapsed);

        if (collapseIcon) {
          if (isCollapsed) {
            collapseIcon.classList.remove("fa-angles-left");
            collapseIcon.classList.add("fa-angles-right");
          } else {
            collapseIcon.classList.remove("fa-angles-right");
            collapseIcon.classList.add("fa-angles-left");
          }
        }
      }
    });

    // Keyboard shortcut: Ctrl+B
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        if (window.innerWidth > 1024) {
          collapseBtn.click();
        }
      }
    });
  }

  // ======================================
  // MOBILE MENU (Hamburger)
  // ======================================

  function initMobileMenu() {
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const sidebar = document.getElementById("mainSidebar");
    
    if (!hamburgerBtn || !sidebar) return;

    // Create overlay if it doesn't exist
    let overlay = document.getElementById("sidebarOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "sidebarOverlay";
      overlay.className = "sidebar-overlay";
      document.body.appendChild(overlay);
    }

    function openSidebar() {
      sidebar.classList.add("mobile-open");
      overlay.classList.add("active");
      hamburgerBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
      document.body.style.overflow = "hidden";
    }

    function closeSidebar() {
      sidebar.classList.remove("mobile-open");
      overlay.classList.remove("active");
      hamburgerBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
      document.body.style.overflow = "";
    }

    // Hamburger click
    hamburgerBtn.addEventListener("click", () => {
      if (sidebar.classList.contains("mobile-open")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    // Overlay click
    overlay.addEventListener("click", closeSidebar);

    // Close sidebar on menu item click (mobile only)
    document.querySelectorAll("#mainSidebar .menu-item, #mainSidebar .logout").forEach(el => {
      el.addEventListener("click", () => {
        if (window.innerWidth <= 1024) {
          closeSidebar();
        }
      });
    });

    // Close sidebar on window resize
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1024 && sidebar.classList.contains("mobile-open")) {
        closeSidebar();
      }
    });
  }

  // ======================================
  // LOGOUT FUNCTIONALITY
  // ======================================

  function initLogout() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      // Remove existing listeners to prevent duplicates
      const newLogoutBtn = logoutBtn.cloneNode(true);
      logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
      
      newLogoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Are you sure you want to log out?")) {
          window.location.href = "../index.html";
        }
      });
    }
  }

  // ======================================
  // INITIALIZE NOTIFICATION DROPDOWN
  // ======================================

  function initNotificationDropdown() {
    const bell = document.getElementById('notificationBell');
    const dropdown = document.getElementById('notificationDropdown');
    
    if (!bell || !dropdown) return;
    
    // Toggle dropdown on bell click
    bell.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      renderNotifications();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!bell.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  function renderNotifications() {
    const notificationList = document.getElementById('notificationList');
    if (!notificationList) return;
    
    // Check if notificationManager exists
    if (typeof notificationManager !== 'undefined' && notificationManager.notifications) {
      const notifications = notificationManager.notifications;
      
      if (notifications.length === 0) {
        notificationList.innerHTML = '<div style="padding: 16px; text-align: center; color: #6b7280; font-size: 14px;">No notifications</div>';
        return;
      }
      
      notificationList.innerHTML = notifications.map((notif, idx) => `
        <div style="padding: 12px 16px; border-bottom: 1px solid #f3f4f6; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'" onclick="window.handleNotificationClick && window.handleNotificationClick('${notif.id || idx}', '${(notif.actionUrl || '').replace(/'/g, "\\'")}')"; style="${notif.isRead ? 'opacity: 0.6;' : ''}">
          <div style="display: flex; gap: 12px;">
            <div style="font-size: 20px; flex-shrink: 0;">${notif.icon || '📌'}</div>
            <div style="flex: 1;">
              <div style="font-weight: 600; color: #1f2937; font-size: 13px;">${(notif.title || '').substring(0, 50)}</div>
              <div style="color: #6b7280; font-size: 12px; margin-top: 4px; line-height: 1.4;">${(notif.message || '').substring(0, 100)}</div>
              <div style="color: #9ca3af; font-size: 11px; margin-top: 4px;">${new Date(notif.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      `).join('');
    }
  }
  
  window.handleNotificationClick = function(notifId, actionUrl) {
    if (typeof notificationManager !== 'undefined') {
      // Mark as read
      notificationManager.markAsRead(notifId);
    }
    
    // Navigate if there's an action URL
    if (actionUrl) {
      window.navigateWithTransition(actionUrl);
    }
  };

  // ======================================
  // LOAD STUDENT PROFILE FOR TOPBAR
  // ======================================

  async function loadTopbarProfile() {
    try {
      // Wait a moment to ensure ApiService is loaded
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try to use ApiService if available
      if (typeof ApiService !== 'undefined') {
        try {
          const api = new ApiService();
          const data = await api.request('/students/me');
          
          const nameElement = document.getElementById('topbarStudentName');
          const picElement = document.getElementById('topbarProfilePic');

          if (data && data.name) {
            // Show only first name
            const firstName = data.name.trim().split(' ')[0];
            if (nameElement) nameElement.textContent = firstName;
          }

          if (data && data.profile_picture && picElement) {
            picElement.src = data.profile_picture;
          } else if (data && data.name && picElement) {
            const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.name) + '&background=2f49e0&color=fff&size=40';
            picElement.src = avatarUrl;
          }
          return;
        } catch (apiError) {
          console.warn('ApiService request failed:', apiError.message);
        }
      }

      // Fallback: Direct fetch
      const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token') || localStorage.getItem('token');
      if (!token) {
        console.warn('No auth token found');
        return;
      }

      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port;
      const portString = port && (protocol === 'http:' ? port !== '80' : port !== '443') ? `:${port}` : '';
      const response = await fetch(`${protocol}//${hostname}${portString}/api/v1/students/me`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const nameElement = document.getElementById('topbarStudentName');
        const picElement = document.getElementById('topbarProfilePic');

        if (data.name && nameElement) {
          const firstName = data.name.trim().split(' ')[0];
          nameElement.textContent = firstName;
        }

        if (data.profile_picture && picElement) {
          picElement.src = data.profile_picture;
        } else if (data.name && picElement) {
          const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.name) + '&background=2f49e0&color=fff&size=40';
          picElement.src = avatarUrl;
        }
      }
    } catch (error) {
      console.warn('Error loading topbar profile:', error);
    }
  }

  // ======================================
  // PAGE TRANSITION HELPER
  // ======================================

  window.navigateWithTransition = function(url) {
    if (!url) return;
    document.body.classList.add("page-loading");
    setTimeout(() => {
      window.location.href = url;
    }, 150);
  };

  // ======================================
  // EXPOSE updateTopbarProfile GLOBALLY
  // ======================================

  window.updateTopbarProfile = function(studentName, profilePicture) {
    const nameElement = document.getElementById('topbarStudentName');
    const picElement = document.getElementById('topbarProfilePic');

    if (nameElement && studentName) {
      const firstName = studentName.trim().split(' ')[0];
      nameElement.textContent = firstName;
    }

    if (picElement) {
      if (profilePicture) {
        picElement.src = profilePicture;
      } else if (studentName) {
        const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(studentName) + '&background=2f49e0&color=fff&size=40';
        picElement.src = avatarUrl;
      }
    }
  };

  // ======================================
  // INITIALIZE EVERYTHING
  // ======================================

  function init() {
    // Inject HTML templates
    injectTemplates();
    
    // Load student profile for topbar
    loadTopbarProfile();
    
    // Initialize all functionality
    setActiveMenu();
    initSidebarCollapse();
    initMobileMenu();
    initLogout();
    initNotificationDropdown();
    
    // Remove loading class
    document.body.classList.remove("page-loading");
  }

  // Handle page load / DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // DOM is already ready
    init();
  }

  // Handle back/forward navigation (bfcache)
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      // Re-initialize when page is restored from cache
      setTimeout(init, 10);
    }
  });

})();
