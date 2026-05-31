// Initialize API Service (will use dynamic URL based on current location)
const api = new ApiService();

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// Helper function to set auth token
function setAuthToken(token) {
  api.setToken(token);
}

// Check if user is authenticated
function isAuthenticated() {
  return !!getAuthToken();
}