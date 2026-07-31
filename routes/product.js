const express = require('express');
const router = express.Router();
const {userSignupValidator} = require('../validators');

//controller references
const { create, getProductById, read, remove, update, addRating, addComment
    , getAllProducts, getSimilarProduct, getProductCategories, getProductListBySearch, getImage, getProductsByCategory, searchProduct, getPromotionalProducts, getFlashSaleProducts, validatePromotionalOffer } = require("../controllers/product");
const { requiredSignin, isAuth, isAdmin, isStoreManager } = require('../controllers/auth');
const { getUserById } = require("../controllers/user");
//controller references
const { getCategoryById } = require("../controllers/category");

//routes
router.get("/product/:productId", read); // Read Product - get request
router.get("/product/category/:categoryId", getProductsByCategory); // Read Product by category
router.post("/product/create/:userId", requiredSignin, isAuth, isStoreManager, create); // Create Product - post request
router.delete('/product/:productId/:userId', requiredSignin, isAuth, isAdmin, remove); // Delete Product - delete request
router.put('/product/:productId/:userId', requiredSignin, isAuth, isStoreManager, update); // Update Product - put request
router.put('/product/addRating/:productId/:userId', requiredSignin, isAuth, addRating); // add Rating to a product - put request
router.put('/product/addComment/:productId/:userId', requiredSignin, isAuth, addComment); // add Rating to a product - put request

//search routes
router.get('/products', getAllProducts);
router.get('/products/search', searchProduct);
router.get('/products/similar/:productId', getSimilarProduct);
router.get('/products/categories', getProductCategories);
router.post("/products/by/search", getProductListBySearch);
router.get('/product/image/:productId', getImage);

//promotional offer routes
router.get('/products/promotional', getPromotionalProducts);
router.get('/products/flash-sale', getFlashSaleProducts);
router.get('/product/:productId/validate-promotion', validatePromotionalOffer);


//read by
router.param("userId", getUserById);
router.param("productId", getProductById);
router.param("categoryId", getCategoryById);



module.exports = router;
