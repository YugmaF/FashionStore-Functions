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
    discount:{
        type: Number,
        default: 0.00
    },
    isPromo: {
        type: Boolean,
        default: false
    },
    promoPrice: {
        type: Number,
        trim: true
    },
    promoStartDate: {
        type: Date
    },
    promoEndDate: {
        type: Date
    },
    promoType: {
        type: String,
        enum: ['percentage_discount', 'fixed_price', 'buy_one_get_one', 'bundle'],
        default: 'percentage_discount'
    },
    promoDescription: {
        type: String,
        maxLength: 500
    },
    promoCode: {
        type: String,
        trim: true,
        maxLength: 50
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

// Method to check if promotion is currently active
productSchema.methods.isPromoActive = function() {
    if (!this.isPromo || !this.promoStartDate || !this.promoEndDate) {
        return false;
    }
    const now = new Date();
    return now >= this.promoStartDate && now <= this.promoEndDate;
};

// Method to get the effective price (promo price if active, otherwise regular price)
productSchema.methods.getEffectivePrice = function() {
    return this.isPromoActive() && this.promoPrice ? this.promoPrice : this.price;
};

module.exports = mongoose.model("Product", productSchema);