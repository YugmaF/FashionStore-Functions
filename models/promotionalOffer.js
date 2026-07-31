const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

const promotionalOfferSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        maxLength: 100
    },
    description: {
        type: String,
        required: true,
        maxLength: 2000
    },
    type: {
        type: String,
        required: true,
        enum: ['percentage', 'fixed', 'bogo', 'bundle'],
        default: 'percentage'
    },
    value: {
        type: Number,
        required: true,
        min: 0
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    usageLimit: {
        type: Number,
        default: null,
        min: 1
    },
    usageCount: {
        type: Number,
        default: 0,
        min: 0
    },
    perCustomerLimit: {
        type: Number,
        default: null,
        min: 1
    },
    minPurchase: {
        type: Number,
        default: null,
        min: 0
    },
    maxDiscount: {
        type: Number,
        default: null,
        min: 0
    },
    priority: {
        type: Number,
        default: 0
    },
    canStack: {
        type: Boolean,
        default: false
    },
    applicableProducts: [{
        type: ObjectId,
        ref: 'Product'
    }],
    applicableCategories: [{
        type: ObjectId,
        ref: 'Category'
    }],
    createdBy: {
        type: ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

promotionalOfferSchema.virtual('isActiveNow').get(function() {
    const now = new Date();
    return this.isActive && 
           now >= this.startDate && 
           now <= this.endDate &&
           (this.usageLimit === null || this.usageCount < this.usageLimit);
});

promotionalOfferSchema.methods.calculateDiscount = function(originalPrice) {
    if (!this.isActiveNow) {
        return 0;
    }

    let discount = 0;

    switch (this.type) {
        case 'percentage':
            discount = originalPrice * (this.value / 100);
            break;
        case 'fixed':
            discount = this.value;
            break;
        case 'bogo':
            discount = originalPrice;
            break;
        case 'bundle':
            discount = originalPrice * (this.value / 100);
            break;
        default:
            discount = 0;
    }

    if (this.maxDiscount && discount > this.maxDiscount) {
        discount = this.maxDiscount;
    }

    return Math.max(0, discount);
};

promotionalOfferSchema.methods.incrementUsage = function() {
    this.usageCount += 1;
    return this.save();
};

promotionalOfferSchema.statics.getActiveOffers = function() {
    const now = new Date();
    return this.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $or: [
            { usageLimit: null },
            { usageCount: { $lt: '$usageLimit' } }
        ]
    }).sort({ priority: -1, createdAt: -1 });
};

promotionalOfferSchema.pre('save', function(next) {
    if (this.startDate >= this.endDate) {
        return next(new Error('Start date must be before end date'));
    }

    if (this.value < 0) {
        return next(new Error('Discount value cannot be negative'));
    }

    if (this.usageLimit && this.usageLimit <= 0) {
        return next(new Error('Usage limit must be positive'));
    }

    if (this.perCustomerLimit && this.perCustomerLimit <= 0) {
        return next(new Error('Per customer limit must be positive'));
    }

    next();
});

module.exports = mongoose.model('PromotionalOffer', promotionalOfferSchema);