const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema;

const userAuditSchema = new mongoose.Schema({
    userId: {
        type: ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: {
        type: String,
        required: true,
        trim: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'SIGNUP',
            'LOGIN',
            'LOGOUT',
            'LOGIN_FAILED',
            'PASSWORD_RESET_REQUEST',
            'PASSWORD_RESET_COMPLETE',
            'PASSWORD_CHANGE',
            'PROFILE_UPDATE',
            'STATE_CHANGE',
            'CART_ADD',
            'CART_REMOVE',
            'WISHLIST_ADD',
            'WISHLIST_REMOVE',
            'ORDER_PLACED'
        ]
    },
    ipAddress: {
        type: String,
        default: 'unknown'
    },
    userAgent: {
        type: String,
        default: 'unknown'
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILURE'],
        default: 'SUCCESS'
    },
    errorMessage: {
        type: String,
        default: null
    }
}, {timestamps: true});

// Indexes for efficient querying
userAuditSchema.index({userId: 1, createdAt: -1});
userAuditSchema.index({action: 1, createdAt: -1});
userAuditSchema.index({createdAt: -1});

module.exports = mongoose.model("UserAudit", userAuditSchema);
