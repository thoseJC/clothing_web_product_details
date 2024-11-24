# Classic Tee Product Page

A responsive single product page built with vanilla JavaScript, HTML5, and CSS3. 

![main-interface.png](main-interface.png)

## Features

- Product display with image, title, price, and description
- Size selection
- Shopping cart functionality:
  - Add to cart
  - Update quantities
  - Remove items
- Responsive design for mobile and desktop
- Local storage for cart persistence

## Getting Started

### Project Structure
```
clothing_web_page/
│
├── index.html              # Main HTML file
├── style.css              # All styles 
├── main.js                # Main JavaScript logic
├── cache-utility.js       # Cache handling utility
└── README.md             # This file
```

### Setup
1. Clone the repository:
```bash
git clone https://github.com/thoseJC/clothing_web_product_details
cd clothing_web_page
```

2. Open with PyCharm:
- Open PyCharm
- Go to File > Open
- Navigate to your project folder
-Click 'Open'

3. Configure PyCharm Development Server:
- Right-click on your project in the Project Explorer
- Select 'Open In > Browser'
- Choose your preferred browser

## Key Features Explained

### Cart Functionality
- Shows subtotal, shipping fee ($5.00), and total
- Quantities can be adjusted with +/- buttons
- Cart state persists using localStorage

### Responsive Design
- Desktop: Side-by-side product layout with dropdown cart
- Mobile: Stacked layout with full-screen cart

## Common Issues & Solutions

1. If cart doesn't open automatically:
   - Check if the "Add to Cart" button has `id="add-to-cart"`
   - Verify event listeners in browser console

2. If images don't load:
   - Check console for API errors
   - Verify network connection

## Future Improvements
- Cart opens automatically when adding items
- Add checkout functionality
- Add product quantity selector
- Enhance error handling
- Add loading states
- Implement search functionality

