async function loadComponent(id, file) {
  const res = await fetch(file);
  document.getElementById(id).innerHTML = await res.text();
}

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