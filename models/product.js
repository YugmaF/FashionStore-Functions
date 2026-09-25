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
        default: 0.00,
        min: 0,
        max: 100
    },
    promotionTitle: {
        type: String,
        trim: true,
        maxlength: 80,
        default: ''
    },
    promotionStart: {
        type: Date,
        default: null
    },
    promotionEnd: {
        type: Date,
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

module.exports = mongoose.model("Product", productSchema);