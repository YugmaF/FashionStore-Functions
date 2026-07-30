# Promotional Offer Feature

## Overview
This feature allows store managers to create and manage promotional offers for products with flexible pricing and time-based promotions.

## Promotional Attributes

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `isPromo` | Boolean | No | Flag to indicate if product has an active promotion |
| `promoPrice` | Number | Yes (when isPromo=true) | The promotional/sale price during the promotion period |
| `promoStartDate` | Date | Yes (when isPromo=true) | Start date and time of the promotion |
| `promoEndDate` | Date | Yes (when isPromo=true) | End date and time of the promotion |
| `promoType` | String | No | Type of promotion: `percentage_discount`, `fixed_price`, `buy_one_get_one`, `bundle` |
| `promoDescription` | String | No | Description of the promotional offer (max 500 characters) |
| `promoCode` | String | No | Optional promo code required to activate the discount (max 50 characters) |

## Validation Rules

- When `isPromo` is `true`, the following fields are required:
  - `promoStartDate`
  - `promoEndDate`
  - `promoPrice`
- `promoEndDate` must be after `promoStartDate`
- `promoType` defaults to `percentage_discount` if not specified

## Usage Examples

### Creating a Product with Promotion

```javascript
POST /api/product/create/:userId
Content-Type: multipart/form-data

{
  name: "Summer Sale T-Shirt",
  description: "Premium quality cotton t-shirt available at special promotional price",
  category: "category_id",
  price: 49.99,
  currency: "USD",
  quantity: 100,
  takeInMethod: true,
  isPromo: true,
  promoPrice: 29.99,
  promoStartDate: "2024-06-01T00:00:00.000Z",
  promoEndDate: "2024-06-30T23:59:59.000Z",
  promoType: "percentage_discount",
  promoDescription: "Summer special! Get 40% off on this premium t-shirt. Limited time offer!",
  promoCode: "SUMMER40",
  discount: 40
}
```

### Updating a Product's Promotion

```javascript
PUT /api/product/:productId/:userId
Content-Type: multipart/form-data

{
  isPromo: true,
  promoPrice: 19.99,
  promoStartDate: "2024-06-01T00:00:00.000Z",
  promoEndDate: "2024-07-15T23:59:59.000Z",
  promoType: "fixed_price",
  promoDescription: "Extended sale! Now available at an incredible fixed price!",
  promoCode: "FLASHSALE",
  discount: 60
}
```

## Model Methods

### isPromoActive()
Checks if the promotion is currently active based on the current date and promo dates.

```javascript
const product = await Product.findById(productId);
if (product.isPromoActive()) {
  console.log("Promotion is currently active!");
}
```

### getEffectivePrice()
Returns the promotional price if the promotion is active, otherwise returns the regular price.

```javascript
const product = await Product.findById(productId);
const currentPrice = product.getEffectivePrice();
console.log(`Current price: $${currentPrice}`);
```

## Promotion Types

1. **percentage_discount**: Discount applied as a percentage off the regular price
2. **fixed_price**: Product available at a specific promotional price
3. **buy_one_get_one**: Buy one, get one free promotion
4. **bundle**: Special pricing when buying multiple items together

## API Endpoints

### Create Product with Promotion
`POST /api/product/create/:userId`

### Update Product Promotion
`PUT /api/product/:productId/:userId`

### Get Product Details
`GET /api/product/:productId`

Response includes all promotional fields if the product has an active promotion.

## Error Messages

- **"Complete all fields!"**: Missing required fields
- **"Promotion start and end dates are required when product is on promotion"**: Missing promo dates when `isPromo` is true
- **"Promotional price is required when product is on promotion"**: Missing `promoPrice` when `isPromo` is true
- **"Promotion end date must be after start date"**: Invalid date range

## REST API Examples

See `rest_requests/product.rest` for complete REST API request examples including:
- Creating a product with promotional offer
- Updating a product's promotion