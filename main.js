import { ProductCache } from './cache-utility.js';

// Constants
const API_URL = 'https://3sb655pz3a.execute-api.ap-southeast-2.amazonaws.com/live/product';
const cache = new ProductCache();

// State variables
let product = null;
let selectedSize = null;
let cart = [];

// DOM elements
const elements = {
    productImage: document.getElementById('product-image'),
    productTitle: document.getElementById('product-title'),
    productPrice: document.getElementById('product-price'),
    productDescription: document.getElementById('product-description'),
    sizeOptions: document.getElementById('size-options'),
    errorMessage: document.getElementById('error-message'),
    addToCartBtn: document.getElementById('add-to-cart'),
    cartToggle: document.getElementById('cart-toggle'),
    miniCart: document.getElementById('mini-cart'),
    closeCart: document.getElementById('close-cart'),
    cartItems: document.getElementById('cart-items'),
    cartCount: document.getElementById('cart-count'),
    cartEmptyMessage: document.getElementById('cart-empty-message'),
    overlay: document.getElementById('overlay')
};

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
    openCart();
    hideError();
    saveCartToStorage();
}

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

    if (cart.length > 0) {
        const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        const totalElement = document.createElement('div');
        totalElement.className = 'cart-total';
        totalElement.innerHTML = `
            <div class="total-line"></div>
            <div class="total-amount">
                <span>Total:</span>
                <span>$${cartTotal.toFixed(2)}</span>
            </div>
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
    e.stopPropagation(); // Prevent event from bubbling up
    const isOpen = elements.miniCart.classList.contains('open');
    if (isOpen) {
        closeCart();
    } else {
        openCart();
    }
}

function openCart() {
    elements.miniCart.classList.add('open');
    elements.overlay.style.display = 'block';
}

function closeCart() {
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
    elements.addToCartBtn.addEventListener('click', addToCart);
    elements.cartToggle.addEventListener('click', toggleCart);
    elements.closeCart.addEventListener('click', closeCart);
    elements.overlay.addEventListener('click', closeCart);

    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
        const miniCart = elements.miniCart;
        const cartToggle = elements.cartToggle;

        if (!miniCart.contains(e.target) &&
            !cartToggle.contains(e.target) &&
            miniCart.classList.contains('open')) {
            closeCart();
        }
    });

    // Handle keyboard events
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.miniCart.classList.contains('open')) {
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
    fetchProductData();
    loadCartFromStorage();
    initializeEventListeners();
}

// Start the application
init();