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
    isPromotional: {
        type: Boolean,
        default: false
    },
    promotionalPrice: {
        type: Number,
        trim: true,
        required: false
    },
    promoType: {
        type: String,
        enum: ['discount', 'buy_one_get_one', 'bundle', 'flash_sale', 'seasonal'],
        required: false
    },
    promoStartDate: {
        type: Date,
        required: false
    },
    promoEndDate: {
        type: Date,
        required: false
    },
    promoDescription: {
        type: String,
        maxLength: 500,
        required: false
    },
    promoCode: {
        type: String,
        trim: true,
        required: false
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

module.exports = mongoose.model("Product", productSchema);