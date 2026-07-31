# Promotional Offers Feature Documentation

## Overview
This document describes the promotional offers functionality added to the product management system. The feature enables store managers to create and manage various types of promotional offers for individual products.

## Features Implemented

### 1. Discount Types
- **Percentage-based Discounts**: Apply a percentage off the product price (e.g., 20% off)
- **Fixed Amount Discounts**: Apply a fixed amount discount (e.g., $10 off)

### 2. Time-based Promotions
- **Start Date/Time**: When the promotion becomes active
- **End Date/Time**: When the promotion expires
- **Automatic Validation**: Promotions are automatically validated against current time

### 3. Offer Conditions
- **Minimum Order Quantity**: Minimum number of items required to qualify
- **Minimum Order Value**: Minimum total purchase value required
- **Maximum Discount Cap**: Maximum discount amount (for percentage deals)
- **Active/Inactive Status**: Enable/disable promotions without removing data

### 4. Helper Methods
- **Final Price Calculation**: Automatic calculation of discounted price
- **Promotion Validation**: Check if promotion is currently active
- **Discount Amount Calculation**: Calculate exact discount for cart items

## Database Schema

### Product Model Changes

```javascript
promotionalOffer: {
    isActive: Boolean,           // Enable/disable promotion
    discountType: String,        // 'percentage' or 'fixed'
    discountValue: Number,       // Discount amount
    startDate: Date,            // Promotion start date
    endDate: Date,              // Promotion end date
    minOrderQuantity: Number,   // Minimum items required
    minOrderValue: Number,      // Minimum order value required
    maxDiscountCap: Number,     // Maximum discount (percentage deals)
    description: String         // Promotion description
}
```

### Virtual Fields
- **finalPrice**: Automatically calculated price with active promotion
- **isPromotionActive()**: Method to check if promotion is currently valid
- **calculateDiscountAmount(quantity)**: Calculate discount for cart

## API Endpoints

### Create Product with Promotion
```http
POST /api/product/create/:userId
Content-Type: multipart/form-data

{
  "name": "Product Name",
  "description": "Product description",
  "category": "category_id",
  "price": 99.99,
  "currency": "USD",
  "quantity": 100,
  "takeInMethod": true,
  "promotionalOffer": {
    "isActive": true,
    "discountType": "percentage",
    "discountValue": 20,
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-12-31T23:59:59.000Z",
    "minOrderQuantity": 1,
    "minOrderValue": 0,
    "maxDiscountCap": 50,
    "description": "20% off summer sale!"
  }
}
```

### Update Product Promotion
```http
PUT /api/product/:productId/:userId
Content-Type: application/json

{
  "promotionalOffer": {
    "isActive": true,
    "discountType": "fixed",
    "discountValue": 10,
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-03-31T23:59:59.000Z",
    "minOrderQuantity": 2,
    "minOrderValue": 50,
    "description": "$10 off when you buy 2 or more!"
  }
}
```

### Get All Promotional Products
```http
GET /api/products/promotional
```
Returns all products with currently active promotions.

### Get Flash Sale Products
```http
GET /api/products/flash-sale?limitTo=10
```
Returns top products with highest discounts (sorted by discount value).

### Validate Promotion
```http
POST /api/product/:productId/validate-promotion
Content-Type: application/json

{
  "quantity": 3
}
```
Validates if promotion is active and calculates discount for given quantity.

## Usage Examples

### Example 1: Percentage Discount with Cap
```javascript
{
  "isActive": true,
  "discountType": "percentage",
  "discountValue": 30,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z",
  "minOrderQuantity": 1,
  "minOrderValue": 0,
  "maxDiscountCap": 100,
  "description": "30% off, up to $100 discount!"
}

// Product price: $200
// Discount: 30% of $200 = $60
// Final price: $140
```

### Example 2: Fixed Amount Discount
```javascript
{
  "isActive": true,
  "discountType": "fixed",
  "discountValue": 25,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-06-30T23:59:59.000Z",
  "minOrderQuantity": 1,
  "minOrderValue": 0,
  "description": "$25 off!"
}

// Product price: $99.99
// Discount: $25
// Final price: $74.99
```

### Example 3: Bulk Purchase Discount
```javascript
{
  "isActive": true,
  "discountType": "percentage",
  "discountValue": 15,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z",
  "minOrderQuantity": 3,
  "minOrderValue": 0,
  "description": "15% off when you buy 3 or more!"
}

// Product price: $50
// Quantity: 5
// Total before discount: $250
// Discount: 15% of $250 = $37.50
// Final price: $212.50
```

### Example 4: Minimum Order Value Discount
```javascript
{
  "isActive": true,
  "discountType": "fixed",
  "discountValue": 20,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z",
  "minOrderQuantity": 1,
  "minOrderValue": 100,
  "description": "$20 off orders over $100!"
}

// Product price: $30
// Quantity: 4
// Total before discount: $120
// Min order value met: $120 >= $100 ✓
// Discount: $20
// Final price: $100
```

