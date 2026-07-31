const PromotionalOffer = require('../models/promotionalOffer');
const Product = require('../models/product');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.getPromotionalOfferById = (req, res, next, id) => {
    PromotionalOffer.findById(id).exec((err, offer) => {
        if (err || !offer) {
            return res.status(400).json({
                error: "Promotional offer could not be found"
            });
        }
        req.offer = offer;
        next();
    });
};

exports.create = (req, res) => {
    const {
        name,
        description,
        type,
        value,
        startDate,
        endDate,
        isActive,
        usageLimit,
        perCustomerLimit,
        minPurchase,
        maxDiscount,
        priority,
        canStack,
        applicableProducts,
        applicableCategories
    } = req.body;

    if (!name || !description || !type || value === undefined || !startDate || !endDate) {
        return res.status(400).json({
            error: "Please provide all required fields: name, description, type, value, startDate, endDate"
        });
    }

    const offerData = {
        name,
        description,
        type,
        value,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive !== undefined ? isActive : false,
        createdBy: req.profile._id
    };

    if (usageLimit !== undefined) offerData.usageLimit = usageLimit;
    if (perCustomerLimit !== undefined) offerData.perCustomerLimit = perCustomerLimit;
    if (minPurchase !== undefined) offerData.minPurchase = minPurchase;
    if (maxDiscount !== undefined) offerData.maxDiscount = maxDiscount;
    if (priority !== undefined) offerData.priority = priority;
    if (canStack !== undefined) offerData.canStack = canStack;
    if (applicableProducts) offerData.applicableProducts = applicableProducts;
    if (applicableCategories) offerData.applicableCategories = applicableCategories;

    const offer = new PromotionalOffer(offerData);

    offer.save((err, data) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json(data);
    });
};

exports.read = (req, res) => {
    return res.json(req.offer);
};

exports.update = (req, res) => {
    const offer = req.offer;
    offer.name = req.body.name || offer.name;
    offer.description = req.body.description || offer.description;
    offer.type = req.body.type || offer.type;
    offer.value = req.body.value !== undefined ? req.body.value : offer.value;
    offer.startDate = req.body.startDate ? new Date(req.body.startDate) : offer.startDate;
    offer.endDate = req.body.endDate ? new Date(req.body.endDate) : offer.endDate;
    offer.isActive = req.body.isActive !== undefined ? req.body.isActive : offer.isActive;
    offer.usageLimit = req.body.usageLimit !== undefined ? req.body.usageLimit : offer.usageLimit;
    offer.perCustomerLimit = req.body.perCustomerLimit !== undefined ? req.body.perCustomerLimit : offer.perCustomerLimit;
    offer.minPurchase = req.body.minPurchase !== undefined ? req.body.minPurchase : offer.minPurchase;
    offer.maxDiscount = req.body.maxDiscount !== undefined ? req.body.maxDiscount : offer.maxDiscount;
    offer.priority = req.body.priority !== undefined ? req.body.priority : offer.priority;
    offer.canStack = req.body.canStack !== undefined ? req.body.canStack : offer.canStack;
    offer.updatedBy = req.profile._id;

    if (req.body.applicableProducts) {
        offer.applicableProducts = req.body.applicableProducts;
    }

    if (req.body.applicableCategories) {
        offer.applicableCategories = req.body.applicableCategories;
    }

    offer.save((err, data) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json(data);
    });
};

exports.remove = (req, res) => {
    const offer = req.offer;
    
    if (offer.usageCount > 0) {
        return res.status(400).json({
            error: "Cannot delete an offer that has been used. Deactivate it instead."
        });
    }

    offer.remove((err, deletedOffer) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json({ 
            message: "Promotional offer deleted successfully",
            deletedOffer
        });
    });
};

exports.getAllOffers = (req, res) => {
    let orderBy = req.query.orderBy ? req.query.orderBy : 'desc';
    let sortBy = req.query.sortBy ? req.query.sortBy : 'createdAt';
    let limitTo = req.query.limitTo ? parseInt(req.query.limitTo) : 10;

    PromotionalOffer.find()
        .sort([[sortBy, orderBy]])
        .limit(limitTo)
        .exec((err, offers) => {
            if (err) {
                return res.status(400).json({
                    error: "Offers not found"
                });
            }
            res.json(offers);
        });
};

exports.getActiveOffers = (req, res) => {
    PromotionalOffer.getActiveOffers()
        .exec((err, offers) => {
            if (err) {
                return res.status(400).json({
                    error: "Active offers not found"
                });
            }
            res.json(offers);
        });
};

exports.getOfferByProduct = (req, res) => {
    const productId = req.product._id;
    
    PromotionalOffer.getActiveOffers()
        .populate('applicableProducts')
        .exec((err, offers) => {
            if (err) {
                return res.status(400).json({
                    error: "Offers not found"
                });
            }

            const applicableOffers = offers.filter(offer => {
                return !offer.applicableProducts.length || 
                       offer.applicableProducts.some(prod => prod._id.toString() === productId.toString());
            });

            res.json(applicableOffers);
        });
};

exports.applyOfferToProduct = (req, res) => {
    const { offerId } = req.body;
    const product = req.product;

    PromotionalOffer.findById(offerId, (err, offer) => {
        if (err || !offer) {
            return res.status(400).json({
                error: "Offer not found"
            });
        }

        if (!offer.isActiveNow) {
            return res.status(400).json({
                error: "Offer is not currently active"
            });
        }

        product.applyPromotionalOffer(offer);
        product.save((err, savedProduct) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json(savedProduct);
        });
    });
};

exports.removeOfferFromProduct = (req, res) => {
    const product = req.product;
    
    product.removePromotionalOffer();
    product.save((err, savedProduct) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json(savedProduct);
    });
};

exports.getProductsByOffer = (req, res) => {
    const offerId = req.offer._id;

    Product.find({ 
        activeOffer: offerId,
        hasActiveOffer: true 
    })
    .populate('category')
    .select('-image')
    .exec((err, products) => {
        if (err) {
            return res.status(400).json({
                error: "Products not found"
            });
        }
        res.json(products);
    });
};

exports.incrementOfferUsage = (req, res) => {
    const offer = req.offer;

    if (offer.usageLimit && offer.usageCount >= offer.usageLimit) {
        return res.status(400).json({
            error: "Offer has reached its usage limit"
        });
    }

    offer.incrementUsage()
        .then(updatedOffer => {
            res.json(updatedOffer);
        })
        .catch(err => {
            return res.status(400).json({
                error: errorHandler(err)
            });
        });
};

exports.getOfferStatistics = (req, res) => {
    const offer = req.offer;

    Product.find({ activeOffer: offer._id })
        .select('price discountedPrice sold')
        .exec((err, products) => {
            if (err) {
                return res.status(400).json({
                    error: "Products not found"
                });
            }

            const totalProducts = products.length;
            const totalSold = products.reduce((sum, prod) => sum + (prod.sold || 0), 0);
            const totalDiscount = products.reduce((sum, prod) => {
                const discount = prod.price - prod.discountedPrice;
                return sum + (discount > 0 ? discount * (prod.sold || 0) : 0);
            }, 0);

            res.json({
                offer: {
                    id: offer._id,
                    name: offer.name,
                    type: offer.type,
                    value: offer.value
                },
                statistics: {
                    totalProducts,
                    totalSold,
                    usageCount: offer.usageCount,
                    remainingUsage: offer.usageLimit ? offer.usageLimit - offer.usageCount : null,
                    totalDiscountValue: totalDiscount,
                    isActiveNow: offer.isActiveNow
                }
            });
        });
};