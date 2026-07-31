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
    promotionalOffer: {
        type: {
            isActive: {
                type: Boolean,
                default: false
            },
            discountType: {
                type: String,
                enum: ['percentage', 'fixed'],
                default: 'percentage'
            },
            discountValue: {
                type: Number,
                default: 0,
                min: 0
            },
            startDate: {
                type: Date,
                default: null
            },
            endDate: {
                type: Date,
                default: null
            },
            minOrderQuantity: {
                type: Number,
                default: 1,
                min: 1
            },
            minOrderValue: {
                type: Number,
                default: 0,
                min: 0
            },
            maxDiscountCap: {
                type: Number,
                default: null,
                min: 0
            },
            description: {
                type: String,
                default: '',
                maxLength: 200
            }
        },
        default: null
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

// Virtual field to calculate final price with promotional offer
productSchema.virtual('finalPrice').get(function() {
    if (this.promotionalOffer && this.promotionalOffer.isActive) {
        const now = new Date();
        const startDate = this.promotionalOffer.startDate ? new Date(this.promotionalOffer.startDate) : null;
        const endDate = this.promotionalOffer.endDate ? new Date(this.promotionalOffer.endDate) : null;

        // Check if promotion is within valid time range
        const isWithinTimeRange = (!startDate || now >= startDate) && (!endDate || now <= endDate);

        if (isWithinTimeRange && this.promotionalOffer.discountValue > 0) {
            let discountAmount = 0;
            
            if (this.promotionalOffer.discountType === 'percentage') {
                discountAmount = (this.price * this.promotionalOffer.discountValue) / 100;
                
                // Apply maximum discount cap if set
                if (this.promotionalOffer.maxDiscountCap) {
                    discountAmount = Math.min(discountAmount, this.promotionalOffer.maxDiscountCap);
                }
            } else if (this.promotionalOffer.discountType === 'fixed') {
                discountAmount = this.promotionalOffer.discountValue;
            }
            
            const finalPrice = Math.max(0, this.price - discountAmount);
            return parseFloat(finalPrice.toFixed(2));
        }
    }
    return this.price;
});

// Method to check if promotional offer is currently active
productSchema.methods.isPromotionActive = function() {
    if (!this.promotionalOffer || !this.promotionalOffer.isActive) {
        return false;
    }

    const now = new Date();
    const startDate = this.promotionalOffer.startDate ? new Date(this.promotionalOffer.startDate) : null;
    const endDate = this.promotionalOffer.endDate ? new Date(this.promotionalOffer.endDate) : null;

    // Check if current time is within promotion period
    const isWithinTimeRange = (!startDate || now >= startDate) && (!endDate || now <= endDate);

    return isWithinTimeRange && this.promotionalOffer.discountValue > 0;
};

// Method to calculate discount amount
productSchema.methods.calculateDiscountAmount = function(quantity) {
    if (!this.isPromotionActive()) {
        return 0;
    }

    // Check minimum order quantity requirement
    if (quantity < this.promotionalOffer.minOrderQuantity) {
        return 0;
    }

    const totalPrice = this.price * quantity;
    
    // Check minimum order value requirement
    if (totalPrice < this.promotionalOffer.minOrderValue) {
        return 0;
    }

    let discountAmount = 0;
    
    if (this.promotionalOffer.discountType === 'percentage') {
        discountAmount = (totalPrice * this.promotionalOffer.discountValue) / 100;
        
        // Apply maximum discount cap if set
        if (this.promotionalOffer.maxDiscountCap) {
            discountAmount = Math.min(discountAmount, this.promotionalOffer.maxDiscountCap);
        }
    } else if (this.promotionalOffer.discountType === 'fixed') {
        discountAmount = this.promotionalOffer.discountValue * quantity;
        
        // Ensure discount doesn't exceed total price
        if (discountAmount > totalPrice) {
            discountAmount = totalPrice;
        }
    }

    return parseFloat(discountAmount.toFixed(2));
};

// Ensure virtual fields are included in JSON output
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Product", productSchema);