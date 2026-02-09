// script.js - Tall Shops Guinée (Version Améliorée)
// WHATSAPP_NUMBER defined in index.html

(() => {
  const WHA = (typeof WHATSAPP_NUMBER !== 'undefined') ? WHATSAPP_NUMBER : '13478037813';
  const cart = [];
  
  // DOM Elements
  const cartPanel = document.getElementById('cart-panel');
  const cartBtnFloating = document.getElementById('cart-btn-floating');
  const cartBtn = document.getElementById('cart-btn');
  const closeCart = document.getElementById('close-cart');
  const cartItemsEl = document.getElementById('cart-items');
  const cartCountEls = [
    document.getElementById('cart-count'),
    document.getElementById('cart-count-floating')
  ];
  const cartTotalEl = document.getElementById('cart-total');
  const buyWhatsAll = document.getElementById('buy-whatsapp');
  const toast = document.getElementById('toast');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const navFilters = document.querySelectorAll('.nav-filter');
  const productGrid = document.getElementById('product-grid');
  const contactLink = document.getElementById('contact-link');
  const yearEl = document.getElementById('year');
  
  // Product Modal Elements
  const productModal = document.getElementById('productModal');
  const modalOverlay = productModal?.querySelector('.modal-overlay');
  const modalClose = productModal?.querySelector('.modal-close');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalPrice = document.getElementById('modalPrice');
  const addToCartModalBtn = productModal?.querySelector('.add-to-cart-modal');
  const buyWhatsappModalBtn = productModal?.querySelector('.buy-whatsapp-modal');
  
  // Zoom Controls
  const zoomInBtn = productModal?.querySelector('.zoom-in');
  const zoomOutBtn = productModal?.querySelector('.zoom-out');
  const zoomResetBtn = productModal?.querySelector('.zoom-reset');
  const imageContainer = productModal?.querySelector('.image-container');
  
  // Modal State
  let currentProduct = null;
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let initialX = 0;
  let initialY = 0;
  
  // Touch state for swipe
  let touchStartX = 0;
  let touchStartY = 0;
  
  // Set current year
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  
  // Helpers
  const formatGNF = v => v.toLocaleString('fr-FR') + ' GNF';
  
  const showToast = (txt) => {
    if (!toast) return;
    toast.textContent = txt;
    toast.style.opacity = 1;
    setTimeout(() => toast.style.opacity = 0, 2000);
  };
  
  // ==================== CART FUNCTIONS ====================
  
  function findItem(id) {
    return cart.find(i => i.id === id);
  }
  
  function addToCart(obj) {
    const found = findItem(obj.id);
    if (found) {
      found.qty += 1;
    } else {
      cart.push({ ...obj, qty: 1 });
    }
    renderCart();
    saveCart();
    showToast('✅ Ajouté au panier');
    openCart();
  }
  
  function renderCart() {
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    cartItemsEl.innerHTML = '';
    
    if (cart.length === 0) {
      cartItemsEl.innerHTML = '<div style="padding:20px;color:#999;text-align:center;">Votre panier est vide</div>';
      cartCountEls.forEach(e => e && (e.textContent = 0));
      cartTotalEl.textContent = 'Total: 0 GNF';
      return;
    }
    
    cart.forEach(it => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${it.image}" alt="${it.name}">
        <div class="meta">
          <div class="name">${it.name}</div>
          <div class="price">${formatGNF(it.price)} × ${it.qty}</div>
        </div>
        <div class="cart-controls">
          <button class="small-qty plus" data-id="${it.id}">+</button>
          <button class="small-qty minus" data-id="${it.id}">−</button>
          <button class="small-del" data-id="${it.id}">✕</button>
        </div>
      `;
      cartItemsEl.appendChild(div);
    });
    
    cartCountEls.forEach(e => e && (e.textContent = cart.reduce((s, i) => s + i.qty, 0)));
    cartTotalEl.textContent = 'Total: ' + formatGNF(total);
    
    // Bind controls
    cartItemsEl.querySelectorAll('.small-del').forEach(b =>
      b.addEventListener('click', () => removeFromCart(b.dataset.id))
    );
    cartItemsEl.querySelectorAll('.plus').forEach(b =>
      b.addEventListener('click', () => changeQty(b.dataset.id, 1))
    );
    cartItemsEl.querySelectorAll('.minus').forEach(b =>
      b.addEventListener('click', () => changeQty(b.dataset.id, -1))
    );
  }
  
  function removeFromCart(id) {
    const idx = cart.findIndex(i => i.id === id);
    if (idx > -1) cart.splice(idx, 1);
    renderCart();
    saveCart();
  }
  
  function changeQty(id, delta) {
    const it = findItem(id);
    if (!it) return;
    it.qty += delta;
    if (it.qty < 1) removeFromCart(id);
    else {
      renderCart();
      saveCart();
    }
  }
  
  function openCart() {
    cartPanel.classList.add('open');
    cartPanel.setAttribute('aria-hidden', 'false');
  }
  
  function closeCartFn() {
    cartPanel.classList.remove('open');
    cartPanel.setAttribute('aria-hidden', 'true');
  }
  
  // ==================== PRODUCT MODAL FUNCTIONS ====================
  
  function openProductModal(product) {
    currentProduct = product;
    
    modalImage.src = product.image;
    modalTitle.textContent = product.name;
    modalPrice.textContent = formatGNF(product.price);
    
    // Reset zoom and position
    scale = 1;
    translateX = 0;
    translateY = 0;
    updateImageTransform();
    
    productModal.style.display = 'flex';
    setTimeout(() => productModal.classList.add('show'), 10);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }
  
  function closeProductModal() {
    productModal.classList.remove('show');
    setTimeout(() => {
      productModal.style.display = 'none';
      currentProduct = null;
      document.body.style.overflow = '';
    }, 300);
  }
  
  function updateImageTransform() {
    if (!modalImage) return;
    modalImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
  }
  
  function zoomIn() {
    scale = Math.min(scale + 0.3, 3);
    updateImageTransform();
  }
  
  function zoomOut() {
    scale = Math.max(scale - 0.3, 1);
    if (scale === 1) {
      translateX = 0;
      translateY = 0;
    }
    updateImageTransform();
  }
  
  function resetZoom() {
    scale = 1;
    translateX = 0;
    translateY = 0;
    updateImageTransform();
  }
  
  // ==================== DRAG/PAN FUNCTIONALITY ====================
  
  function startDrag(e) {
    if (scale <= 1) return;
    
    isDragging = true;
    imageContainer.style.cursor = 'grabbing';
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    startX = clientX;
    startY = clientY;
    initialX = translateX;
    initialY = translateY;
  }
  
  function drag(e) {
    if (!isDragging || scale <= 1) return;
    
    e.preventDefault();
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;
    
    translateX = initialX + deltaX;
    translateY = initialY + deltaY;
    
    updateImageTransform();
  }
  
  function stopDrag() {
    isDragging = false;
    imageContainer.style.cursor = scale > 1 ? 'move' : 'default';
  }
  
  // ==================== EVENT LISTENERS ====================
  
  // Product click - Open modal
  document.addEventListener('click', (e) => {
    // Open modal on product image click
    if (e.target.matches('.product-image')) {
      const prod = e.target.closest('.product');
      const product = {
        id: prod.dataset.id,
        name: prod.dataset.name,
        price: parseInt(prod.dataset.price, 10),
        image: prod.dataset.image
      };
      openProductModal(product);
      return;
    }
    
    // Add to cart
    if (e.target.matches('.add-btn') || e.target.closest('.add-btn')) {
      const btn = e.target.matches('.add-btn') ? e.target : e.target.closest('.add-btn');
      const prod = btn.closest('.product');
      const item = {
        id: prod.dataset.id,
        name: prod.dataset.name,
        price: parseInt(prod.dataset.price, 10),
        image: prod.dataset.image
      };
      addToCart(item);
    }
    
    // Buy single on WhatsApp
    if (e.target.matches('.whatsapp-btn') || e.target.closest('.whatsapp-btn')) {
      e.stopPropagation();
      const btn = e.target.matches('.whatsapp-btn') ? e.target : e.target.closest('.whatsapp-btn');
      const prod = btn.closest('.product');
      buySingleProduct(prod.dataset.name, parseInt(prod.dataset.price, 10), prod.dataset.image);
    }
  });
  
  // Modal actions
  if (modalClose) {
    modalClose.addEventListener('click', closeProductModal);
  }
  
  if (modalOverlay) {
    modalOverlay.addEventListener('click', closeProductModal);
  }
  
  if (addToCartModalBtn && currentProduct) {
    addToCartModalBtn.addEventListener('click', () => {
      if (currentProduct) {
        addToCart(currentProduct);
        closeProductModal();
      }
    });
  }
  
  if (buyWhatsappModalBtn) {
    buyWhatsappModalBtn.addEventListener('click', () => {
      if (currentProduct) {
        buySingleProduct(currentProduct.name, currentProduct.price, currentProduct.image);
        closeProductModal();
      }
    });
  }
  
  // Zoom controls
  if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
  if (zoomResetBtn) zoomResetBtn.addEventListener('click', resetZoom);
  
  // Drag/Pan on modal image
  if (imageContainer) {
    // Mouse events
    imageContainer.addEventListener('mousedown', startDrag);
    imageContainer.addEventListener('mousemove', drag);
    imageContainer.addEventListener('mouseup', stopDrag);
    imageContainer.addEventListener('mouseleave', stopDrag);
    
    // Touch events
    imageContainer.addEventListener('touchstart', startDrag, { passive: false });
    imageContainer.addEventListener('touchmove', drag, { passive: false });
    imageContainer.addEventListener('touchend', stopDrag);
  }
  
  // Keyboard support for modal
  document.addEventListener('keydown', (e) => {
    if (!productModal.classList.contains('show')) return;
    
    if (e.key === 'Escape') {
      closeProductModal();
    } else if (e.key === '+' || e.key === '=') {
      zoomIn();
    } else if (e.key === '-') {
      zoomOut();
    } else if (e.key === '0') {
      resetZoom();
    }
  });
  
  // Swipe to close modal on mobile
  if (productModal) {
    productModal.addEventListener('touchstart', (e) => {
      if (e.target === modalOverlay || e.target.closest('.modal-overlay')) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });
    
    productModal.addEventListener('touchend', (e) => {
      if (e.target === modalOverlay || e.target.closest('.modal-overlay')) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // Swipe down to close
        if (Math.abs(diffY) > 100 && Math.abs(diffY) > Math.abs(diffX)) {
          closeProductModal();
        }
      }
    });
  }
  
  // Buy all on WhatsApp
  buyWhatsAll && buyWhatsAll.addEventListener('click', () => {
    if (cart.length === 0) {
      showToast('⚠️ Votre panier est vide');
      return;
    }
    
    let message = '🛍️ Nouvelle commande Tall Shops Guinée%0A%0A';
    cart.forEach(i => {
      const imgUrl = `${window.location.origin}/${i.image}`;
      message += `• ${i.name} — ${i.qty} × ${formatGNF(i.price)}%0A📸 ${imgUrl}%0A%0A`;
    });
    
    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    message += `💰 Total : ${formatGNF(total)}%0A%0AMerci de confirmer la disponibilité et la livraison.`;
    
    window.open(`https://wa.me/${WHA}?text=${message}`, '_blank');
  });
  
  // Buy single product directly
  function buySingleProduct(name, price, image) {
    const imageUrl = `${window.location.origin}/${image}`;
    const message = `🛍️ Nouvelle commande Tall Shops Guinée%0A%0A• ${name} — 1 × ${formatGNF(price)}%0A📸 ${imageUrl}%0A%0AMerci de confirmer la disponibilité.`;

    window.open(`https://wa.me/${WHA}?text=${message}`, '_blank');
  }
  
  // Cart open/close
  cartBtnFloating && cartBtnFloating.addEventListener('click', openCart);
  cartBtn && cartBtn.addEventListener('click', openCart);
  closeCart && closeCart.addEventListener('click', closeCartFn);
  
  // Filters
  filterBtns.forEach(b => b.addEventListener('click', () => {
    filterBtns.forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    filterProducts(b.dataset.filter);
  }));
  
  navFilters.forEach(link => link.addEventListener('click', (e) => {
    e.preventDefault();
    const cat = link.dataset.filter;
    
    document.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active'));
    const btn = document.querySelector(`.filter-btn[data-filter="${cat}"]`);
    if (btn) btn.classList.add('active');
    
    filterProducts(cat);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
  }));
  
  function filterProducts(filter) {
    document.querySelectorAll('.product').forEach(p => {
      if (filter === 'all' || !filter) {
        p.style.display = '';
      } else {
        p.style.display = p.dataset.category === filter ? '' : 'none';
      }
    });
  }
  
  // Contact link opens WhatsApp
  contactLink && contactLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.open(`https://wa.me/${WHA}`, '_blank');
  });
  
  // ==================== LOCALSTORAGE PERSISTENCE ====================
  
  function saveCart() {
    try {
      localStorage.setItem('tall_cart_v2', JSON.stringify(cart));
    } catch (e) {
      console.error('Error saving cart:', e);
    }
  }
  
  function loadCart() {
    try {
      const saved = localStorage.getItem('tall_cart_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          parsed.forEach(i => cart.push(i));
          renderCart();
        }
      }
    } catch (e) {
      console.error('Error loading cart:', e);
    }
  }
  
  // Save cart on beforeunload
  window.addEventListener('beforeunload', saveCart);
  
  // ==================== INITIALIZATION ====================
  
  // Load cart from localStorage
  loadCart();
  
  // Initial render
  renderCart();
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || href.startsWith('#!')) return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  
  console.log('✅ Tall Shops Guinée - Loaded successfully');
})();