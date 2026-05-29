const loginSection = document.getElementById('login-section');
const manageSection = document.getElementById('manage-section');
const productsSection = document.getElementById('products-section');
const loginForm = document.getElementById('login-form');
const productForm = document.getElementById('product-form');
const productList = document.getElementById('admin-product-list');
const productCount = document.getElementById('product-count');
const logoutAdminButton = document.getElementById('logout-admin-button');

let adminPassword = null;

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));

  window.setTimeout(() => {
    toast.classList.remove('visible');
    window.setTimeout(() => toast.remove(), 220);
  }, 3200);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function setBusy(button, isBusy, text) {
  if (!button) return;
  button.disabled = isBusy;
  button.dataset.originalText = button.dataset.originalText || button.textContent;
  button.textContent = isBusy ? text : button.dataset.originalText;
}

function showAdminInterface() {
  localStorage.setItem('martnowUser', 'admin');
  loginSection.classList.add('hidden');
  manageSection.classList.remove('hidden');
  productsSection.classList.remove('hidden');
  loadAdminProducts();
}

function showLoginInterface() {
  loginSection.classList.remove('hidden');
  manageSection.classList.add('hidden');
  productsSection.classList.add('hidden');
  productList.innerHTML = '';
  productCount.textContent = 'Products loaded: 0';
}

async function loginAdmin(event) {
  event.preventDefault();
  const password = document.getElementById('admin-password').value.trim();

  if (!password) {
    showToast('Enter your admin password to continue.', 'error');
    return;
  }

  adminPassword = null;
  localStorage.removeItem('adminPassword');

  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });

  if (response.ok) {
    adminPassword = password;
    localStorage.setItem('adminPassword', password);
    localStorage.setItem('martnowUser', 'admin');
    showToast('Admin access granted.', 'success');
    showAdminInterface();
  } else {
    showToast('Invalid password. Try admin123.', 'error');
  }
}

function getAuthHeaders() {
  return { 'x-admin-password': adminPassword || '' };
}

async function loadAdminProducts() {
  try {
    const response = await fetch('/api/products');
    const products = await response.json();
    productList.innerHTML = '';
    productCount.textContent = `Products loaded: ${products.length}`;

    if (!products.length) {
      productList.innerHTML = '<p class="empty-state">No products yet. Add one from the form above.</p>';
      return;
    }

    products.forEach((product) => {
      const card = document.createElement('article');
      card.className = 'product-card admin-product';
      card.innerHTML = `
        <span class="tag">${product.category || 'General'}</span>
        <img src="${product.imageUrl}" alt="${product.name}" />
        <h3>${product.name}</h3>
        <p>${product.description || 'No description provided.'}</p>
        <div class="price">₹${product.price.toFixed(2)}</div>
        <button class="button button-secondary" data-id="${product.id}">Remove Product</button>
      `;

      const removeButton = card.querySelector('button');
      removeButton.addEventListener('click', () => removeProduct(product.id));
      productList.appendChild(card);
    });
  } catch (error) {
    showToast('Unable to load products right now. Please refresh and try again.', 'error');
  }
}

async function removeProduct(productId) {
  if (!confirm('Remove this product permanently?')) return;

  const response = await fetch(`/api/products/${productId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (response.ok) {
    showToast('Product removed successfully.', 'success');
    loadAdminProducts();
  } else {
    showToast('Failed to remove product. Please check your admin password.', 'error');
  }
}

async function addProduct(event) {
  event.preventDefault();
  const formData = new FormData(productForm);
  const name = formData.get('name')?.toString().trim();
  const price = formData.get('price')?.toString().trim();

  if (!name || !price) {
    showToast('Please enter a product name and price.', 'error');
    return;
  }

  setBusy(productForm.querySelector('button[type="submit"]'), true, 'Adding...');

  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    if (response.ok) {
      productForm.reset();
      showToast('Product added successfully.', 'success');
      loadAdminProducts();
    } else {
      showToast('Could not add product. Check your admin password and try again.', 'error');
    }
  } catch (error) {
    showToast('Network error while adding the product.', 'error');
  } finally {
    setBusy(productForm.querySelector('button[type="submit"]'), false, 'Add Product');
  }
}

function logoutAdmin() {
  localStorage.removeItem('martnowUser');
  localStorage.removeItem('adminPassword');
  window.location.href = '/';
}

window.addEventListener('DOMContentLoaded', () => {
  const currentUser = localStorage.getItem('martnowUser');
  const savedPassword = localStorage.getItem('adminPassword');

  // Detect whether admin UI is embedded on the current page (index.html)
  const embedded = !!document.getElementById('login-section');

  // If not embedded (we're on admin.html), prevent non-admins from viewing.
  if (!embedded && currentUser !== 'admin') {
    window.location.href = '/';
    return;
  }

  // Restore saved admin session if present
  if (savedPassword) {
    adminPassword = savedPassword;
    showAdminInterface();
  } else {
    // If embedded we still show the login form; on admin.html this shows login too.
    showLoginInterface();
  }
});

if (logoutAdminButton) {
  logoutAdminButton.addEventListener('click', logoutAdmin);
}

if (loginForm) loginForm.addEventListener('submit', loginAdmin);
if (productForm) productForm.addEventListener('submit', addProduct);
