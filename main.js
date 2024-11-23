// Import cache utility
import { ProductCache } from './cache utility.js';

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
    overlay: document.getElementById('overlay'),
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

    elements.sizeOptions.innerHTML = ''; // Clear existing size options
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

    const existingItem = cart.find(item => item.size === selectedSize);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, size: selectedSize, quantity: 1 });
    }

    updateCart();
}

// Update cart display
function updateCart() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartCount.textContent = totalItems;

    elements.cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div>${item.title} (${item.size}) - $${(item.price * item.quantity).toFixed(2)}</div>
            <button onclick="updateItem('${item.size}', -1)">-</button>
            <button onclick="updateItem('${item.size}', 1)">+</button>
        </div>
    `).join('');
}

// Error handling
function displayError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';
}

function hideError() {
    elements.errorMessage.style.display = 'none';
}

// Initialize application
function init() {
    fetchProductData();
    elements.addToCartBtn.addEventListener('click', addToCart);
}

init();
