# Promotional Offer Feature

## Overview
This feature adds comprehensive promotional offer capabilities to the product system, allowing store managers to create and manage various types of promotions.

## Promotional Offer Attributes

### Core Fields
- **isPromotional** (Boolean): Flag to indicate if the product has an active promotion
- **promoType** (String): Type of promotion (enum values)
  - `discount_percentage` - Percentage-based discount
  - `fixed_amount` - Fixed price discount
  - `buy_one_get_one` - Buy one get one free
  - `bundle_deal` - Bundle pricing
  - `flash_sale` - Limited time flash sale
  - `seasonal_sale` - Seasonal promotion
  - `clearance` - Clearance sale

### Date & Time
- **promoStartDate** (Date): When the promotion starts
- **promoEndDate** (Date): When the promotion ends

### Pricing & Stock
- **promoPrice** (Number): Special promotional price (required for discount_percentage and fixed_amount types)
- **promoStockLimit** (Number): Maximum quantity available at promotional price
- **promoSold** (Number): Quantity sold at promotional price (auto-incremented)
- **promoMinQuantity** (Number): Minimum quantity required to qualify for promotion (default: 1)

### Description
- **promoDescription** (String): Description of the promotion (max 500 characters)

### Virtual Properties
- **isPromotionActive** (Boolean): Computed property indicating if promotion is currently active
- **effectivePrice** (Number): Returns promo price if active, otherwise regular price

## API Endpoints

### Get All Promotional Products
```
GET /api/products/promotional
```
Returns all products with active promotions (within date range and stock limit).

### Create Product with Promotion
```
POST /api/product/create/:userId
```
Include promotional fields in the form data when creating a product.

### Update Product Promotion
```
PUT /api/product/:productId/:userId
```
Update promotional fields for an existing product.

## Validation Rules

1. **Required Fields for Promotional Products:**
   - `isPromotional` must be true
   - `promoType` is required
   - `promoStartDate` and `promoEndDate` are required
   - `promoPrice` is required for `discount_percentage` and `fixed_amount` types

2. **Date Validation:**
   - `promoEndDate` must be after `promoStartDate`

3. **Stock Limit:**
   - Products won't appear in promotional list if `promoSold` >= `promoStockLimit`

## Example: Create a Promotional Product

```javascript
// POST /api/product/create/:userId
const formData = {
  name: "Special Edition Widget",
  description: "Premium quality widget with special discount",
  category: "category_id",
  price: 100,
  currency: "USD",
  quantity: 50,
  takeInMethod: true,
  
  // Promotional fields
  isPromotional: true,
  promoType: "discount_percentage",
  promoStartDate: "2024-01-01T00:00:00.000Z",
  promoEndDate: "2024-12-31T23:59:59.000Z",
  promoPrice: 75,  // 25% off
  promoStockLimit: 100,
  promoMinQuantity: 1,
  promoDescription: "Special 25% discount for limited time!"
};
```

## Usage Examples

### Example 1: Flash Sale
```javascript
{
  isPromotional: true,
  promoType: "flash_sale",
  promoStartDate: "2024-01-01T00:00:00.000Z",
  promoEndDate: "2024-01-02T00:00:00.000Z",
  promoPrice: 49.99,
  promoStockLimit: 500,
  promoDescription: "24-hour flash sale!"
}
```

### Example 2: Buy One Get One
```javascript
{
  isPromotional: true,
  promoType: "buy_one_get_one",
  promoStartDate: "2024-01-01T00:00:00.000Z",
  promoEndDate: "2024-01-31T23:59:59.000Z",
  promoMinQuantity: 2,
  promoDescription: "Buy one, get one free!"
}
```

### Example 3: Bundle Deal
```javascript
{
  isPromotional: true,
  promoType: "bundle_deal",
  promoStartDate: "2024-01-01T00:00:00.000Z",
  promoEndDate: "2024-03-31T23:59:59.000Z",
  promoMinQuantity: 3,
  promoPrice: 80,  // Special price for bundle
  promoDescription: "Buy 3 for $80 (save $20)"
}
```

## Best Practices

1. **Date Planning:** Always set appropriate start and end dates for promotions
2. **Stock Limits:** Use `promoStockLimit` to prevent overselling at promotional prices
3. **Clear Descriptions:** Use descriptive text in `promoDescription` to explain the promotion to customers
4. **Testing:** Test promotions with small stock limits first before large campaigns
5. **Monitoring:** Monitor `promoSold` counter to track promotional sales performance

## Integration Notes

- The existing `discount` field is maintained for backward compatibility
- Promotional features are optional - products can exist without any promotional data
- Virtual properties are automatically included in JSON responses
- All validation occurs at the controller level for consistency