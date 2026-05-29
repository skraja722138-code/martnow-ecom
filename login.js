const userLoginForm = document.getElementById('user-login-form');
const adminLoginForm = document.getElementById('admin-login-form');

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  window.setTimeout(() => {
    toast.classList.remove('visible');
    window.setTimeout(() => toast.remove(), 220);
  }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

function navigateToUser() {
  localStorage.setItem('martnowUser', 'user');
  localStorage.removeItem('adminPassword');
  window.location.href = '/user.html';
}

function navigateToAdmin() {
  localStorage.setItem('martnowUser', 'admin');
  window.location.href = '/admin.html';
}

userLoginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const password = document.getElementById('user-password').value.trim();
  const email = document.getElementById('user-email').value.trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password !== 'user123') {
    showToast('Please use the demo credentials: user@example.com / user123', 'error');
    return;
  }

  showToast('Welcome back! Your customer dashboard is loading.', 'success');
  navigateToUser();
});

adminLoginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = document.getElementById('admin-password').value.trim();

  if (!password) {
    showToast('Enter your admin password to continue.', 'error');
    return;
  }

  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });

  if (response.ok) {
    localStorage.setItem('adminPassword', password);
    showToast('Admin access granted.', 'success');
    navigateToAdmin();
  } else {
    localStorage.removeItem('adminPassword');
    showToast('Invalid admin password. Use admin123.', 'error');
  }
});
