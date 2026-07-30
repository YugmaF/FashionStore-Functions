# Project Memory

## Promotional Offer Feature Implementation

### Overview
Added comprehensive promotional offer feature to the product create/edit functionality. This feature allows store managers to create time-limited promotional offers for products.

### Schema Changes (models/product.js)
Added the following fields to the product schema:
- `isPromotional` (Boolean): Flag to indicate if product has an active promotional offer
- `promotionalPrice` (Number): The special discounted price for the promotion
- `promoType` (String): Type of promotion - enum values: ['discount', 'buy_one_get_one', 'bundle', 'flash_sale', 'seasonal']
- `promoStartDate` (Date): When the promotion starts
- `promoEndDate` (Date): When the promotion ends
- `promoDescription` (String): Optional description of the promotion (max 500 chars)
- `promoCode` (String): Optional promo code required to activate the promotion

### Controller Changes (controllers/product.js)
1. **Updated create() method**: Added validation for promotional fields
   - If promotional is enabled, validates that promotionalPrice, promoType, promoStartDate, and promoEndDate are provided
   - Validates that promotionalPrice is less than the original price
   - Validates that promoEndDate is after promoStartDate

2. **Added getPromotionalProducts() method**: Retrieves all products with active promotions
   - Filters by isPromotional: true
   - Checks current date is within promo start and end dates
   - Supports optional limitTo query parameter

3. **Added isPromotionActive() method**: Checks if promotion is active for a specific product
   - Returns promotion details if active
   - Returns status and appropriate message if not active (not started, ended, or no promotion)

### Route Changes (routes/product.js)
Added two new routes:
- `GET /products/promotional` - Get all products with active promotions
- `GET /product/:productId/promotion-status` - Check promotion status for a specific product

### Usage Examples

**Creating a product with promotion:**
```json
{
  "name": "Sample Product",
  "description": "Product description",
  "category": "category_id",
  "price": 100,
  "currency": "USD",
  "quantity": 50,
  "takeInMethod": true,
  "isPromotional": true,
  "promotionalPrice": 75,
  "promoType": "flash_sale",
  "promoStartDate": "2024-01-01T00:00:00.000Z",
  "promoEndDate": "2024-01-07T23:59:59.999Z",
  "promoDescription": "Limited time offer!",
  "promoCode": "FLASH2024"
}
```

**Getting active promotions:**
```
GET /products/promotional?limitTo=20
```

**Checking promotion status:**
```
GET /product/:productId/promotion-status
```

### Validation Rules
- Promotional price must be less than original price
- Promotional end date must be after start date
- When isPromotional is true, promotionalPrice, promoType, promoStartDate, and promoEndDate are required
- promoDescription has a maximum length of 500 characters

### Promotion Types
- `discount`: Standard percentage or amount discount
- `buy_one_get_one`: Buy one get one free
- `bundle`: Bundle deal pricing
- `flash_sale`: Limited time flash sale
- `seasonal`: Seasonal promotion