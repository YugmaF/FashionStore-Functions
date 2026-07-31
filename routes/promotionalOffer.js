const express = require('express');
const router = express.Router();

const { 
    create, 
    getPromotionalOfferById, 
    read, 
    remove, 
    update, 
    getAllOffers, 
    getActiveOffers, 
    getOfferByProduct, 
    applyOfferToProduct, 
    removeOfferFromProduct, 
    getProductsByOffer,
    incrementOfferUsage,
    getOfferStatistics
} = require("../controllers/promotionalOffer");

const { requiredSignin, isAuth, isAdmin, isStoreManager } = require('../controllers/auth');
const { getUserById } = require("../controllers/user");
const { getProductById } = require("../controllers/product");

router.get("/promotional-offer/:offerId", read);
router.post("/promotional-offer/create/:userId", requiredSignin, isAuth, isStoreManager, create);
router.put("/promotional-offer/:offerId/:userId", requiredSignin, isAuth, isStoreManager, update);
router.delete("/promotional-offer/:offerId/:userId", requiredSignin, isAuth, isAdmin, remove);
router.get("/promotional-offers", getAllOffers);
router.get("/promotional-offers/active", getActiveOffers);

router.get("/promotional-offer/product/:productId/offers", getOfferByProduct);
router.get("/promotional-offer/:offerId/products", getProductsByOffer);
router.put("/product/:productId/apply-offer/:userId", requiredSignin, isAuth, isStoreManager, applyOfferToProduct);
router.put("/product/:productId/remove-offer/:userId", requiredSignin, isAuth, isStoreManager, removeOfferFromProduct);

router.put("/promotional-offer/:offerId/increment-usage", incrementOfferUsage);
router.get("/promotional-offer/:offerId/statistics", getOfferStatistics);

router.param("userId", getUserById);
router.param("productId", getProductById);
router.param("offerId", getPromotionalOfferById);

module.exports = router;