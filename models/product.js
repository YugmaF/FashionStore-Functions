const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema;

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        maxLength: 32
    },
    description: {
        type: String,
        required: true,
        maxLength: 5000
    },
    category: {
        type: ObjectId,
        ref: 'Category',
        required: true
    },
    price: {
        type: Number,
        trim: true,
        required: true,
        maxLength: 32
    },
    currency: {
        type: String,
        trim: true,
        required: true,
        maxLength: 32
    },
    quantity: {
        type: Number,
        required: true
    },
    sold: {
        type: Number,
        default: 0
    },
    image: {
        data: Buffer,
        contentType: String
    },
    takeInMethod: {
        required: false,
        type: Boolean
    },
    discount: {
        type: Number,
        default: 0.00
    },
    isPromotional: {
        type: Boolean,
        default: false
    },
    promoType: {
        type: String,
        enum: ['discount_percentage', 'fixed_amount', 'buy_one_get_one', 'bundle_deal', 'flash_sale', 'seasonal_sale', 'clearance'],
        default: null
    },
    promoStartDate: {
        type: Date,
        default: null
    },
    promoEndDate: {
        type: Date,
        default: null
    },
    promoPrice: {
        type: Number,
        default: null
    },
    promoStockLimit: {
        type: Number,
        default: null
    },
    promoSold: {
        type: Number,
        default: 0
    },
    promoMinQuantity: {
        type: Number,
        default: 1
    },
    promoDescription: {
        type: String,
        maxLength: 500,
        default: ''
    },
    rating: [{
        type: Number,
        required: false
    }],
    comments: [{
        user: {
            type: ObjectId,
            ref: 'User',
            required: true
        },
        comment: {
            type: String,
            required: true,
        },
        addedOn: {
            type: Date,
            required: true
        },
        required: false
    }]
}, {timestamps: true});

// Virtual property to check if promotion is currently active
productSchema.virtual('isPromotionActive').get(function() {
    if (!this.isPromotional) return false;
    const now = new Date();
    const startDate = this.promoStartDate ? new Date(this.promoStartDate) : null;
    const endDate = this.promoEndDate ? new Date(this.promoEndDate) : null;
    
    if (!startDate || !endDate) return false;
    if (startDate > now || endDate < now) return false;
    if (this.promoStockLimit && this.promoSold >= this.promoStockLimit) return false;
    
    return true;
});

// Virtual property to get the effective price (promo price if active, otherwise regular price)
productSchema.virtual('effectivePrice').get(function() {
    if (this.isPromotionActive) {
        return this.promoPrice || this.price;
    }
    return this.price;
});

// Ensure virtuals are included in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Product", productSchema);