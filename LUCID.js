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

  function updateCartCount() {
    if (cartCount) {
      const total = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      cartCount.textContent = total;
    }
  }

  function addToCart(item, quantity = 1) {
    quantity = Math.max(1, parseInt(quantity) || 1);
    
    // Check if item already exists in cart (same name)
    const existingItem = cart.find(cartItem => cartItem.name === item.name);
    
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + quantity;
    } else {
      item.quantity = quantity;
      cart.push(item);
    }
    
    localStorage.setItem('lucidCart', JSON.stringify(cart));
    updateCartCount();
    // Optional: show feedback
    const quantityText = quantity > 1 ? `${quantity} items` : 'item';
    alert(`${item.name} (${quantityText}) added to cart!`);
  }

  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  addToCartButtons.forEach(button => {
    button.addEventListener('click', () => {
      const itemElement = button.closest('.shop-item, .product-card');
      if (itemElement) {
        const img = itemElement.querySelector('img');
        const name = itemElement.querySelector('h3').textContent;
        const price = itemElement.querySelector('.price').textContent;
        
        // Try to get quantity from product-quantity input, default to 1
        let quantity = 1;
        const qtyInput = itemElement.querySelector('.qty-input');
        if (qtyInput) {
          quantity = parseInt(qtyInput.value) || 1;
          // Reset quantity after adding
          qtyInput.value = 1;
        }
        
        const item = {
          name: name,
          price: price,
          image: img.src,
          alt: img.alt
        };
        addToCart(item, quantity);
      }
    });
  });

  const shopFilter = document.getElementById('shopFilter');
  if (shopFilter) {
    const filterButtons = Array.from(shopFilter.querySelectorAll('.filter-btn'));
    const shopItems = Array.from(document.querySelectorAll('.shop-item'));

    function applyCategoryFilter(category) {
      filterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === category));
      shopItems.forEach(item => {
        const itemCategory = item.dataset.category || 'all';
        const hidden = category !== 'all' && itemCategory !== category;
        item.classList.toggle('hidden', hidden);
      });
    }

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        applyCategoryFilter(button.dataset.filter);
      });
    });

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
        // Don't open if clicking on add to cart button or image
        if (e.target.classList.contains('add-to-cart') || e.target.tagName === 'IMG') return;

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
        alt: quickViewImage.alt
      };
      addToCart(item, quantity);
      quickViewModal.classList.remove('show');
    });
  }

  // Initialize cart count on page load
  updateCartCount();
});
