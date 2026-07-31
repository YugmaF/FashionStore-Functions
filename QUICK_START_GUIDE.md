# Promotional Offers Quick Start Guide

## 5-Minute Getting Started

### Step 1: Understand the Basics

Promotional offers are stored in the `promotionalOffer` field of each product. This field contains all the information needed to create and manage promotions.

### Step 2: Create Your First Promotion

**Simple 20% Off Promotion:**
```json
{
  "name": "My Product",
  "description": "Product description",
  "category": "category_id",
  "price": 100,
  "currency": "USD",
  "quantity": 50,
  "takeInMethod": true,
  "promotionalOffer": {
    "isActive": true,
    "discountType": "percentage",
    "discountValue": 20,
    "description": "20% off!"
  }
}
```

### Step 3: Test the Promotion

**Get the product:**
```bash
curl http://localhost:8000/api/product/{productId}
```

**Check the response:**
```json
{
  "_id": "product_id",
  "name": "My Product",
  "price": 100,
  "finalPrice": 80,  // ← This is automatically calculated!
  "promotionalOffer": {
    "isActive": true,
    "discountType": "percentage",
    "discountValue": 20,
    "description": "20% off!"
  }
}
```

## Common Promotion Patterns

### Pattern 1: Flash Sale (24 Hours)
```json
{
  "isActive": true,
  "discountType": "percentage",
  "discountValue": 50,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-01T23:59:59.000Z",
  "description": "Flash Sale - 50% off today only!"
}
```

### Pattern 2: Bulk Discount (Buy 3+)
```json
{
  "isActive": true,
  "discountType": "percentage",
  "discountValue": 15,
  "minOrderQuantity": 3,
  "description": "Buy 3 or more, get 15% off!"
}
```

### Pattern 3: Fixed Amount ($10 Off)
```json
{
  "isActive": true,
  "discountType": "fixed",
  "discountValue": 10,
  "description": "$10 off!"
}
```

### Pattern 4: High-Value Item with Cap
```json
{
  "isActive": true,
  "discountType": "percentage",
  "discountValue": 20,
  "maxDiscountCap": 100,
  "description": "20% off, up to $100!"
}
```

### Pattern 5: Minimum Order Value
```json
{
  "isActive": true,
  "discountType": "fixed",
  "discountValue": 20,
  "minOrderValue": 100,
  "description": "$20 off orders over $100!"
}
```

## API Endpoints Cheat Sheet

| Endpoint | Method | Description | Example |
|----------|--------|-------------|---------|
| `/api/product/create/:userId` | POST | Create product with promotion | See above |
| `/api/product/:productId/:userId` | PUT | Update promotion | Update only promotionalOffer |
| `/api/product/:productId` | GET | Get product (includes finalPrice) | Returns calculated price |
| `/api/products/promotional` | GET | Get all promotional products | Active promotions only |
| `/api/products/flash-sale` | GET | Get top discounted products | Sorted by discount |
| `/api/product/:productId/validate-promotion` | POST | Validate for cart | Check eligibility |

## Quick Testing Commands

### Create Product with Promotion
```bash
curl -X POST http://localhost:8000/api/product/create/{userId} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Product",
    "description": "Test description",
    "category": "CATEGORY_ID",
    "price": 99.99,
    "currency": "USD",
    "quantity": 10,
    "takeInMethod": true,
    "promotionalOffer": {
      "isActive": true,
      "discountType": "percentage",
      "discountValue": 20,
      "description": "20% off test!"
    }
  }'
```

### Update Promotion
```bash
curl -X PUT http://localhost:8000/api/product/PRODUCT_ID/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "promotionalOffer": {
      "isActive": true,
      "discountType": "percentage",
      "discountValue": 30,
      "description": "Now 30% off!"
    }
  }'
```

### Get Promotional Products
```bash
curl http://localhost:8000/api/products/promotional
```

### Get Flash Sale Products (Top 5)
```bash
curl http://localhost:8000/api/products/flash-sale?limitTo=5
```

### Validate Promotion for Cart
```bash
curl -X POST http://localhost:8000/api/product/PRODUCT_ID/validate-promotion \
  -H "Content-Type: application/json" \
  -d '{"quantity": 3}'
```

## Validation Rules Summary

✅ **Must Have:**
- `isActive`: true (to activate)
- `discountType`: 'percentage' or 'fixed'
- `discountValue`: > 0

✅ **Optional but Recommended:**
- `description`: For customers
- `startDate` & `endDate`: For time-limited offers

✅ **Advanced Options:**
- `minOrderQuantity`: Bulk purchase incentive
- `minOrderValue`: Order value requirement
- `maxDiscountCap`: Limit percentage discounts

⚠️ **Constraints:**
- Percentage discounts cannot exceed 100%
- End date must be after start date
- Minimum quantity must be ≥ 1
- Values cannot be negative

## Price Calculation Logic

### How It Works:

1. **Check if promotion is active**
   - `isActive` = true
   - Within date range (if dates set)
   - `discountValue` > 0

2. **Check eligibility**
   - Quantity ≥ `minOrderQuantity`
   - Total value ≥ `minOrderValue`

3. **Calculate discount**
   - **Percentage**: `(totalPrice × discountValue) ÷ 100`
   - **Fixed**: `discountValue × quantity`

4. **Apply cap** (if set)
   - For percentage discounts only
   - `discount = min(discount, maxDiscountCap)`

