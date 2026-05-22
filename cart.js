document.addEventListener('DOMContentLoaded', () => {
  const cartItemsContainer = document.getElementById('cartItems');
  const cartSummary = document.getElementById('cartSummary');
  const cartCount = document.querySelector('.cart-count');
  const loginStatus = document.getElementById('loginStatus');
  let cart = JSON.parse(localStorage.getItem('lucidCart')) || [];
  let activePromo = null;
  let selectedShippingOption = 'standard';

  const promoCodes = {
    LUCI10: { type: 'percent', amount: 10, minSubtotal: 50, description: '10% off orders over $50' },
    FREESHIP: { type: 'shipping', amount: 0, minSubtotal: 0, description: 'Free standard shipping' },
    WELCOME20: { type: 'fixed', amount: 20, minSubtotal: 120, description: '$20 off orders over $120' }
  };

  const shippingOptions = {
    standard: { label: 'Standard Delivery', cost: 5.99, estimate: '3-5 business days' },
    express: { label: 'Express Delivery', cost: 12.99, estimate: '1-2 business days' },
    overnight: { label: 'Overnight Delivery', cost: 24.99, estimate: 'Next business day' },
    pickup: { label: 'Store pickup', cost: 0, estimate: '2-3 business days' }
  };

  // Paystack integration is handled through payments.js and the inline Paystack script
  const cardFieldsContainer = document.getElementById('cardFields');
  if (cardFieldsContainer) {
    cardFieldsContainer.classList.remove('hidden');
  }

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem('lucidCurrentUser')) || null;
  }

  function getOrders() {
    return JSON.parse(localStorage.getItem('lucidOrders')) || [];
  }

  function saveOrders(orders) {
    localStorage.setItem('lucidOrders', JSON.stringify(orders));
  }

  function createOrder(orderData) {
    const orders = getOrders();
    const orderID = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const order = {
      orderID,
      ...orderData,
      createdAt: new Date().toISOString(),
    };
    orders.push(order);
    saveOrders(orders);
    return order;
  }

  function updateCartCount() {
    if (cartCount) {
      const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
      cartCount.textContent = totalItems;
    }
  }

  function updateLoginStatus() {
    if (!loginStatus) return;
    const currentUser = getCurrentUser();
    if (currentUser) {
      loginStatus.innerHTML = `Signed in as <strong>${currentUser.name}</strong>. <a href=\"login.html\">Manage account</a>`;
    } else {
      loginStatus.innerHTML = `Please <a href=\"login.html\">log in</a> or sign up to complete checkout.`;
    }
  }

  function renderCart() {
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p class=\"empty-cart\">Your cart is empty. <a href=\"shop_the_drop.html\">Start shopping</a></p>';
      cartSummary.innerHTML = '';
      updateCheckoutSummary(0);
      updateLoginStatus();
      return;
    }

    let subtotal = 0;
    cart.forEach((item, index) => {
      const price = parseFloat(item.price.replace('$', ''));
      const quantity = item.quantity || 1;
      const itemTotal = price * quantity;
      subtotal += itemTotal;

      const itemElement = document.createElement('div');
      itemElement.className = 'cart-item';
      itemElement.innerHTML = `
        <img src=\"${item.image}\" alt=\"${item.alt}\" />
        <div class=\"cart-item-details\">
          <h4>${item.name}</h4>
          <p>$${price.toFixed(2)} × ${quantity} = $${itemTotal.toFixed(2)}</p>
          <p class=\"cart-item-size\">Size: ${item.size || 'One Size'}</p>
        </div>
        <button class=\"remove-btn\" data-index=\"${index}\">Remove</button>
      `;
      cartItemsContainer.appendChild(itemElement);
    });

    cartSummary.innerHTML = `<p class=\"cart-total\">Total: $${calculateTotal(subtotal).toFixed(2)}</p>`;
    updateCheckoutSummary(subtotal);
    updateLoginStatus();
  }

  function removeItem(index) {
    cart.splice(index, 1);
    localStorage.setItem('lucidCart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
  }

  function getCartSubtotal() {
    return cart.reduce((sum, item) => {
      const price = parseFloat(item.price.replace('$', '')) || 0;
      return sum + price * (item.quantity || 1);
    }, 0);
  }

  function calculateShipping(subtotal) {
    const option = shippingOptions[selectedShippingOption] ? selectedShippingOption : 'standard';
    const shipping = shippingOptions[option].cost;
    if (option === 'standard' && subtotal >= 100) {
      return 0;
    }
    if (activePromo && activePromo.type === 'shipping') {
      return 0;
    }
    return shipping;
  }

  function calculateTax(subtotal) {
    const discount = calculateDiscount(subtotal);
    return Math.max(0, subtotal - discount) * 0.08;
  }

  function calculateDiscount(subtotal) {
    if (!activePromo) return 0;
    if (subtotal < activePromo.minSubtotal) return 0;

    if (activePromo.type === 'percent') {
      return +(subtotal * (activePromo.amount / 100)).toFixed(2);
    }
    if (activePromo.type === 'fixed') {
      return Math.min(activePromo.amount, subtotal);
    }
    return 0;
  }

  function calculateTotal(subtotal) {
    const discount = calculateDiscount(subtotal);
    const shipping = calculateShipping(subtotal);
    const tax = calculateTax(subtotal);
    return Math.max(0, subtotal - discount + shipping + tax);
  }

  function updateCheckoutSummary(subtotal) {
    const checkoutSummary = document.getElementById('checkoutSummary');
    if (!checkoutSummary) return;

    const discount = calculateDiscount(subtotal);
    const shipping = calculateShipping(subtotal);
    const tax = calculateTax(subtotal);
    const total = calculateTotal(subtotal);

    // Update amounts
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('discountAmount').textContent = `-$${discount.toFixed(2)}`;
    document.getElementById('shippingCost').textContent = shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`;
    document.getElementById('taxAmount').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('finalTotal').innerHTML = `<strong>$${total.toFixed(2)}</strong>`;

    const shippingInfo = document.getElementById('shippingInfo');
    const option = shippingOptions[selectedShippingOption] || shippingOptions.standard;
    const promoText = activePromo && activePromo.type === 'shipping' ? ' + promo applied' : '';

    if (option.label) {
      shippingInfo.textContent = `${option.label}: ${option.estimate}${promoText}`;
    }
  }

  function updatePaymentSummary() {
    const paymentSummary = document.getElementById('selectedPayment');
    if (!paymentSummary) return;

    const selectedPayment = document.querySelector('input[name=\"paymentMethod\"]:checked');
    if (!selectedPayment) return;

    const paymentMethod = selectedPayment.value;
    let paymentText = '';

    switch (paymentMethod) {
      case 'card':
        paymentText = '💳 Credit/Debit Card';
        break;
      case 'cod':
        paymentText = '💵 Pay After Delivery';
        break;
      case 'mobile':
        const country = document.getElementById('mobileCountry').value;
        const provider = document.getElementById('mobileProvider').value;
        if (country && provider) {
          const countryNames = { ghana: 'Ghana', nigeria: 'Nigeria', uk: 'UK' };
          paymentText = `📱 ${provider.toUpperCase()} (${countryNames[country]})`;
        } else {
          paymentText = '📱 Mobile Money';
        }
        break;
    }

    paymentSummary.textContent = paymentText;
  }

  function displayPaymentMessage(message, isError = false) {
    const messageEl = document.getElementById('paymentMessage');
    if (!messageEl) return;
    messageEl.textContent = message;
    messageEl.classList.remove('hidden');
    messageEl.style.background = isError ? 'rgba(255, 71, 87, 0.18)' : 'rgba(102, 126, 234, 0.18)';
    messageEl.style.color = isError ? '#ff6b72' : '#d7e3ff';
  }

  function showOrderConfirmation(orderData) {
    document.getElementById('paymentForm').style.display = 'none';
    const confirmationDiv = document.getElementById('orderConfirmation');
    confirmationDiv.classList.remove('hidden');
    document.getElementById('orderID').textContent = orderData.orderID;
    document.getElementById('orderTotal').textContent = '$' + orderData.total.toFixed(2);
    document.getElementById('orderStatus').textContent = orderData.status;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    document.getElementById('orderDelivery').textContent = deliveryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  cartItemsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-btn')) {
      const index = e.target.dataset.index;
      removeItem(index);
    }
  });

  const paymentForm = document.getElementById('paymentForm');
  const paymentMethodInputs = document.querySelectorAll('input[name=\"paymentMethod\"]');
  const cardFields = document.getElementById('cardFields');
  const mobileFields = document.getElementById('mobileFields');
  const codNote = document.getElementById('codNote');
  const mobileCountry = document.getElementById('mobileCountry');
  const mobileProvider = document.getElementById('mobileProvider');
  const mobileNumber = document.getElementById('mobileNumber');

  const submitButton = document.getElementById('submitButton');  let paystackReady = false;
  const mobileProviderOptions = {
    ghana: [
      { value: 'mtn', label: 'MTN Mobile Money' },
      { value: 'telecel', label: 'Telecel Cash' },
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

  const promoCodeInput = document.getElementById('promoCodeInput');
  const applyPromoButton = document.getElementById('applyPromoButton');
  const promoMessage = document.getElementById('promoMessage');
  const shippingOption = document.getElementById('shippingOption');
  const savedAddressSection = document.getElementById('savedAddressSection');
  const savedShippingAddresses = document.getElementById('savedShippingAddresses');
  const savedBillingAddresses = document.getElementById('savedBillingAddresses');
  const shippingAddressField = document.getElementById('shippingAddress');
  const billingAddressSection = document.getElementById('billingAddressSection');
  const billingAddressField = document.getElementById('billingAddress');
  const sameBillingAddress = document.getElementById('sameBillingAddress');
  const saveAddressToAccount = document.getElementById('saveAddressToAccount');

  function getSavedAddressesForUser() {
    const currentUser = getCurrentUser();
    return currentUser?.savedAddresses || [];
  }

  function buildAddressOption(address, index) {
    const label = address.label || `Address ${index + 1}`;
    const city = address.city ? `, ${address.city}` : '';
    return `${label}${city}`;
  }

  function renderSavedAddressSelectors() {
    const addresses = getSavedAddressesForUser();
    if (!addresses.length || !savedAddressSection) {
      if (savedAddressSection) savedAddressSection.classList.add('hidden');
      return;
    }
    savedAddressSection.classList.remove('hidden');
    if (savedShippingAddresses) {
      savedShippingAddresses.innerHTML = '<option value="">Use shipping address on file</option>';
    }
    if (savedBillingAddresses) {
      savedBillingAddresses.innerHTML = '<option value="">Use billing address on file</option>';
    }
    addresses.forEach((address, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = buildAddressOption(address, index);
      if (savedShippingAddresses) savedShippingAddresses.appendChild(option.cloneNode(true));
      if (savedBillingAddresses) savedBillingAddresses.appendChild(option.cloneNode(true));
    });
  }

  function populateAddressFieldsFromSaved(type, index) {
    const addresses = getSavedAddressesForUser();
    if (!addresses[index]) return;
    const address = addresses[index];
    const value = address.full || `${address.street || ''}\n${address.city || ''} ${address.postalCode || ''}\n${address.country || ''}`.trim();
    if (type === 'shipping' && shippingAddressField) {
      shippingAddressField.value = value;
      if (sameBillingAddress && sameBillingAddress.checked && billingAddressField) {
        billingAddressField.value = value;
      }
    }
    if (type === 'billing' && billingAddressField) {
      billingAddressField.value = value;
    }
  }

  function handleSavedAddressChange(event) {
    const target = event.target;
    if (!target) return;
    const index = Number(target.value);
    if (Number.isNaN(index)) return;
    populateAddressFieldsFromSaved(target.id.includes('Shipping') ? 'shipping' : 'billing', index);
  }

  function updateBillingSection() {
    const showBilling = sameBillingAddress ? !sameBillingAddress.checked : false;
    if (billingAddressSection) billingAddressSection.classList.toggle('hidden', !showBilling);
    if (!showBilling && billingAddressField && shippingAddressField) {
      billingAddressField.value = shippingAddressField.value;
    }
  }

  function applyPromoCodeHandler() {
    const code = (promoCodeInput?.value || '').trim().toUpperCase();
    if (!code) {
      if (promoMessage) promoMessage.textContent = 'Enter a valid promo code.';
      activePromo = null;
      updateCheckoutSummary(getCartSubtotal());
      return;
    }

    // Lookup promo in built-in catalog first, then in admin-managed promos stored in localStorage
    function getPromoByCode(c) {
      if (!c) return null;
      const built = promoCodes[c];
      if (built) return { ...built, code: c, description: built.description || built.title || '' };
      try {
        const list = JSON.parse(localStorage.getItem('lucidPromos') || '[]');
        const found = list.find(p => (p.code || '').toUpperCase() === c);
        if (found) return { type: found.type || 'percent', amount: Number(found.amount || 0), minSubtotal: Number(found.minSubtotal || 0), code: found.code.toUpperCase(), description: found.text || found.title || '' };
      } catch (e) {
        console.warn('Failed reading lucidPromos', e);
      }
      return null;
    }

    const promo = getPromoByCode(code);
    const subtotal = getCartSubtotal();
    if (!promo) {
      if (promoMessage) promoMessage.textContent = 'That promo code is not recognized.';
      activePromo = null;
    } else if (subtotal < (promo.minSubtotal || 0)) {
      if (promoMessage) promoMessage.textContent = `This code requires a minimum order of $${promo.minSubtotal || 0}.`;
      activePromo = null;
    } else {
      activePromo = promo;
      if (promoMessage) promoMessage.textContent = `Promo applied: ${promo.description || promo.code}`;
    }
    updateCheckoutSummary(getCartSubtotal());
  }

  function updateShippingOption() {
    if (shippingOption) {
      selectedShippingOption = shippingOption.value || 'standard';
      updateCheckoutSummary(getCartSubtotal());
    }
  }

  function updateProviderOptions() {
    const country = mobileCountry.value;
    mobileProvider.innerHTML = '<option value=\"\">Select provider</option>';
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
    const selectedMethod = document.querySelector('input[name=\"paymentMethod\"]:checked').value;
    cardFields.classList.toggle('hidden', selectedMethod !== 'card');
    mobileFields.classList.toggle('hidden', selectedMethod !== 'mobile');
    codNote.classList.toggle('hidden', selectedMethod !== 'cod');
    updatePaymentSummary();    updatePaystackStatus();  }

  paymentMethodInputs.forEach(input => {
    input.addEventListener('change', updatePaymentFields);
  });

  mobileCountry.addEventListener('change', updateProviderOptions);
  if (shippingOption) shippingOption.addEventListener('change', updateShippingOption);
  if (applyPromoButton) applyPromoButton.addEventListener('click', applyPromoCodeHandler);
  if (savedShippingAddresses) savedShippingAddresses.addEventListener('change', handleSavedAddressChange);
  if (savedBillingAddresses) savedBillingAddresses.addEventListener('change', handleSavedAddressChange);
  if (sameBillingAddress) sameBillingAddress.addEventListener('change', updateBillingSection);

  function updatePaystackStatus() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    const isCard = selectedMethod === 'card';
    const statusText = isCard
      ? (paystackReady ? 'Paystack is ready. Click Complete Purchase to open secure payment.' : 'Loading Paystack... Please wait before completing checkout.')
      : 'Paystack will securely collect your card details in a secure popup after you click Complete Purchase.';

    if (cardFields) {
      cardFields.innerHTML = `<div class="payment-info-box">${statusText}</div>`;
    }

    submitButton.disabled = isCard && !paystackReady;
  }

  Payments.onPaystackReady(() => {
    paystackReady = true;
    updatePaystackStatus();
  });

  updatePaymentFields();
  updatePaystackStatus();

  renderSavedAddressSelectors();
  updateBillingSection();

  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedMethod = document.querySelector('input[name=\"paymentMethod\"]:checked').value;
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const shippingAddress = shippingAddressField?.value.trim() || '';
    const billingAddress = sameBillingAddress && sameBillingAddress.checked
      ? shippingAddress
      : billingAddressField?.value.trim() || '';

    const currentUser = getCurrentUser();
    if (!currentUser) {
      displayPaymentMessage('Please log in to complete checkout.', true);
      setTimeout(() => window.location.href = 'login.html', 1500);
      return;
    }
    if (cart.length === 0) {
      displayPaymentMessage('Your cart is empty. Add items before checkout.', true);
      return;
    }
    if (!name || !email || !shippingAddress || (!billingAddress && !sameBillingAddress?.checked)) {
      displayPaymentMessage('Please fill in all required fields.', true);
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price.replace('$', '')) * (item.quantity || 1)), 0);
    const shipping = calculateShipping(subtotal);
    const tax = calculateTax(subtotal);
    const discount = calculateDiscount(subtotal);
    const total = Math.max(0, subtotal + shipping + tax - discount);
    const orderPayload = {
      user: currentUser.email,
      items: cart,
      name,
      email,
      shippingAddress,
      billingAddress,
      paymentMethod: selectedMethod,
      shippingOption: selectedShippingOption,
      discountCode: activePromo ? Object.keys(promoCodes).find(code => promoCodes[code] === activePromo) : null,
      discountAmount: discount,
      subtotal,
      shipping,
      tax,
      total,
      status: selectedMethod === 'card' ? 'Processing Payment' : 'Pending Payment',
      trackingNumber: `TRK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      shipmentUpdates: [
        { time: new Date().toISOString(), status: 'Order received and awaiting processing.' }
      ]
    };

    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';

    try {
      if (selectedMethod === 'card') {
        try {
          const result = await Payments.processCardPayment(total, email, name);
          if (!result || result.status !== 'success') {
            throw new Error('Unable to confirm card payment.');
          }

          const order = createOrder({
            ...orderPayload,
            paymentMethod: 'Card',
            status: 'Confirmed',
            paymentReference: result.reference
          });

          displayPaymentMessage('Payment processed successfully!');
          setTimeout(() => {
            showOrderConfirmation(order);
            cart = [];
            localStorage.setItem('lucidCart', JSON.stringify(cart));
            updateCartCount();
          }, 1000);
        } catch (error) {
          displayPaymentMessage(error.message || 'Payment failed. Please try again.', true);
          submitButton.disabled = false;
          submitButton.textContent = 'Complete Purchase';
        }

      } else if (selectedMethod === 'mobile') {
        const country = mobileCountry.value;
        const provider = mobileProvider.value;
        if (!country || !provider) {
          displayPaymentMessage('Please select country and provider.', true);
          submitButton.disabled = false;
          submitButton.textContent = 'Complete Purchase';
          return;
        }

        await Payments.processMobilePayment(country, provider, mobileNumber.value.trim(), total, email);
        const order = createOrder({
          ...orderPayload,
          paymentMethod: `${provider.toUpperCase()} Mobile Money`,
          provider: provider.toUpperCase(),
          mobileNumber: mobileNumber.value.trim(),
          status: 'Pending Payment'
        });

        displayPaymentMessage('Order confirmed. Payment instructions sent to your mobile number.');
        setTimeout(() => {
          showOrderConfirmation(order);
          cart = [];
          localStorage.setItem('lucidCart', JSON.stringify(cart));
          updateCartCount();
        }, 1500);

      } else if (selectedMethod === 'cod') {
        await Payments.processCODOrder(total, email);
        const order = createOrder({
          ...orderPayload,
          paymentMethod: 'Cash on Delivery',
          status: 'Pending Payment'
        });

        displayPaymentMessage('Order confirmed. Pay on delivery.');
        setTimeout(() => {
          showOrderConfirmation(order);
          cart = [];
          localStorage.setItem('lucidCart', JSON.stringify(cart));
          updateCartCount();
        }, 1500);
      }
      if (saveAddressToAccount && saveAddressToAccount.checked && shippingAddressField && shippingAddressField.value) {
        const addressObj = {
          label: `${selectedShippingOption.charAt(0).toUpperCase() + selectedShippingOption.slice(1)} Address`,
          full: shippingAddressField.value,
          country: '',
          city: ''
        };
        window.saveAddressForUser?.(addressObj);
      }
    } catch (err) {
      displayPaymentMessage('An error occurred during payment processing.', true);
      submitButton.disabled = false;
      submitButton.textContent = 'Complete Purchase';
    }
  });

  renderCart();
  updateCartCount();
  updatePaymentSummary();
  updateLoginStatus();

  // Auto-apply promo code set by header banner
  try {
    const promoToApply = sessionStorage.getItem('lucidPromoToApply');
    if (promoToApply && promoCodeInput) {
      promoCodeInput.value = promoToApply;
      applyPromoCodeHandler();
      sessionStorage.removeItem('lucidPromoToApply');
    }
  } catch (err) {
    console.warn('Auto-apply promo failed', err);
  }
});

