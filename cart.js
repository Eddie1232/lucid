document.addEventListener('DOMContentLoaded', () => {
  const cartItemsContainer = document.getElementById('cartItems');
  const cartSummary = document.getElementById('cartSummary');
  const cartCount = document.querySelector('.cart-count');
  let cart = JSON.parse(localStorage.getItem('lucidCart')) || [];

  function updateCartCount() {
    if (cartCount) {
      cartCount.textContent = cart.length;
    }
  }

  function renderCart() {
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty. <a href="shop_the_drop.html">Start shopping</a></p>';
      cartSummary.innerHTML = '';
      return;
    }

    let total = 0;
    cart.forEach((item, index) => {
      const price = parseFloat(item.price.replace('$', ''));
      const quantity = item.quantity || 1;
      const itemTotal = price * quantity;
      total += itemTotal;

      const itemElement = document.createElement('div');
      itemElement.className = 'cart-item';
      itemElement.innerHTML = `
        <img src="${item.image}" alt="${item.alt}" />
        <div class="cart-item-details">
          <h4>${item.name}</h4>
          <p>$${price.toFixed(2)} × ${quantity} = $${itemTotal.toFixed(2)}</p>
        </div>
        <button class="remove-btn" data-index="${index}">Remove</button>
      `;
      cartItemsContainer.appendChild(itemElement);
    });

    cartSummary.innerHTML = `<p class="cart-total">Total: $${total.toFixed(2)}</p>`;
  }

  function removeItem(index) {
    cart.splice(index, 1);
    localStorage.setItem('lucidCart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
  }

  cartItemsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
      const index = e.target.dataset.index;
      removeItem(index);
    }
  });

  const paymentForm = document.getElementById('paymentForm');
  const paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]');
  const cardFields = document.getElementById('cardFields');
  const mobileFields = document.getElementById('mobileFields');
  const codNote = document.getElementById('codNote');
  const mobileCountry = document.getElementById('mobileCountry');
  const mobileProvider = document.getElementById('mobileProvider');
  const mobileNumber = document.getElementById('mobileNumber');

  const mobileProviderOptions = {
    ghana: [
      { value: 'mtn', label: 'MTN Mobile Money' },
      { value: 'vodafone', label: 'Vodafone Cash' },
      { value: 'airtel', label: 'AirtelTigo Money' }
    ],
    nigeria: [
      { value: 'mtn', label: 'MTN Mobile Money' },
      { value: 'airtel', label: 'Airtel Money' },
      { value: 'glo', label: 'Glo Mobile Money' },
      { value: '9mobile', label: '9mobile Money' }
    ],
    uk: [
      { value: 'paym', label: 'Paym (UK)' },
      { value: 'apple', label: 'Apple Pay' },
      { value: 'google', label: 'Google Pay' }
    ]
  };

  const mobilePlaceholders = {
    ghana: '024 000 0000',
    nigeria: '080 0000 0000',
    uk: '+44 7000 000000'
  };

  function updateProviderOptions() {
    const country = mobileCountry.value;
    mobileProvider.innerHTML = '<option value="">Select provider</option>';
    if (!country || !mobileProviderOptions[country]) {
      mobileNumber.placeholder = 'Enter mobile number';
      return;
    }

    mobileProviderOptions[country].forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      mobileProvider.appendChild(opt);
    });

    mobileNumber.placeholder = mobilePlaceholders[country] || 'Enter mobile number';
  }

  function updatePaymentFields() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    cardFields.classList.toggle('hidden', selectedMethod !== 'card');
    mobileFields.classList.toggle('hidden', selectedMethod !== 'mobile');
    codNote.classList.toggle('hidden', selectedMethod !== 'cod');
  }

  paymentMethodInputs.forEach(input => {
    input.addEventListener('change', updatePaymentFields);
  });

  mobileCountry.addEventListener('change', updateProviderOptions);

  updatePaymentFields();

  paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    if (cart.length === 0) {
      alert('Your cart is empty. Add items before checkout.');
      return;
    }

    if (selectedMethod === 'card') {
      const cardNumber = document.getElementById('cardNumber').value.trim();
      const expiry = document.getElementById('expiry').value.trim();
      const cvv = document.getElementById('cvv').value.trim();
      if (!cardNumber || !expiry || !cvv) {
        alert('Please enter your card details before completing purchase.');
        return;
      }
    }

    if (selectedMethod === 'mobile') {
      const country = mobileCountry.value;
      const provider = mobileProvider.value;
      const mobileNumber = document.getElementById('mobileNumber').value.trim();
      if (!country) {
        alert('Please select your country for mobile money.');
        return;
      }
      if (!provider) {
        alert('Please select a mobile money provider.');
        return;
      }
      if (!mobileNumber) {
        alert('Please enter your mobile number.');
        return;
      }
    }

    let successMessage = 'Order placed successfully! Thank you for your purchase.';
    if (selectedMethod === 'cod') {
      successMessage = 'Order confirmed. Pay after delivery when your items arrive.';
    } else if (selectedMethod === 'mobile') {
      successMessage = 'Order confirmed. You will receive mobile money payment instructions shortly.';
    }

    alert(successMessage);
    cart = [];
    localStorage.setItem('lucidCart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
  });

  renderCart();
  updateCartCount();
});