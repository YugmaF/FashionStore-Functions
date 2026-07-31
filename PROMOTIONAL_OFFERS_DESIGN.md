# Promotional Offers Backend Design Document

## Research Findings: Essential Features for E-commerce Promotional Offers

### 1. Offer Types
- **Percentage Discount**: Offer a percentage off the product price (e.g., 20% off)
- **Fixed Amount Discount**: Offer a fixed amount off the product price (e.g., $10 off)
- **Buy X Get Y Free**: Buy X quantity, get Y quantity free
- **Bundle Discount**: Special price when buying multiple products together
- **Flash Sale**: Limited-time deep discount offers
- **Coupon/Code-based**: Promotions requiring promo code entry

### 2. Time-Based Features
- **Start Date/Time**: When the promotion becomes active
- **End Date/Time**: When the promotion expires
- **Duration**: How long the promotion lasts
- **Recurring Options**: Daily, weekly, monthly recurring promotions
- **Peak Hours**: Time-specific promotions (e.g., happy hour)

### 3. Applicability Rules
- **Product-Specific**: Applied to individual products
- **Category-Wide**: Applied to all products in a category
- **Store-Wide**: Applied to all products
- **Customer Segments**: Specific customer groups
- **Minimum Purchase**: Minimum cart value or quantity required
- **Maximum Discount**: Cap on discount amount

### 4. Limitations & Controls
- **Usage Limit**: Total times the offer can be used
- **Per-Customer Limit**: How many times one customer can use it
- **Stock Limit**: Maximum discounted units available
- **Budget Cap**: Maximum total discount value
- **First-Come-First-Served**: While supplies last

### 5. Status & Tracking
- **Active/Inactive**: Enable/disable promotions
- **Draft/Published**: Work-in-progress state
- **Usage Count**: Track how many times used
- **Redemption Rate**: Performance metrics
- **Revenue Impact**: Track sales generated

### 6. Priority & Stacking
- **Priority Level**: Order of precedence when multiple offers apply
- **Stacking Rules**: Can be combined with other offers
- **Exclusivity**: Cannot be combined with other promotions
- **Best Deal**: Automatically select best discount for customer

### 7. Validation Rules
- **Eligibility**: Who can use the offer
- **Geographic Restrictions**: Location-based promotions
- **Payment Method**: Specific payment method discounts
- **New Customers Only**: First-time buyer promotions
- **User Groups**: VIP, registered users, etc.

### 8. Marketing Features
- **Promotional Name**: Display name for the offer
- **Description**: Detailed offer description
- **Banner Image**: Visual promotion assets
- **Display Order**: Sort order in UI
- **Featured Flag**: Highlight important promotions

## Implementation Scope

### Phase 1: Core Functionality (Current Implementation)
✅ Offer model with essential fields
✅ Product-offer relationship
✅ CRUD operations for offers
✅ Price calculation with offers
✅ Time-based activation
✅ Usage tracking

### Phase 2: Advanced Features (Future Enhancements)
- Category-wide promotions
- Bundle deals
- Coupon codes
- Customer segmentation
- Stacking rules
- Analytics dashboard
- Email/SMS notifications

## Database Schema Design

### PromotionalOffer Collection
```javascript
{
  name: String,              // Display name
  description: String,       // Offer details
  type: String,              // 'percentage' | 'fixed' | 'bogo' | 'bundle'
  value: Number,             // Discount value (percentage or amount)
  startDate: Date,           // Promotion start
  endDate: Date,             // Promotion end
  isActive: Boolean,         // Enable/disable
  usageLimit: Number,        // Max total uses
  usageCount: Number,        // Current usage count
  perCustomerLimit: Number,  // Uses per customer
  minPurchase: Number,       // Minimum purchase amount
  maxDiscount: Number,       // Maximum discount cap
  priority: Number,          // Priority level
  canStack: Boolean,         // Can combine with other offers
  applicableProducts: [ObjectId], // Specific products
  applicableCategories: [ObjectId], // Categories
  createdAt: Date,
  updatedAt: Date
}
```

### Product Collection Updates
```javascript
{
  // ... existing fields ...
  promotionalOffers: [{
    offer: ObjectId,         // Reference to PromotionalOffer
    appliedAt: Date          // When offer was applied
  }],
  activeOffer: ObjectId,     // Currently active offer
  discountedPrice: Number,   // Current price with discount
  hasActiveOffer: Boolean   // Quick lookup flag
}
```

## API Endpoints

### Promotional Offers Management
- `POST /api/promotional-offer/create/:userId` - Create new offer
- `GET /api/promotional-offer/:offerId` - Get offer details
- `PUT /api/promotional-offer/:offerId/:userId` - Update offer
- `DELETE /api/promotional-offer/:offerId/:userId` - Delete offer
- `GET /api/promotional-offers` - List all offers
- `GET /api/promotional-offers/active` - Get currently active offers

### Product Offer Integration
- `PUT /api/product/:productId/apply-offer/:offerId/:userId` - Apply offer to product
- `PUT /api/product/:productId/remove-offer/:userId` - Remove offer from product
- `GET /api/products/offers` - Get products with active offers
- `GET /api/products/:productId/offers` - Get offers for specific product

## Business Logic

### Discount Calculation
1. Check if offer is currently active (date range and isActive flag)
2. Verify all eligibility requirements (stock, limits, etc.)
3. Calculate discount based on offer type:
   - Percentage: `price * (value / 100)`
   - Fixed: `price - value`
   - BOGO: Buy X, get Y at discount
4. Apply maximum discount cap if set
5. Ensure final price is not negative
6. Update usage count and timestamps

### Validation Rules
- Start date must be before end date
- Discount value cannot be negative
- Usage limits must be positive integers
- Product must exist when assigned
- Cannot delete active offer with usage history

## Security Considerations
- Only admin/store manager can create/update offers
- Price calculations must be server-side
- Prevent price manipulation
- Audit trail for offer changes
- Rate limiting on offer redemption