## Validation Rules

### Creating/Updating Promotions
1. **Discount Type**: Must be either 'percentage' or 'fixed'
2. **Discount Value**: Must be greater than 0
3. **Percentage Discount**: Cannot exceed 100%
4. **Date Range**: End date must be greater than start date (if both provided)
5. **Minimum Order Quantity**: Must be at least 1
6. **Minimum Order Value**: Cannot be negative
7. **Maximum Discount Cap**: Cannot be negative

### Promotion Activation
A promotion is considered active if:
- `isActive` is `true`
- Current date/time is within the promotion period (or dates are not set)
- `discountValue` is greater than 0

### Discount Calculation
1. Check if promotion is active
2. Verify minimum order quantity (if specified)
3. Verify minimum order value (if specified)
4. Calculate discount based on type:
   - **Percentage**: `(totalPrice * discountValue) / 100`
   - **Fixed**: `discountValue * quantity`
5. Apply maximum discount cap (for percentage discounts)
6. Ensure discount doesn't exceed total price

## Frontend Integration

### Display Promotional Products
```javascript
// Fetch promotional products
const fetchPromotionalProducts = async () => {
  const response = await fetch('/api/products/promotional');
  const products = await response.json();
  // Display products with discount badges
};

// Fetch flash sale products
const fetchFlashSaleProducts = async (limit = 10) => {
  const response = await fetch(`/api/products/flash-sale?limitTo=${limit}`);
  const products = await response.json();
  // Display top discounted products
};
```

### Validate Promotion at Checkout
```javascript
// Validate promotion for cart items
const validatePromotion = async (productId, quantity) => {
  const response = await fetch(`/api/product/${productId}/validate-promotion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity })
  });
  const result = await response.json();
  
  if (result.isValid) {
    // Apply discount
    const finalPrice = result.finalPrice;
    const discountAmount = result.discountAmount;
  } else {
    // Show error message
    console.log(result.message);
  }
};
```

### Display Product Price with Promotion
```javascript
// Product object includes virtual fields
const product = {
  _id: "product_id",
  name: "Product Name",
  price: 99.99,
  promotionalOffer: {
    isActive: true,
    discountType: "percentage",
    discountValue: 20
  },
  finalPrice: 79.99  // Automatically calculated
};

// Display in UI
const displayPrice = (product) => {
  if (product.promotionalOffer && product.promotionalOffer.isActive) {
    return (
      <div>
        <span style={{textDecoration: 'line-through'}}>${product.price}</span>
        <span style={{color: 'red', fontWeight: 'bold'}}>${product.finalPrice}</span>
        <span>{product.promotionalOffer.discountValue}% off</span>
      </div>
    );
  }
  return <span>${product.price}</span>;
};
```

## Best Practices

### 1. Time Management
- Always set proper start/end dates for limited-time offers
- Consider timezone differences when setting dates
- Use UTC dates for consistency

### 2. Discount Cap
- Always set a maximum discount cap for percentage deals
- This prevents excessive discounts on expensive items

### 3. Minimum Requirements
- Set minimum order quantity to encourage bulk purchases
- Set minimum order value to protect margins on low-margin items

### 4. Promotion Descriptions
- Keep descriptions clear and concise (max 200 characters)
- Include discount type and any special conditions
- Example: "30% off summer sale!" or "$10 off when you buy 3!"

### 5. Testing
- Always validate promotions before going live
- Test edge cases:
  - Exact minimum quantities
  - Maximum discount caps
  - Expired promotions
  - Borderline time periods

## Future Enhancements

### Potential Features for Future Implementation:
1. **Coupon Code System**: Support for promotional codes
2. **Usage Limits**: Track total usage and per-user limits
3. **Customer Segmentation**: Target specific customer groups
4. **Stacking Rules**: Control how promotions combine
5. **Category-level Promotions**: Apply promotions to entire categories
6. **Buy X Get Y Offers**: Support BOGO and similar deals
7. **Promotion Priority**: Handle multiple active promotions
8. **Analytics**: Track promotion performance metrics

## Troubleshooting

### Common Issues

**Issue**: Promotion not showing as active
- **Solution**: Check that `isActive` is `true`, dates are valid, and discount value > 0

**Issue**: Discount not applied in cart
- **Solution**: Verify minimum order quantity and value requirements are met

**Issue**: Discount exceeds product price
- **Solution**: System automatically caps discount at product price

**Issue**: Percentage discount too high
- **Solution**: Set a `maxDiscountCap` to limit maximum discount

**Issue**: Promotion expired prematurely
- **Solution**: Check that end date is in UTC and properly formatted

## Support

For issues or questions about the promotional offers feature, please refer to:
- API documentation in `/rest_requests/product.rest`
- Model definitions in `/models/product.js`
- Controller logic in `/controllers/product.js`