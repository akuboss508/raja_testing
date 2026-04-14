// ============================================
// CONFIGURATION
// ============================================
const API_URL = 'https://script.google.com/macros/s/AKfycbxU4FSnQ7K19pn4gOJdgP2l01lQ-G_QeuShFghmpXN5sFPSaFSToeolLg_Gq-ZVpIjD/exec';
const IMGBB_API_KEY = '886868f3fbb7fc9caefcd3069644ffa9';
const ADMIN_PASSWORD = 'lucky2024';

let menuItems = [];
let cart = [];
let isAdmin = false;

// DOM elements (existing)
const menuGrid = document.getElementById('menuGridShop');
const categoryPills = document.getElementById('categoryPills');
const cartCountSpan = document.getElementById('cartCount');
const cartCountSide = document.getElementById('cartCountSide');
const cartDrawer = document.getElementById('cartDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const cartDrawerItems = document.getElementById('cartDrawerItems');
const drawerTotal = document.getElementById('drawerTotal');
const cartItemsSide = document.getElementById('cartItemsSide');
const cartTotalSide = document.getElementById('cartTotalSide');
const orderDetailsInput = document.getElementById('orderDetails');
const searchInput = document.getElementById('searchInput');

// Admin DOM elements
const loginModalOverlay = document.getElementById('loginModalOverlay');
const adminPanelOverlay = document.getElementById('adminPanelOverlay');
const adminTrigger = document.getElementById('adminTrigger');
const closeLoginModal = document.getElementById('closeLoginModal');
const closeAdminPanel = document.getElementById('closeAdminPanel');
const loginBtn = document.getElementById('loginBtn');
const adminPassword = document.getElementById('adminPassword');
const loginError = document.getElementById('loginError');
const saveAdminItemBtn = document.getElementById('saveAdminItem');
const cancelAdminForm = document.getElementById('cancelAdminForm');
const refreshAdminItemsBtn = document.getElementById('refreshAdminItems');
const adminItemsTable = document.getElementById('adminItemsTable');
const adminItemId = document.getElementById('adminItemId');
const adminItemName = document.getElementById('adminItemName');
const adminItemCategory = document.getElementById('adminItemCategory');
const adminItemPrice = document.getElementById('adminItemPrice');
const adminItemMinQty = document.getElementById('adminItemMinQty');
const adminItemDesc = document.getElementById('adminItemDesc');
const adminItemImage = document.getElementById('adminItemImage');
const imageUpload = document.getElementById('imageUpload');
const uploadStatus = document.getElementById('uploadStatus');
const adminCategoryList = document.getElementById('adminCategoryList');

// ============================================
// FETCH MENU FROM GOOGLE SHEETS
// ============================================
async function fetchMenu() {
  try {
    const response = await fetch(API_URL);
    menuItems = await response.json();
    renderCategoryPills();
    renderMenuGrid(menuItems);
    updateAdminCategoryDatalist();
  } catch (error) {
    console.error('Gagal memuatkan menu:', error);
    menuGrid.innerHTML = '<p class="empty-cart">Menu tidak dapat dimuatkan. Sila cuba lagi.</p>';
  }
}

// ============================================
// RENDER FUNCTIONS
// ============================================
function getCategories() {
  return [...new Set(menuItems.map(i => i.category))];
}

function renderCategoryPills() {
  const categories = getCategories();
  let html = `<button class="cat-pill active" data-cat="all">Semua</button>`;
  categories.forEach(cat => html += `<button class="cat-pill" data-cat="${cat}">${cat}</button>`);
  categoryPills.innerHTML = html;
  document.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterAndRender(btn.dataset.cat);
    });
  });
}

function filterAndRender(category) {
  const searchTerm = searchInput.value.toLowerCase();
  let filtered = category === 'all' ? menuItems : menuItems.filter(i => i.category === category);
  if (searchTerm) {
    filtered = filtered.filter(i => i.name.toLowerCase().includes(searchTerm) || (i.description || '').toLowerCase().includes(searchTerm));
  }
  renderMenuGrid(filtered);
}

function renderMenuGrid(items) {
  let html = '';
  items.forEach(item => {
    const minDisplay = item.minQty > 1 ? `Min: ${item.minQty} unit` : '';
    html += `
      <div class="menu-card-shop">
        <div class="menu-img-shop"><img src="${item.image}" alt="${item.name}"></div>
        <div class="menu-info-shop">
          <div class="menu-name">${item.name}</div>
          <div class="menu-desc-shop">${item.description || ''}</div>
          <div class="menu-price-shop">RM${parseFloat(item.price).toFixed(2)}</div>
          ${minDisplay ? `<div class="min-qty-badge">${minDisplay}</div>` : ''}
          <button class="btn-add" data-item='${JSON.stringify(item)}'><i class="fas fa-plus"></i> Tambah</button>
        </div>
      </div>
    `;
  });
  menuGrid.innerHTML = html || '<p class="empty-cart">Tiada menu ditemui.</p>';
  document.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const item = JSON.parse(btn.dataset.item);
      addToCart(item);
    });
  });
}

