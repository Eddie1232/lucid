    document.addEventListener('DOMContentLoaded', () => {
    // Slider functionality
    const slides = Array.from(document.querySelectorAll('.slide'));
    const prevButton = document.querySelector('.control.prev');
    const nextButton = document.querySelector('.control.next');
    let currentIndex = 0;
    let slideInterval = null;

    function showSlide(index) {
        slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === index);
        });
        currentIndex = index;
    }

    function nextSlide() {
        const nextIndex = (currentIndex + 1) % slides.length;
        showSlide(nextIndex);
    }

    function prevSlide() {
        const prevIndex = (currentIndex - 1 + slides.length) % slides.length;
        showSlide(prevIndex);
    }

    function startAutoSlide() {
        slideInterval = setInterval(nextSlide, 3500);
    }

    function resetAutoSlide() {
        clearInterval(slideInterval);
        startAutoSlide();
    }

    if (prevButton && nextButton) {
        prevButton.addEventListener('click', () => {
        prevSlide();
        resetAutoSlide();
        });

        nextButton.addEventListener('click', () => {
        nextSlide();
        resetAutoSlide();
        });
    }

    const menuToggle = document.getElementById('menuToggle');
    const mobileNav = document.getElementById('mobileNav');
    const mobileNavClose = document.getElementById('mobileNavClose');

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
        mobileNav.classList.add('open');
        });
    }

    if (mobileNavClose && mobileNav) {
        mobileNavClose.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        });
    }

    if (mobileNav) {
        mobileNav.addEventListener('click', (e) => {
        if (e.target === mobileNav) {
            mobileNav.classList.remove('open');
        }
        });
    }

    if (slides.length > 0) {
        showSlide(0);
        startAutoSlide();
    }

    // Modal functionality for product images
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const closeModal = document.querySelector('.close-modal');
    const productImages = document.querySelectorAll('.product-card img, .shop-item img');

    if (modal && modalImage && closeModal) {
        productImages.forEach(img => {
        img.addEventListener('click', () => {
            modalImage.src = img.src;
            modalImage.alt = img.alt;
            modal.classList.add('show');
        });
        });

        closeModal.addEventListener('click', () => {
        modal.classList.remove('show');
        });

        modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
        });
    }

    // Cart functionality
    let cart = JSON.parse(localStorage.getItem('lucidCart')) || [];
    const cartCount = document.querySelector('.cart-count');
    const wishlistBadge = document.querySelector('.wishlist-count');

    function updateCartCount() {
        if (cartCount) {
        const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.textContent = total;
        }
    }

    function updateWishlistCount() {
      if (wishlistBadge) {
        wishlistBadge.textContent = getWishlistCount();
      }
    }

    function showToast(message, type = 'success', duration = 3000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '!' };
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || '○'}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close notification">×</button>
        `;

        container.appendChild(toast);

        const closeBtn = toast.querySelector('.toast-close');
        const removeToast = () => {
            toast.classList.add('exit');
            setTimeout(() => toast.remove(), 300);
        };

        closeBtn.addEventListener('click', removeToast);
        if (duration > 0) {
            setTimeout(removeToast, duration);
        }
    }

    function addToCart(item, quantity = 1) {
        quantity = Math.max(1, parseInt(quantity) || 1);
        
        // Check if item already exists in cart (same name and size)
        const existingItem = cart.find(cartItem => cartItem.name === item.name && cartItem.size === item.size);
        
        if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + quantity;
        } else {
        item.quantity = quantity;
        cart.push(item);
        }
        
        localStorage.setItem('lucidCart', JSON.stringify(cart));
        updateCartCount();
        // Show toast feedback
        const quantityText = quantity > 1 ? `${quantity} items` : 'item';
        showToast(`${item.name} (${quantityText}) added to cart!`, 'success', 3000);
    }

    window.addToCart = addToCart;

    function getWishlist() {
      return JSON.parse(localStorage.getItem('lucidWishlist') || '[]');
    }

    function saveWishlist(wishlist) {
      localStorage.setItem('lucidWishlist', JSON.stringify(wishlist));
    }

    function isWishlisted(slug) {
      return getWishlist().includes(slug);
    }

    function toggleWishlist(slug) {
      const wishlist = getWishlist();
      const index = wishlist.indexOf(slug);
      const added = index === -1;
      if (added) {
        wishlist.push(slug);
      } else {
        wishlist.splice(index, 1);
      }
      saveWishlist(wishlist);
      updateWishlistCount();
      showToast(added ? 'Saved to wishlist.' : 'Removed from wishlist.', added ? 'success' : 'info', 2500);
      return added;
    }

    function getWishlistCount() {
      return getWishlist().length;
    }

    function getProductReviews(slug) {
      return JSON.parse(localStorage.getItem(`lucidReviews_${slug}`) || '[]');
    }

    function saveProductReviews(slug, reviews) {
      localStorage.setItem(`lucidReviews_${slug}`, JSON.stringify(reviews));
    }

    function submitProductReview(slug, review) {
      const reviews = getProductReviews(slug);
      reviews.unshift(review);
      saveProductReviews(slug, reviews);
      return reviews;
    }

    function getAverageProductRating(slug) {
      const reviews = getProductReviews(slug);
      if (!reviews.length) return 0;
      return reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length;
    }

    function getRatingSummary(slug) {
      const reviews = getProductReviews(slug);
      const average = getAverageProductRating(slug);
      return {
        average,
        count: reviews.length
      };
    }

    function getRelatedProducts(currentSlug, count = 4) {
      const products = loadProducts();
      const current = products.find(product => product.name.toLowerCase().replace(/\s+/g, '-') === currentSlug);
      const sameCategory = products.filter(product => product.category === current?.category && product.name.toLowerCase().replace(/\s+/g, '-') !== currentSlug);
      if (sameCategory.length) {
        return sameCategory.slice(0, count);
      }
      return products.filter(product => product.name.toLowerCase().replace(/\s+/g, '-') !== currentSlug).slice(0, count);
    }

    function getRecommendedProducts(currentSlug, count = 4) {
      const products = loadProducts().filter(product => product.name.toLowerCase().replace(/\s+/g, '-') !== currentSlug);
      const scored = products.map(product => {
        const slug = product.name.toLowerCase().replace(/\s+/g, '-');
        const average = getAverageProductRating(slug);
        const reviewCount = getProductReviews(slug).length;
        return { product, score: average * 10 + reviewCount };
      });
      const topRated = scored.sort((a, b) => b.score - a.score).slice(0, count).map(item => item.product);
      if (topRated.length >= count) return topRated;
      return products.sort(() => Math.random() - 0.5).slice(0, count);
    }

    window.getWishlist = getWishlist;
    window.saveWishlist = saveWishlist;
    window.isWishlisted = isWishlisted;
    window.toggleWishlist = toggleWishlist;
    window.getWishlistCount = getWishlistCount;
    window.getProductReviews = getProductReviews;
    window.saveProductReviews = saveProductReviews;
    window.submitProductReview = submitProductReview;
    window.getAverageProductRating = getAverageProductRating;
    window.getRatingSummary = getRatingSummary;
    window.getRelatedProducts = getRelatedProducts;
    window.getRecommendedProducts = getRecommendedProducts;

    function getUsers() {
      return JSON.parse(localStorage.getItem('lucidUsers')) || [];
    }

    function saveUsers(users) {
      localStorage.setItem('lucidUsers', JSON.stringify(users));
    }

    function getCurrentUser() {
      return JSON.parse(localStorage.getItem('lucidCurrentUser')) || null;
    }

    function setCurrentUser(user) {
      localStorage.setItem('lucidCurrentUser', JSON.stringify(user));
      const users = getUsers();
      const index = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
      if (index !== -1) {
        users[index] = user;
      } else {
        users.push(user);
      }
      saveUsers(users);
    }

    function getSavedAddresses(email) {
      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === (email || getCurrentUser()?.email || '').toLowerCase());
      return user?.savedAddresses || [];
    }

    function saveAddressForUser(address) {
      const currentUser = getCurrentUser();
      if (!currentUser || !address) return null;
      currentUser.savedAddresses = currentUser.savedAddresses || [];
      currentUser.savedAddresses.push(address);
      setCurrentUser(currentUser);
      return currentUser.savedAddresses;
    }

    function removeSavedAddressForUser(index) {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.savedAddresses || index < 0 || index >= currentUser.savedAddresses.length) return null;
      currentUser.savedAddresses.splice(index, 1);
      setCurrentUser(currentUser);
      return currentUser.savedAddresses;
    }

    function getAddressLabel(address, index) {
      if (!address) return `Address ${index + 1}`;
      return `${address.label || 'Saved Address'} — ${address.city || address.country || 'Details'}`;
    }

    function renderSavedAddressesList() {
      const addressList = document.getElementById('savedAddressesList');
      if (!addressList) return;
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.savedAddresses || currentUser.savedAddresses.length === 0) {
        addressList.innerHTML = '<p class="empty-cart">No saved addresses yet.</p>';
        return;
      }
      addressList.innerHTML = currentUser.savedAddresses.map((address, index) => `
        <div class="saved-address-card">
          <div>
            <strong>${Security.sanitize(address.label || 'Saved Address')}</strong>
            <p>${Security.sanitize(address.street || address.full || '')}</p>
            <p>${Security.sanitize(address.city || '')} ${Security.sanitize(address.postalCode || '')}</p>
            <p>${Security.sanitize(address.country || '')}</p>
          </div>
          <button type="button" class="danger-btn remove-saved-address" data-index="${index}">Delete</button>
        </div>
      `).join('');
    }

    function clearSavedAddressSelection() {
      const savedShipping = document.getElementById('savedShippingAddresses');
      const savedBilling = document.getElementById('savedBillingAddresses');
      if (savedShipping) savedShipping.value = '';
      if (savedBilling) savedBilling.value = '';
    }

    window.getSavedAddresses = getSavedAddresses;
    window.saveAddressForUser = saveAddressForUser;
    window.removeSavedAddressForUser = removeSavedAddressForUser;
    window.getAddressLabel = getAddressLabel;
    window.renderSavedAddressesList = renderSavedAddressesList;

    function setFlashMessage(message) {
      sessionStorage.setItem('lucidFlashMessage', message);
    }

    function getFlashMessage() {
      const message = sessionStorage.getItem('lucidFlashMessage');
      sessionStorage.removeItem('lucidFlashMessage');
      return message;
    }

    // Security & Compliance Module
    const Security = {
      // Email validation
      validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email) && email.length <= 254;
      },

      // Password validation: min 8 chars, uppercase, lowercase, number
      validatePassword(password) {
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const isLongEnough = password.length >= 8;
        return { hasUpper, hasLower, hasNumber, isLongEnough, valid: hasUpper && hasLower && hasNumber && isLongEnough };
      },

      // Sanitize input to prevent XSS
      sanitize(str) {
        if (!str || typeof str !== 'string') return '';
        const map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };
        return str.replace(/[&<>"']/g, m => map[m]);
      },

      // Rate limiting for auth attempts
      getRateLimit(key) {
        const data = JSON.parse(localStorage.getItem(`rate_${key}`) || '{}');
        const now = Date.now();
        if (data.count && now - data.timestamp < 15 * 60 * 1000) {
          if (data.count >= 5) return true; // Rate limited
        } else {
          localStorage.setItem(`rate_${key}`, JSON.stringify({ count: 0, timestamp: now }));
        }
        return false;
      },

      incrementRateLimit(key) {
        const data = JSON.parse(localStorage.getItem(`rate_${key}`) || '{"count":0,"timestamp":0}');
        data.count++;
        localStorage.setItem(`rate_${key}`, JSON.stringify(data));
      },

      resetRateLimit(key) {
        localStorage.removeItem(`rate_${key}`);
      },

      // CSRF token generation (simple hash)
      generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
      },

      // Audit log sensitive actions
      auditLog(action, details = {}) {
        const timestamp = new Date().toISOString();
        const user = getCurrentUser();
        const entry = {
          timestamp,
          action,
          userId: user?.email || 'anonymous',
          details,
          userAgent: navigator.userAgent.substring(0, 100)
        };
        const logs = JSON.parse(localStorage.getItem('lucidAuditLogs') || '[]').slice(-99);
        logs.push(entry);
        localStorage.setItem('lucidAuditLogs', JSON.stringify(logs));
      },

      // Cookie consent management
      getCookieConsent() {
        return JSON.parse(localStorage.getItem('lucidCookieConsent') || '{}');
      },

      setCookieConsent(consent) {
        localStorage.setItem('lucidCookieConsent', JSON.stringify(consent));
      },

      // Export user data (GDPR)
      exportUserData() {
        const user = getCurrentUser();
        if (!user) return null;
        const users = getUsers();
        const userData = users.find(u => u.email === user.email);
        const orders = JSON.parse(localStorage.getItem('lucidOrders') || '[]').filter(o => o.userEmail === user.email);
        const cart = JSON.parse(localStorage.getItem('lucidCart') || '[]');
        return {
          exported: new Date().toISOString(),
          userProfile: userData ? { name: userData.name, email: userData.email } : null,
          orders,
          cart
        };
      },

      // Data privacy: anonymize before storage
      anonymizeEmail(email) {
        const [name, domain] = email.split('@');
        return name.substring(0, 2) + '*'.repeat(Math.max(1, name.length - 2)) + '@' + domain;
      }
    };

    window.Security = Security;

    function showWelcomeMessage() {
      const message = getFlashMessage();
      if (message) {
        showToast(message, 'success', 4000);
      }
    }

    // Cookie consent initialization
    function initCookieConsent() {
      const consent = Security.getCookieConsent();
      if (!consent.timestamp) {
        showCookieConsentBanner();
      }
    }

    function showCookieConsentBanner() {
      const banner = document.getElementById('cookieConsentBanner');
      if (banner) {
        banner.classList.add('show');
      }
    }

    function acceptAllCookies() {
      Security.setCookieConsent({
        timestamp: new Date().toISOString(),
        analytics: true,
        marketing: true,
        essential: true
      });
      hideCookieConsentBanner();
      showToast('Cookie preferences saved. Thank you!', 'success', 2500);
    }

    function acceptEssentialCookies() {
      Security.setCookieConsent({
        timestamp: new Date().toISOString(),
        analytics: false,
        marketing: false,
        essential: true
      });
      hideCookieConsentBanner();
      showToast('Essential cookies enabled.', 'info', 2500);
    }

    function hideCookieConsentBanner() {
      const banner = document.getElementById('cookieConsentBanner');
      if (banner) {
        banner.classList.remove('show');
      }
    }

    window.acceptAllCookies = acceptAllCookies;
    window.acceptEssentialCookies = acceptEssentialCookies;

    function logoutUser() {
      clearCurrentUser();
      clearPasswordResetToken();
      displayAuthMessage('Logged out successfully.');
      updateAuthUI();
    }

    function deleteCurrentUserAccount() {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        displayAuthMessage('No active account to delete.', true);
        return;
      }
      const confirmed = confirm('Delete your account permanently? This cannot be undone.');
      if (!confirmed) return;
      const users = getUsers().filter(u => u.email.toLowerCase() !== currentUser.email.toLowerCase());
      saveUsers(users);
      clearCurrentUser();
      clearPasswordResetToken();
      displayAuthMessage('Your account has been deleted permanently.');
      updateAuthUI();
    }

    function showAccountPanel(show) {
      const accountPanel = document.getElementById('accountPanel');
      const authTabs = document.querySelector('.auth-tabs');
      const loginForm = document.getElementById('loginForm');
      const signupForm = document.getElementById('signupForm');
      const forgotForm = document.getElementById('forgotForm');
      if (accountPanel) accountPanel.classList.toggle('hidden', !show);
      if (authTabs) authTabs.classList.toggle('hidden', show);
      if (loginForm) loginForm.classList.toggle('hidden', show);
      if (signupForm) signupForm.classList.toggle('hidden', show);
      if (forgotForm) forgotForm.classList.toggle('hidden', show);
      if (show) {
        const accountName = document.getElementById('accountName');
        const currentUser = getCurrentUser();
        if (accountName && currentUser) {
          accountName.textContent = currentUser.name;
        }
        renderSavedAddressesList();
      }
    }

    function updateAuthUI() {
      updateAccountLink();
      const currentUser = getCurrentUser();
      showAccountPanel(!!currentUser);
    }

    function registerUser(name, email, password, verified = true) {
      const users = getUsers();
      const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        if (!existing.verified) {
          return { error: 'An account is already pending verification for that email. Please verify your code or resend it.' };
        }
        return { error: 'An account already exists with that email.' };
      }
      const user = { name, email, password, verified };
      users.push(user);
      saveUsers(users);
      if (verified) {
        setCurrentUser(user);
      }
      return { success: true, user };
    }

    function saveSignupVerification(data) {
      localStorage.setItem('lucidSignupVerification', JSON.stringify(data));
    }

    function getSignupVerification() {
      return JSON.parse(localStorage.getItem('lucidSignupVerification')) || null;
    }

    function clearSignupVerification() {
      localStorage.removeItem('lucidSignupVerification');
    }

    function sendSignupVerification(name, email, password) {
      // Security validation
      if (!Security.validateEmail(email)) {
        return { error: 'Please enter a valid email address.' };
      }
      
      const nameCheck = name.trim();
      if (nameCheck.length < 2 || nameCheck.length > 100) {
        return { error: 'Name must be between 2 and 100 characters.' };
      }

      const passwordValidation = Security.validatePassword(password);
      if (!passwordValidation.valid) {
        const messages = [];
        if (!passwordValidation.isLongEnough) messages.push('at least 8 characters');
        if (!passwordValidation.hasUpper) messages.push('an uppercase letter');
        if (!passwordValidation.hasLower) messages.push('a lowercase letter');
        if (!passwordValidation.hasNumber) messages.push('a number');
        return { error: `Password must contain ${messages.join(', ')}.` };
      }

      // Check if email already exists
      const users = getUsers();
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { error: 'An account with that email already exists.' };
      }

      const verificationCode = generateVerificationCode();
      const result = registerUser(nameCheck, email.toLowerCase(), password, false);
      if (result.error) return result;
      
      saveSignupVerification({ email: email.toLowerCase(), code: verificationCode, expires: Date.now() + 10 * 60 * 1000 });
      Security.auditLog('signup_verification_sent', { email: Security.anonymizeEmail(email) });
      console.log(`Signup verification code for ${email}: ${verificationCode}`);
      return { success: true, email };
    }

    function activateVerifiedUser(code) {
      const pending = getSignupVerification();
      if (!pending) {
        return { error: 'No signup verification request found.' };
      }
      if (Date.now() > pending.expires) {
        clearSignupVerification();
        return { error: 'Verification code expired. Please sign up again.' };
      }
      if (pending.code !== code) {
        Security.auditLog('signup_verification_failed', { email: Security.anonymizeEmail(pending.email), reason: 'incorrect_code' });
        return { error: 'Incorrect verification code.' };
      }
      const users = getUsers();
      const index = users.findIndex(u => u.email.toLowerCase() === pending.email.toLowerCase());
      if (index === -1) {
        return { error: 'No matching account found for verification.' };
      }
      users[index].verified = true;
      users[index].createdAt = new Date().toISOString();
      saveUsers(users);
      clearSignupVerification();
      setCurrentUser(users[index]);
      Security.auditLog('signup_verified', { email: Security.anonymizeEmail(pending.email) });
      return { success: true, user: users[index] };
    }

    function loginUser(email, password) {
      // Rate limiting check
      if (Security.getRateLimit(`login_${email.toLowerCase()}`)) {
        Security.auditLog('login_rate_limited', { email: Security.anonymizeEmail(email) });
        return { error: 'Too many login attempts. Please try again in 15 minutes.' };
      }

      const users = getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        Security.incrementRateLimit(`login_${email.toLowerCase()}`);
        Security.auditLog('login_failed_no_account', { email: Security.anonymizeEmail(email) });
        return { error: 'No account found with that email.' };
      }
      if (!user.verified) {
        Security.incrementRateLimit(`login_${email.toLowerCase()}`);
        return { error: 'Account not verified yet. Please enter the signup verification code.' };
      }
      if (user.password !== password) {
        Security.incrementRateLimit(`login_${email.toLowerCase()}`);
        Security.auditLog('login_failed_wrong_password', { email: Security.anonymizeEmail(email) });
        return { error: 'Incorrect password. Try again or reset it.' };
      }
      
      // Successful login
      Security.resetRateLimit(`login_${email.toLowerCase()}`);
      user.lastLogin = new Date().toISOString();
      saveUsers(users);
      setCurrentUser(user);
      Security.auditLog('login_success', { email: Security.anonymizeEmail(email) });
      return { success: true, user };
    }

    function resetPassword(email, newPassword) {
      // Validate new password
      const validation = Security.validatePassword(newPassword);
      if (!validation.valid) {
        return { error: 'Password does not meet security requirements.' };
      }

      const users = getUsers();
      const index = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (index === -1) {
        Security.auditLog('password_reset_failed_no_account', { email: Security.anonymizeEmail(email) });
        return { error: 'No account found with that email.' };
      }
      users[index].password = newPassword;
      users[index].passwordChangedAt = new Date().toISOString();
      saveUsers(users);
      Security.auditLog('password_reset_success', { email: Security.anonymizeEmail(email) });
      return { success: true };
    }

    function updateAccountLink() {
      const accountLink = document.getElementById('accountLink');
      const currentUser = getCurrentUser();
      if (accountLink) {
        if (currentUser) {
          accountLink.textContent = `Hi, ${currentUser.name}`;
          accountLink.href = 'account.html';
        } else {
          accountLink.textContent = 'Account';
          accountLink.href = 'login.html';
        }
      }
    }

    updateAccountLink();
    showWelcomeMessage();
    initCookieConsent();

    // Ensure a visible Account link exists in the header nav on all pages
    (function ensureAccountNavLink(){
      try{
        const nav = document.querySelector('.nav-links');
        if (!nav) return;
        const exists = nav.querySelector('a#accountLink') || nav.querySelector('a[href="account.html"]');
        if (!exists) {
          const a = document.createElement('a');
          a.id = 'accountLink';
          a.href = getCurrentUser() ? 'account.html' : 'login.html';
          a.textContent = getCurrentUser() ? `Hi, ${getCurrentUser().name}` : 'Account';
          nav.appendChild(a);
        }
      }catch(e){console.warn('ensureAccountNavLink failed', e);}
    })();

    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
      button.addEventListener('click', () => {
        const itemElement = button.closest('.shop-item, .product-card');
        if (itemElement) {
          const img = itemElement.querySelector('img');
          const name = itemElement.querySelector('h3').textContent;
          const price = itemElement.querySelector('.price').textContent;

          // Quantity input on product card
          let quantity = 1;
          const qtyInput = itemElement.querySelector('.qty-input');
          if (qtyInput) {
            quantity = parseInt(qtyInput.value) || 1;
            qtyInput.value = 1;
          }

          const sizeSelect = itemElement.querySelector('.size-select');
          const size = sizeSelect ? sizeSelect.value : 'One Size';

          const item = {
            name: name,
            price: price,
            image: img.src,
            alt: img.alt,
            size: size
          };
          addToCart(item, quantity);
        }
      });
    });

    const shopFilter = document.getElementById('shopFilter');
    const shopSearch = document.getElementById('shopSearch');
    if (shopFilter) {
      const filterButtons = Array.from(shopFilter.querySelectorAll('.filter-btn'));
      const shopItems = Array.from(document.querySelectorAll('.shop-item'));
      let currentCategory = 'all';
      let currentQuery = '';

      function updateShopVisibility() {
        shopItems.forEach(item => {
          const itemCategory = item.dataset.category || 'all';
          const title = item.querySelector('h3')?.textContent.toLowerCase() || '';
          const description = (item.dataset.description || '').toLowerCase();
          const matchesCategory = currentCategory === 'all' || itemCategory === currentCategory;
          const matchesSearch = !currentQuery || title.includes(currentQuery) || description.includes(currentQuery);
          item.classList.toggle('hidden', !(matchesCategory && matchesSearch));
        });
      }

      function applyCategoryFilter(category) {
        currentCategory = category;
        filterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === category));
        updateShopVisibility();
      }

      filterButtons.forEach(button => {
        button.addEventListener('click', () => {
          applyCategoryFilter(button.dataset.filter);
        });
      });

      if (shopSearch) {
        shopSearch.addEventListener('input', () => {
          currentQuery = shopSearch.value.trim().toLowerCase();
          updateShopVisibility();
        });
      }

      applyCategoryFilter('all');
    }

    // Quick view modal functionality
    const quickViewModal = document.getElementById('quickViewModal');
    const quickViewImage = document.getElementById('quickViewImage');
    const quickViewTitle = document.getElementById('quickViewTitle');
    const quickViewPrice = document.getElementById('quickViewPrice');
    const quickViewDescription = document.getElementById('quickViewDescription');
    const closeQuickView = document.querySelector('.close-quick-view');
    const quickViewAddBtn = document.querySelector('.quick-view-add');
    const quickViewQuantity = document.getElementById('quickViewQuantity');
    const decreaseQtyBtn = document.getElementById('decreaseQty');
    const increaseQtyBtn = document.getElementById('increaseQty');
    const quickViewSize = document.getElementById('quickViewSize');

    if (quickViewModal && quickViewImage && quickViewTitle && quickViewPrice && quickViewDescription && closeQuickView && quickViewAddBtn) {
        // Quantity button controls
        if (decreaseQtyBtn) {
        decreaseQtyBtn.addEventListener('click', () => {
            const currentValue = parseInt(quickViewQuantity.value) || 1;
            if (currentValue > 1) {
            quickViewQuantity.value = currentValue - 1;
            }
        });
        }

        if (increaseQtyBtn) {
        increaseQtyBtn.addEventListener('click', () => {
            const currentValue = parseInt(quickViewQuantity.value) || 1;
            if (currentValue < 99) {
            quickViewQuantity.value = currentValue + 1;
            }
        });
        }

        // Add click event to shop items for quick view
        document.querySelectorAll('.shop-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't open if clicking on buttons, links, selects, or images
            if (e.target.closest('button, a, select, input') || e.target.tagName === 'IMG') return;

            const img = item.querySelector('img');
            const title = item.querySelector('h3').textContent;
            const price = item.querySelector('.price').textContent;
            const description = item.dataset.description;

            quickViewImage.src = img.src;
            quickViewImage.alt = img.alt;
            quickViewTitle.textContent = title;
            quickViewPrice.textContent = price;
            quickViewDescription.textContent = description;
            quickViewQuantity.value = 1; // Reset quantity to 1 when opening modal
            if (quickViewSize) quickViewSize.value = 'S';

            quickViewModal.classList.add('show');
        });
        });

        // Close modal events
        closeQuickView.addEventListener('click', () => {
        quickViewModal.classList.remove('show');
        });

        quickViewModal.addEventListener('click', (e) => {
        if (e.target === quickViewModal) {
            quickViewModal.classList.remove('show');
        }
        });

        // Add to cart from quick view
        quickViewAddBtn.addEventListener('click', () => {
        const quantity = parseInt(quickViewQuantity.value) || 1;
        const item = {
            name: quickViewTitle.textContent,
            price: quickViewPrice.textContent,
            image: quickViewImage.src,
            alt: quickViewImage.alt,
            size: quickViewSize ? quickViewSize.value : 'One Size'
        };
        addToCart(item, quantity);
        quickViewModal.classList.remove('show');
        });
    }

    function showAuthForm(formId) {
      const loginForm = document.getElementById('loginForm');
      const signupForm = document.getElementById('signupForm');
      const signupVerifyForm = document.getElementById('signupVerifyForm');
      const forgotForm = document.getElementById('forgotForm');
      const showLoginBtn = document.getElementById('showLogin');
      const showSignupBtn = document.getElementById('showSignup');

      if (loginForm && signupForm && forgotForm && showLoginBtn && showSignupBtn && signupVerifyForm) {
        loginForm.classList.toggle('hidden', formId !== 'login');
        signupForm.classList.toggle('hidden', formId !== 'signup');
        signupVerifyForm.classList.toggle('hidden', formId !== 'signupVerify');
        forgotForm.classList.toggle('hidden', formId !== 'forgot');
        showLoginBtn.classList.toggle('active', formId === 'login');
        showSignupBtn.classList.toggle('active', formId === 'signup');
      }
    }

    function displayAuthMessage(message, isError = false) {
      const authMessage = document.getElementById('authMessage');
      if (!authMessage) return;
      authMessage.textContent = message;
      authMessage.style.background = isError ? 'rgba(255, 71, 87, 0.18)' : 'rgba(102, 126, 234, 0.18)';
      authMessage.style.color = isError ? '#ff6b72' : '#d7e3ff';
    }

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const forgotForm = document.getElementById('forgotForm');
    const showLoginBtn = document.getElementById('showLogin');
    const showSignupBtn = document.getElementById('showSignup');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const backToLoginLink = document.getElementById('backToLoginLink');

    const signupVerifyForm = document.getElementById('signupVerifyForm');
    const resendSignupCode = document.getElementById('resendSignupCode');
    const backToSignupLink = document.getElementById('backToSignupLink');

    if (showLoginBtn) {
      showLoginBtn.addEventListener('click', () => showAuthForm('login'));
    }
    if (showSignupBtn) {
      showSignupBtn.addEventListener('click', () => showAuthForm('signup'));
    }
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthForm('forgot');
        showForgotStep(false);
      });
    }
    if (backToLoginLink) {
      backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthForm('login');
      });
    }
    if (backToSignupLink) {
      backToSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthForm('signup');
      });
    }
    if (resendSignupCode) {
      resendSignupCode.addEventListener('click', () => {
        const pending = getSignupVerification();
        if (!pending) {
          displayAuthMessage('No pending signup verification found.', true);
          return;
        }
        const newCode = generateVerificationCode();
        saveSignupVerification({ ...pending, code: newCode, expires: Date.now() + 10 * 60 * 1000 });
        console.log(`Signup verification code for ${pending.email}: ${newCode}`);
        displayAuthMessage(`Verification code resent to ${pending.email}.`);
      });
    }

    const logoutButton = document.getElementById('logoutButton');
    const deleteAccountButton = document.getElementById('deleteAccountButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', logoutUser);
    }
    if (deleteAccountButton) {
      deleteAccountButton.addEventListener('click', deleteCurrentUserAccount);
    }

    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirm = document.getElementById('signupConfirm').value;
        const agree = document.getElementById('signupAgree').checked;
        if (!name || !email || !password) {
          displayAuthMessage('Please complete all signup fields.', true);
          return;
        }
        if (!agree) {
          displayAuthMessage('You must agree to the terms and conditions before creating an account.', true);
          return;
        }
        if (password !== confirm) {
          displayAuthMessage('Passwords do not match.', true);
          return;
        }
        const result = sendSignupVerification(name, email, password);
        if (result.error) {
          displayAuthMessage(result.error, true);
          return;
        }
        displayAuthMessage(`Verification code sent to ${email}. Check your email to continue.`);
        const verifyEmail = document.getElementById('signupVerifyEmail');
        if (verifyEmail) {
          verifyEmail.value = email;
        }
        showAuthForm('signupVerify');
      });
    }

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!email || !password) {
          displayAuthMessage('Please enter both email and password.', true);
          return;
        }
        const result = loginUser(email, password);
        if (result.error) {
          displayAuthMessage(result.error, true);
          return;
        }
        setFlashMessage(`Welcome back, ${result.user.name}!`);
        window.location.href = 'LUCID.html';
      });
    }

    if (signupVerifyForm) {
      signupVerifyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('signupVerifyCode').value.trim();
        if (!code) {
          displayAuthMessage('Please enter your verification code.', true);
          return;
        }
        const result = activateVerifiedUser(code);
        if (result.error) {
          displayAuthMessage(result.error, true);
          return;
        }
        setFlashMessage(`Welcome to LU(ID, ${result.user.name}!`);
        window.location.href = 'LUCID.html';
      });
    }

    let forgotStep = 'request';

    function getPasswordResetToken() {
      return JSON.parse(localStorage.getItem('lucidPasswordReset')) || null;
    }

    function savePasswordResetToken(tokenData) {
      localStorage.setItem('lucidPasswordReset', JSON.stringify(tokenData));
    }

    function clearPasswordResetToken() {
      localStorage.removeItem('lucidPasswordReset');
    }

    function generateVerificationCode() {
      return Math.floor(10000 + Math.random() * 90000).toString();
    }

    function showForgotStep(requestSent) {
      const codeGroup = document.getElementById('forgotCodeGroup');
      const newPasswordGroup = document.getElementById('forgotNewPasswordGroup');
      const confirmGroup = document.getElementById('forgotConfirmGroup');
      const submitButton = document.getElementById('forgotSubmitButton');

      if (!codeGroup || !newPasswordGroup || !confirmGroup || !submitButton) return;

      if (requestSent) {
        forgotStep = 'verify';
        codeGroup.classList.remove('hidden');
        newPasswordGroup.classList.remove('hidden');
        confirmGroup.classList.remove('hidden');
        submitButton.textContent = 'Reset Password';
      } else {
        forgotStep = 'request';
        codeGroup.classList.add('hidden');
        newPasswordGroup.classList.add('hidden');
        confirmGroup.classList.add('hidden');
        submitButton.textContent = 'Send Verification Code';
      }
    }

    if (forgotForm) {
      forgotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('forgotEmail').value.trim();
        const code = document.getElementById('forgotCode').value.trim();
        const newPassword = document.getElementById('forgotNewPassword').value;
        const confirmPassword = document.getElementById('forgotConfirmPassword').value;

        if (!email) {
          displayAuthMessage('Please enter your email.', true);
          return;
        }

        if (forgotStep === 'request') {
          const users = getUsers();
          const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (!user) {
            displayAuthMessage('No account found with that email.', true);
            return;
          }
          const verificationCode = generateVerificationCode();
          savePasswordResetToken({ email: email.toLowerCase(), code: verificationCode, expires: Date.now() + 10 * 60 * 1000 });
          console.log(`Verification code for ${email}: ${verificationCode}`); // For demo purposes - in real app, this would be emailed
          displayAuthMessage(`Verification code sent to ${email}.`);
          showForgotStep(true);
          return;
        }

        if (!code) {
          displayAuthMessage('Please enter the verification code.', true);
          return;
        }
        if (!newPassword) {
          displayAuthMessage('Please enter a new password.', true);
          return;
        }
        if (newPassword !== confirmPassword) {
          displayAuthMessage('Passwords do not match.', true);
          return;
        }

        const resetData = getPasswordResetToken();
        if (!resetData || resetData.email !== email.toLowerCase()) {
          displayAuthMessage('Please request a password reset code first.', true);
          showForgotStep(false);
          return;
        }
        if (Date.now() > resetData.expires) {
          clearPasswordResetToken();
          displayAuthMessage('Verification code expired. Please request a new code.', true);
          showForgotStep(false);
          return;
        }
        if (resetData.code !== code) {
          displayAuthMessage('Incorrect verification code.', true);
          return;
        }

        const result = resetPassword(email, newPassword);
        if (result.error) {
          displayAuthMessage(result.error, true);
          return;
        }

        clearPasswordResetToken();
        displayAuthMessage('Password reset successful. Please log in.');
        showForgotStep(false);
        showAuthForm('login');
      });
    }

    showForgotStep(false);
    updateAccountLink();

    // Initialize cart and wishlist count on page load
    updateCartCount();
    updateWishlistCount();
    // Saved addresses delete handler in account panel
    const savedAddressesListEl = document.getElementById('savedAddressesList');
    if (savedAddressesListEl) {
      savedAddressesListEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-saved-address');
        if (!btn) return;
        const idx = Number(btn.dataset.index);
        if (Number.isNaN(idx)) return;
        removeSavedAddressForUser(idx);
        renderSavedAddressesList();
        showToast('Saved address removed.', 'info', 2500);
      });
    }

    // Promo banner injection
    function showPromoBanner(campaign) {
      try {
        if (!campaign || localStorage.getItem('lucidPromoDismissed')) return;
        const existing = document.getElementById('promoBanner');
        if (existing) return;
        const banner = document.createElement('div');
        banner.id = 'promoBanner';
        banner.className = 'promo-banner';
        banner.innerHTML = `
          <div class="promo-content">
            <strong>${campaign.title}</strong>
            <span class="promo-text">${campaign.text}</span>
          </div>
          <div class="promo-actions">
            <button id="promoApplyBtn" class="secondary-btn">Apply</button>
            <button id="promoDismissBtn" class="secondary-btn">Dismiss</button>
          </div>
        `;
        document.body.prepend(banner);
        const apply = document.getElementById('promoApplyBtn');
        const dismiss = document.getElementById('promoDismissBtn');
        if (apply) apply.addEventListener('click', () => {
          sessionStorage.setItem('lucidPromoToApply', campaign.code);
          window.location.href = 'cart.html';
        });
        if (dismiss) dismiss.addEventListener('click', () => {
          localStorage.setItem('lucidPromoDismissed', '1');
          banner.remove();
        });
      } catch (err) {
        console.warn('Promo banner failed', err);
      }
    }

    // Example campaign — change or disable as needed
    showPromoBanner({ code: 'LUCI10', title: 'Spring Sale', text: '10% off orders over $50 — use LUCI10 at checkout' });
    });
