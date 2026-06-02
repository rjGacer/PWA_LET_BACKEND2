/**
 * Categories Integration Script
 * This file should be included in categories.html
 */

const api = new ApiService();

// Load all categories
async function loadCategoriesData() {
  try {
    console.log('Loading categories...');
    const categories = await api.getCategories();
    
    if (categories && categories.length > 0) {
      console.log('✓ Categories loaded:', categories);
      // Categories are already in HTML, just log for verification
      return categories;
    }
  } catch (error) {
    console.error('❌ Failed to load categories:', error);
  }
}

// Navigate to subject page for a category
function viewCategorySubjects(categoryId) {
  console.log('Navigating to category', categoryId);
  // Store category ID for next page as backup
  sessionStorage.setItem('selectedCategoryId', categoryId);
  // Navigate with query parameter
  window.location.href = 'subject.html?categoryId=' + categoryId;
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('✓ Categories page initialized');
    loadCategoriesData();
  });
} else {
  loadCategoriesData();
}

window.categoriesApi = { loadCategoriesData, viewCategorySubjects, api };