5. **Calculate final price**
   - `finalPrice = max(0, totalPrice - discount)`

### Example Calculations:

**Example 1: Simple Percentage**
- Price: $100
- Discount: 20%
- Final: $80

**Example 2: Percentage with Cap**
- Price: $500
- Discount: 30% ($150)
- Cap: $100
- Final: $400

**Example 3: Fixed Amount**
- Price: $50
- Quantity: 3
- Discount: $10 × 3 = $30
- Total: $150 - $30 = $120

**Example 4: Minimum Quantity**
- Price: $25
- Quantity: 2
- Min required: 3
- Result: No discount (quantity too low)

## Troubleshooting Quick Fixes

### Problem: Promotion not showing as active

**Check:**
1. Is `isActive` set to `true`?
2. Is `discountValue` > 0?
3. Are dates valid (end > start)?
4. Is current time within date range?

**Solution:**
```json
{
  "isActive": true,
  "discountValue": 20,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z"
}
```

### Problem: Discount not applied in cart

**Check:**
1. Is quantity ≥ `minOrderQuantity`?
2. Is total value ≥ `minOrderValue`?

**Solution:**
```json
{
  "minOrderQuantity": 1,
  "minOrderValue": 0
}
```

### Problem: Final price is wrong

**Check:**
1. Is discount calculation correct?
2. Is `maxDiscountCap` affecting result?
3. Is discount exceeding total price?

### Problem: Getting validation errors

**Common Errors:**
- `"Invalid discount type"` → Use 'percentage' or 'fixed'
- `"Discount value must be greater than 0"` → Set positive value
- `"Percentage discount cannot exceed 100%"` → Use value ≤ 100
- `"End date must be greater than start date"` → Fix dates

## Frontend Integration Tips

### Display Promotional Price
```javascript
const ProductDisplay = ({ product }) => {
  const hasPromotion = product.promotionalOffer?.isActive;
  
  return (
    <div>
      <h2>{product.name}</h2>
      {hasPromotion ? (
        <>
          <p className="original-price">${product.price.toFixed(2)}</p>
          <p className="sale-price">${product.finalPrice.toFixed(2)}</p>
          <span className="discount-badge">
            {product.promotionalOffer.discountType === 'percentage'
              ? `${product.promotionalOffer.discountValue}% OFF`
              : `$${product.promotionalOffer.discountValue} OFF`}
          </span>
        </>
      ) : (
        <p className="price">${product.price.toFixed(2)}</p>
      )}
    </div>
  );
};
```

### Show Flash Sale Banner
```javascript
const FlashSaleBanner = () => {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    fetch('/api/products/flash-sale?limitTo=5')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);
  
  return (
    <div className="flash-sale">
      <h2>🔥 Flash Sale 🔥</h2>
      {products.map(product => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};
```

### Validate at Checkout
```javascript
const validatePromotion = async (productId, quantity) => {
  const response = await fetch(`/api/product/${productId}/validate-promotion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity })
  });
  
  const result = await response.json();
  
  if (result.isValid) {
    return {
      success: true,
      discount: result.discountAmount,
      finalPrice: result.finalPrice
    };
  } else {
    return {
      success: false,
      message: result.message
    };
  }
};
```

## Best Practices

### DO ✅
- Always set a description for customers
- Use time-limited offers for urgency
- Set `maxDiscountCap` for percentage deals
- Test promotions before going live
- Use meaningful discount values

### DON'T ❌
- Don't set percentage > 100%
- Don't set end date before start date
- Don't forget to activate (`isActive: true`)
- Don't exceed 200 characters in description
- Don't leave validation errors unchecked

## Common Mistakes

### Mistake 1: Forgetting to Activate
```javascript
// ❌ Wrong
{
  "discountType": "percentage",
  "discountValue": 20
}

// ✅ Correct
{
  "isActive": true,  // ← Don't forget this!
  "discountType": "percentage",
  "discountValue": 20
}
```

### Mistake 2: Invalid Discount Type
```javascript
// ❌ Wrong
{
  "discountType": "percent",
  "discountValue": 20
}

// ✅ Correct
{
  "discountType": "percentage",  // ← Must be exactly this
  "discountValue": 20
}
```

### Mistake 3: Wrong Date Format
```javascript
// ❌ Wrong
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}

// ✅ Correct
{
  "startDate": "2024-01-01T00:00:00.000Z",  // ← Full ISO format
  "endDate": "2024-12-31T23:59:59.000Z"
}
```

## Need More Help?

📖 **Full Documentation**: `PROMOTIONAL_OFFERS_DOCUMENTATION.md`
🔬 **Research & Design**: `RESEARCH_PROMOTIONAL_OFFERS.md`
📋 **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
🧪 **API Examples**: `rest_requests/product.rest`

## Checklist for Going Live

- [ ] Test create product with promotion
- [ ] Test update promotion
- [ ] Test get promotional products
- [ ] Test flash sale endpoint
- [ ] Test promotion validation
- [ ] Verify price calculations
- [ ] Check validation rules
- [ ] Test time-based activation
- [ ] Verify minimum requirements
- [ ] Test maximum discount caps
- [ ] Update frontend UI
- [ ] Add promotional badges
- [ ] Create flash sale banner
- [ ] Test checkout integration
- [ ] Document for other developers

---

**You're ready to go!** 🚀

Start with a simple 20% off promotion and expand from there. The system will handle all the calculations automatically.