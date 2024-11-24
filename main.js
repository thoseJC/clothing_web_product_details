// Main script for handling product fetching and cart logic

// Constants
const API_URL = 'https://3sb655pz3a.execute-api.ap-southeast-2.amazonaws.com/live/product'; // API endpoint for product data

// State variables
let product = null; // Holds the current product data
let selectedSize = null; // Tracks the selected size of the product
let cart = []; // Tracks the items in the shopping cart

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

let elements = null; // Placeholder for initialized DOM elements

// Fetch product data
async function fetchProductData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch product data.');

        product = await response.json();
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
    elements.miniCart.classList.add('open');
    elements.overlay.style.display = 'block';
}

// Update the cart UI
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
}

// Save cart to local storage
function saveCartToStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from local storage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
}

// Error handling
function displayError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';
}

function hideError() {
    elements.errorMessage.style.display = 'none';
}

// Initialize the application
function init() {
    elements = initializeElements();
    if (elements.addToCartBtn) {
        elements.addToCartBtn.addEventListener('click', addToCart);
    }
    fetchProductData();
    loadCartFromStorage();
}

// Update item quantity in the cart
function updateQuantity(itemId, delta) {
    const item = cart.find(item => item.id === itemId); // Find the item in the cart by its ID
    if (item) {
        const newQuantity = item.quantity + delta; // Calculate the new quantity
        if (newQuantity <= 0) {
            cart = cart.filter(cartItem => cartItem.id !== itemId); // Remove the item if quantity is zero
        } else {
            item.quantity = newQuantity; // Update the item's quantity
        }

        updateCart(); // Refresh the cart display
        saveCartToStorage(); // Save the updated cart to local storage

        if (cart.length === 0) {
            closeCart(); // Close the cart if it becomes empty
        }
    }
}

// Assign the function to the window object for global access
window.updateQuantity = updateQuantity;


document.addEventListener('DOMContentLoaded', init);