// ============================================
// CART LOGIC
// ============================================
function addToCart(item) {
  let quantity = item.minQty || 1;
  if (item.minQty && quantity < item.minQty) {
    alert(`Minimum order untuk ${item.name} ialah ${item.minQty} unit.`);
    return;
  }
  const existing = cart.find(i => i.id === item.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...item, quantity });
  }
  updateCartUI();
  openDrawer();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function updateQuantity(index, delta) {
  const item = cart[index];
  const newQty = item.quantity + delta;
  if (item.minQty && newQty < item.minQty) {
    alert(`Minimum order untuk ${item.name} ialah ${item.minQty} unit.`);
    return;
  }
  if (newQty <= 0) {
    cart.splice(index, 1);
  } else {
    item.quantity = newQty;
  }
  updateCartUI();
}

function updateCartUI() {
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  cartCountSpan.textContent = totalItems;
  if (cartCountSide) cartCountSide.textContent = `(${totalItems})`;
  
  let drawerHtml = '';
  cart.forEach((item, idx) => {
    drawerHtml += `
      <div class="cart-item-side">
        <div class="cart-item-info-side">
          <i class="fas fa-trash-alt" onclick="removeFromCart(${idx})"></i>
          <span>${item.name} (${item.quantity})</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button onclick="updateQuantity(${idx}, -1)" style="background:none; border:none; font-size:1.2rem;">−</button>
          <span>${item.quantity}</span>
          <button onclick="updateQuantity(${idx}, 1)" style="background:none; border:none; font-size:1.2rem;">+</button>
          <span>RM${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      </div>
    `;
  });
  cartDrawerItems.innerHTML = drawerHtml || '<p class="empty-cart">Bakul kosong.</p>';
  drawerTotal.textContent = `RM${totalPrice.toFixed(2)}`;
  
  let sideHtml = '';
  cart.forEach((item, idx) => {
    sideHtml += `
      <div class="cart-item-side">
        <div class="cart-item-info-side">
          <i class="fas fa-trash-alt" onclick="removeFromCart(${idx})"></i>
          <span>${item.name} x${item.quantity}</span>
        </div>
        <span>RM${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `;
  });
  if (cartItemsSide) cartItemsSide.innerHTML = sideHtml || '<p class="empty-cart">Tiada item.</p>';
  if (cartTotalSide) cartTotalSide.textContent = `RM${totalPrice.toFixed(2)}`;
  
  const orderSummary = cart.map(i => `${i.name} x${i.quantity} (RM${(i.price*i.quantity).toFixed(2)})`).join(', ');
  orderDetailsInput.value = `Pesanan: ${orderSummary} | Jumlah: RM${totalPrice.toFixed(2)}`;
}

window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;

// ============================================
// DRAWER CONTROLS
// ============================================
function openDrawer() {
  cartDrawer.classList.add('active');
  drawerOverlay.classList.add('active');
}
function closeDrawer() {
  cartDrawer.classList.remove('active');
  drawerOverlay.classList.remove('active');
}

// ============================================
// FORM SUBMISSION
// ============================================
function setupForm() {
  const form = document.getElementById('orderForm');
  const statusDiv = document.getElementById('formStatus');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const locationInput = document.getElementById('location');
    const locationValue = locationInput.value.trim().toLowerCase();
    const excluded = ['jeli', 'gua musang', 'kuala krai', 'guamusang', 'kualakrai'];
    if (excluded.some(d => locationValue.includes(d))) {
      const msg = `Maaf, kawasan ${locationInput.value} tidak diliputi. Kami hanya beroperasi di Kelantan kecuali Jeli, Gua Musang, Kuala Krai.\n\nTekan OK jika anda pasti lokasi ini dalam liputan, atau Batal untuk ubah.`;
      if (!confirm(msg)) {
        locationInput.focus();
        return;
      }
    }
    
    if (cart.length === 0) {
      statusDiv.innerHTML = '<span class="error">⚠️ Sila tambah item ke bakul.</span>';
      return;
    }
    statusDiv.innerHTML = '<span style="color:#e63946;">Menghantar...</span>';
    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      location: document.getElementById('location').value,
      eventDate: document.getElementById('eventDate').value || 'Tidak dinyatakan',
      notes: document.getElementById('notes').value || 'Tiada',
      orderDetails: orderDetailsInput.value,
      timestamp: new Date().toLocaleString('ms-MY')
    };
    fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(formData).toString()
    })
    .then(() => {
      statusDiv.innerHTML = '<span class="success">✨ Tempahan dihantar! Kami akan hubungi anda.</span>';
      form.reset();
      cart = [];
      updateCartUI();
      closeDrawer();
    })
    .catch(() => statusDiv.innerHTML = '<span class="error">❌ Ralat. Sila hubungi 010-944 1083.</span>');
  });
}

