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
    promotionalOffers: [{
        offer: {
            type: ObjectId,
            ref: 'PromotionalOffer'
        },
        appliedAt: {
            type: Date,
            default: Date.now
        }
    }],
    activeOffer: {
        type: ObjectId,
        ref: 'PromotionalOffer'
    },
    discountedPrice: {
        type: Number,
        default: 0
    },
    hasActiveOffer: {
        type: Boolean,
        default: false
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

productSchema.methods.getFinalPrice = function() {
    if (this.hasActiveOffer && this.activeOffer) {
        return Math.max(0, this.discountedPrice);
    }
    return this.price;
};

productSchema.methods.applyPromotionalOffer = function(offer) {
    const PromotionalOffer = mongoose.model('PromotionalOffer');
    
    if (!offer || !offer.isActiveNow) {
        this.hasActiveOffer = false;
        this.activeOffer = null;
        this.discountedPrice = this.price;
        return;
    }

    const discount = offer.calculateDiscount(this.price);
    this.discountedPrice = Math.max(0, this.price - discount);
    this.hasActiveOffer = true;
    this.activeOffer = offer._id;

    const existingOffer = this.promotionalOffers.find(
        po => po.offer && po.offer.toString() === offer._id.toString()
    );
    
    if (!existingOffer) {
        this.promotionalOffers.push({
            offer: offer._id,
            appliedAt: new Date()
        });
    }
};

productSchema.methods.removePromotionalOffer = function() {
    this.hasActiveOffer = false;
    this.activeOffer = null;
    this.discountedPrice = this.price;
};

productSchema.methods.getAppliedOffers = function() {
    return this.populate('promotionalOffers.offer').then(populated => {
        return populated.promotionalOffers.map(po => po.offer);
    });
};

module.exports = mongoose.model("Product", productSchema);