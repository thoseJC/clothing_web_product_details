import { ProductCache } from './cache-utility.js';

// Constants
const API_URL = 'https://3sb655pz3a.execute-api.ap-southeast-2.amazonaws.com/live/product';
const cache = new ProductCache();

// State variables
let product = null;
let selectedSize = null;
let cart = [];

// Initialize DOM elements
function initializeElements() {
    return {
        productImage: document.getElementById('product-image'),
        productTitle: document.getElementById('product-title'),
        productPrice: document.getElementById('product-price'),
        productDescription: document.getElementById('product-description'),
        sizeOptions: document.getElementById('size-options'),
        errorMessage: document.getElementById('error-message'),
        addToCartBtn: document.getElementById('add-to-cart'),
        cartToggle: document.querySelector('.cart-toggle-button'),
        miniCart: document.getElementById('mini-cart'),
        closeCart: document.getElementById('close-cart'),
        cartItems: document.getElementById('cart-items'),
        cartCount: document.getElementById('cart-count'),
        cartEmptyMessage: document.getElementById('cart-empty-message'),
        overlay: document.getElementById('overlay')
    };
}

let elements = null;

// Fetch product data
async function fetchProductData() {
    try {
        const cachedData = await cache.get('product');
        if (cachedData) {
            product = cachedData;
            renderProduct();
            return;
        }

        if (!cache.canMakeRequest()) {
            throw new Error('Rate limit exceeded. Please try again later.');
        }

        cache.incrementRequestCount();
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch product data.');

        product = await response.json();
        cache.set('product', product);
        renderProduct();
    } catch (error) {
        displayError(error.message);
    }
}

// Render product details
function renderProduct() {
    if (!product) return;

    elements.productImage.src = product.imageURL;
    elements.productTitle.textContent = product.title;
    elements.productPrice.textContent = `$${product.price.toFixed(2)}`;
    elements.productDescription.textContent = product.description;

    elements.sizeOptions.innerHTML = '';
    product.sizeOptions.forEach(size => {
        const button = document.createElement('button');
        button.className = 'size-button';
        button.textContent = size.label;
        button.dataset.size = size.label;
        button.addEventListener('click', () => selectSize(size.label));
        elements.sizeOptions.appendChild(button);
    });
}

// Handle size selection
function selectSize(size) {
    selectedSize = size;
    hideError();
    document.querySelectorAll('.size-button').forEach(button => {
        button.classList.toggle('selected', button.dataset.size === size);
    });
}

// Add product to cart
function addToCart() {
    if (!selectedSize) {
        displayError('Please select a size.');
        return;
    }

    const existingItem = cart.find(item =>
        item.title === product.title && item.size === selectedSize
    );

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            size: selectedSize,
            quantity: 1,
            id: `${product.id}-${selectedSize}`
        });
    }

    updateCart();
    saveCartToStorage();
    hideError();

    // Force open the cart
    elements.miniCart.classList.add('open');
    elements.overlay.style.display = 'block';

    console.log('Cart opened:', elements.miniCart.classList.contains('open'));
}

// Update cart display
// Update cart display
function updateCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartCount.textContent = totalItems;
    elements.cartEmptyMessage.style.display = cart.length === 0 ? 'block' : 'none';

    elements.cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.imageURL}" alt="${item.title}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-quantity">
                    <span>${item.quantity}x</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div class="cart-item-size">Size: ${item.size}</div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="window.updateQuantity('${item.id}', -1)">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="window.updateQuantity('${item.id}', 1)">+</button>
                </div>
            </div>
        </div>
    `).join('');

    // In updateCart function, update the totalElement innerHTML:
    if (cart.length > 0) {
        const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const shippingFee = 5.00;
        const finalTotal = subtotal + shippingFee;

        const totalElement = document.createElement('div');
        totalElement.className = 'cart-total';
        totalElement.innerHTML = `
            <div class="total-line"></div>
            <div class="total-details">
                <div class="total-row">
                    <div class="total-label">Subtotal:</div>
                    <div class="total-value">$${subtotal.toFixed(2)}</div>
                </div>
                <div class="total-row">
                    <div class="total-label">Shipping fee:</div>
                    <div class="total-value">$${shippingFee.toFixed(2)}</div>
                </div>
                <div class="total-row final">
                    <div class="total-label">Total(gst incl):</div>
                    <div class="total-value">$${finalTotal.toFixed(2)}</div>
                </div>
            </div>
            <button class="checkout-button">PROCEED TO CHECKOUT</button>
        `;
    elements.cartItems.appendChild(totalElement);
}
}

// Update item quantity
function updateQuantity(itemId, delta) {
    const item = cart.find(item => item.id === itemId);
    if (item) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) {
            cart = cart.filter(cartItem => cartItem.id !== itemId);
        } else {
            item.quantity = newQuantity;
        }

        updateCart();
        saveCartToStorage();

        if (cart.length === 0) {
            closeCart();
        }
    }
}

// Cart visibility functions
function toggleCart(e) {
    if (e) e.stopPropagation();
    const isOpen = elements.miniCart.classList.contains('open');
    if (isOpen) {
        closeCart();
    } else {
        openCart();
    }
}

function openCart() {
    console.log('Opening cart...');
    elements.miniCart.classList.add('open');
    elements.overlay.style.display = 'block';
}

function closeCart() {
    console.log('Closing cart...');
    elements.miniCart.classList.remove('open');
    elements.overlay.style.display = 'none';
}

// Error handling
function displayError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';
}

function hideError() {
    elements.errorMessage.style.display = 'none';
}

// Local Storage functions
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

// Initialize event listeners
function initializeEventListeners() {
    console.log('Initializing event listeners...');
    console.log('Elements:', elements);

    if (elements.addToCartBtn) {
        elements.addToCartBtn.addEventListener('click', addToCart);
    }

    if (elements.cartToggle) {
        elements.cartToggle.addEventListener('click', toggleCart);
    }

    if (elements.closeCart) {
        elements.closeCart.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeCart();
        });
    }

    if (elements.overlay) {
        elements.overlay.addEventListener('click', closeCart);
    }

    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        if (elements.miniCart?.classList.contains('open') &&
            !elements.miniCart.contains(e.target) &&
            !elements.cartToggle.contains(e.target)) {
            closeCart();
        }
    });

    // Handle keyboard events
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.miniCart?.classList.contains('open')) {
            closeCart();
        }
    });

    // Handle responsive design
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 768) {
            elements.miniCart.style.width = '100%';
        } else {
            elements.miniCart.style.width = '400px';
        }
    });

    // Handle network status
    window.addEventListener('online', fetchProductData);
    window.addEventListener('offline', () => {
        displayError('You are currently offline. Some features may be unavailable.');
    });
}

// Make updateQuantity available globally for the onclick handlers
window.updateQuantity = updateQuantity;

// Initialize application
function init() {
    console.log('Initializing application...');
    elements = initializeElements();

    if (elements.closeCart && elements.cartToggle && elements.miniCart) {
        initializeEventListeners();
        fetchProductData();
        loadCartFromStorage();
    } else {
        console.error('Required DOM elements not found:', {
            closeCart: elements.closeCart,
            cartToggle: elements.cartToggle,
            miniCart: elements.miniCart
        });
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', init);