// ============================================
// ADMIN FUNCTIONS
// ============================================
function updateAdminCategoryDatalist() {
  const categories = [...new Set(menuItems.map(i => i.category))];
  adminCategoryList.innerHTML = categories.map(c => `<option value="${c}">`).join('');
}

async function loadAdminItems() {
  await fetchMenu();
  renderAdminTable();
}

function renderAdminTable() {
  let html = '';
  menuItems.forEach(item => {
    html += `<tr>
      <td><strong>${item.name}</strong><br><small>${item.description || ''}</small></td>
      <td>RM ${parseFloat(item.price).toFixed(2)}</td>
      <td class="actions">
        <i class="fas fa-edit" onclick="editAdminItem('${item.id}')"></i>
        <i class="fas fa-trash-alt" onclick="deleteAdminItem('${item.id}')"></i>
      </td>
    </tr>`;
  });
  adminItemsTable.innerHTML = html || '<tr><td colspan="3">Tiada item.</td></tr>';
}

function clearAdminForm() {
  adminItemId.value = '';
  adminItemName.value = '';
  adminItemCategory.value = '';
  adminItemPrice.value = '';
  adminItemMinQty.value = '1';
  adminItemDesc.value = '';
  adminItemImage.value = '';
  uploadStatus.innerHTML = '';
}

window.editAdminItem = function(id) {
  const item = menuItems.find(i => i.id === id);
  if (!item) return;
  adminItemId.value = item.id;
  adminItemName.value = item.name;
  adminItemCategory.value = item.category;
  adminItemPrice.value = item.price;
  adminItemMinQty.value = item.minQty || 1;
  adminItemDesc.value = item.description || '';
  adminItemImage.value = item.image || '';
};

window.deleteAdminItem = async function(id) {
  if (!confirm('Padam item ini?')) return;
  const formData = new URLSearchParams();
  formData.append('action', 'delete');
  formData.append('id', id);
  await fetch(API_URL, { method: 'POST', body: formData });
  await loadAdminItems();
};

async function saveAdminItem() {
  const id = adminItemId.value;
  const name = adminItemName.value.trim();
  const category = adminItemCategory.value.trim();
  const price = adminItemPrice.value;
  const minQty = adminItemMinQty.value || '1';
  const desc = adminItemDesc.value.trim();
  const image = adminItemImage.value.trim();

  if (!name || !category || !price) {
    alert('Sila isi Nama, Kategori, dan Harga.');
    return;
  }

  const formData = new URLSearchParams();
  formData.append('action', id ? 'update' : 'add');
  if (id) formData.append('id', id);
  formData.append('name', name);
  formData.append('category', category);
  formData.append('price', price);
  formData.append('minQty', minQty);
  formData.append('description', desc);
  formData.append('image', image);

  await fetch(API_URL, { method: 'POST', body: formData });
  await loadAdminItems();
  clearAdminForm();
}

// Image upload to ImgBB
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error('Upload failed');
    }
  } catch (err) {
    console.error(err);
    alert('Gagal memuat naik imej.');
    return null;
  }
}

// ============================================
// UI SETUP
// ============================================
function setupUI() {
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('mobileNav').classList.toggle('active');
  });
  document.getElementById('cartIcon').addEventListener('click', openDrawer);
  document.getElementById('closeDrawer').addEventListener('click', closeDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);
  document.getElementById('checkoutDrawerBtn').addEventListener('click', () => {
    closeDrawer();
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
  });
  searchInput.addEventListener('input', () => {
    const activeCat = document.querySelector('.cat-pill.active')?.dataset.cat || 'all';
    filterAndRender(activeCat);
  });

  // Direct admin login trigger (click "Admin" link in footer)
  adminTrigger.addEventListener('click', (e) => {
    e.preventDefault();
    loginModalOverlay.classList.add('active');
    adminPassword.value = '';
    loginError.innerHTML = '';
  });

  // Login
  loginBtn.addEventListener('click', () => {
    if (adminPassword.value === ADMIN_PASSWORD) {
      isAdmin = true;
      loginModalOverlay.classList.remove('active');
      adminPanelOverlay.classList.add('active');
      loadAdminItems();
    } else {
      loginError.innerHTML = '❌ Kata laluan salah!';
    }
  });

  adminPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });

  closeLoginModal.addEventListener('click', () => loginModalOverlay.classList.remove('active'));
  closeAdminPanel.addEventListener('click', () => adminPanelOverlay.classList.remove('active'));

  // Admin form
  saveAdminItemBtn.addEventListener('click', saveAdminItem);
  cancelAdminForm.addEventListener('click', clearAdminForm);
  refreshAdminItemsBtn.addEventListener('click', loadAdminItems);

  imageUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadStatus.innerHTML = 'Memuat naik...';
    const url = await uploadImage(file);
    if (url) {
      adminItemImage.value = url;
      uploadStatus.innerHTML = '✅ Imej dimuat naik!';
    } else {
      uploadStatus.innerHTML = '';
    }
    imageUpload.value = '';
  });
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  await fetchMenu();
  updateCartUI();
  setupForm();
  setupUI();
});