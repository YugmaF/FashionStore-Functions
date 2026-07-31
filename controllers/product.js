const formidable = require('formidable');
const lodash = require('lodash');
const Product = require('../models/product');
const PromotionalOffer = require('../models/promotionalOffer');
const fs = require('fs');
const {errorHandler} = require('../helpers/dbErrorHandler');

//get product by Id
exports.getProductById = (req, res, next, id) => {
    Product.findById(id).populate('category').populate('comments.user').exec((err, product) => {
        if(err || !product){
            return res.status(400).json({
                error: "Product could not be found"
            });
        }

        req.product = product;
        next();
    });
};

//product image read
exports.read = (req, res) => {
    req.product.image = undefined;
    return res.json(req.product);
};

// Create Product
exports.create = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if(err){
            return res.status(400).json({
                error: "Image could not be uploaded"
            });
        }

        // Check for all the variables
        const {name, description, category, price, currency, quantity, takeInMethod, promotionalOfferId} = fields;

        // Validating the variables
        if(!name || !description || !category || !price || !currency || !quantity || !takeInMethod){
            return res.status(400).json({
                error: "Complete all fields!"
            });
        }

        let product = new Product(fields);

        // Image validation
        if(files.image){
            if(files.image.size > 5000000){
                return res.status(400).json({
                    error: "Image size is too large. Upload an image <5MB"
                });
            }
            product.image.data = fs.readFileSync(files.image.path);
            product.image.contentType = files.image.type;
        }

        product.save((err, success) => {
            if(err){
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }

            res.json(success);
        });
    });
};

// Delete Product
exports.remove = (req, res) => {
    let product = req.product;
    product.remove((err, dlt) => {
        if(err){
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json({ "message": 'Product deleted!' })
    });
};

// Update Product
exports.update = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if(err){
            return res.status(400).json({
                error: "Image could not be uploaded"
            });
        }

        // Accessing the existing product
        let product = req.product;

        // Replace existing Product info
        product = lodash.extend(product, fields);

        // Image validation
        if(files.image){

            if(files.image.size > 5000000){
                return res.status(400).json({
                    error: "Image size is too large. Upload an image <5MB"
                });
            }
            product.image.data = fs.readFileSync(files.image.path);
            product.image.contentType = files.image.type;
        }

        product.save((err, success) => {
            if(err){
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }

            res.json(success);
        });
    });
};

//add rating to product
exports.addRating = (req, res) => {
    let updateSet = {$push: {}};  //push used to push data to the array

    //adding rating to the product
    if (req.body.rating != null) {
        updateSet.$push.rating = req.body.rating;
    }

    console.log(req.product._id);

    Product.findOneAndUpdate({_id: req.product._id}, updateSet, {new: true}, (err, product) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            })
        }

        res.json(product);
    });
};

// add comment to product
exports.addComment = (req, res) => {
    let updateSet = {$push: {}};  //add to set used to not to replace existing rates

    //adding rating to the product
    if (req.body.comments != null) {
        const comments =  {
            "user" : req.body.comments.user,
            "comment" : req.body.comments.comment,
            "addedOn": new Date()
        };

        updateSet.$push.comments = comments;
    }


    Product.findOneAndUpdate({_id: req.product._id}, updateSet, {new: true}, (err, product) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            })
        }

        res.json(product);
    });
};

//get all products
exports.getAllProducts = (req, res) => {
  let orderBy = req.query.orderBy ? req.query.orderBy:'ASC';
  let sortBy = req.query.sortBy ? req.query.sortBy:'_id';
  let limitTo = req.query.limitTo ? parseInt(req.query.limitTo):10;

  Product.find()
      .select("-image")
      .populate('category')
      .sort([[sortBy, orderBy]])
      .limit(limitTo)
      .exec((err, data) => {
          if(err){
              res.status(400).json({
                 error: 'Products not found!'
              });
          }

          res.json(data);
      });
};

//get similar product
exports.getSimilarProduct = (req, res) => {
    let limitTo = req.query.limitTo ? parseInt(req.query.limitTo):10;

    Product.find({_id: {$ne:req.product}, category: req.product.category})
        .populate('category', '_id name')
        .limit(limitTo)
        .exec((err, data) => {
           if(err){
               res.status(400).json({
                  error: 'Similar products not found'
               });
           }

           res.json(data);
        });
};

//get products by category
exports.getProductsByCategory = (req, res) => {
    let limitTo = req.query.limitTo ? parseInt(req.query.limitTo):10;
    Product.find({category: req.category})
        .populate('category', '_id name')
        .limit(limitTo)
        .exec((err, data) => {
            if(err){
                res.status(400).json({
                    error: 'Products not found'
                });
            }

            res.json(data);
        });
};

//get category
exports.getProductCategories = (req, res) => {
  Product.distinct("category", {}, (err, data) => {
      if(err){
          res.status(400).json({
              error: 'Categories not found!'
          });
      }

      res.json(data);
  });
};

//get product list by searching
exports.getProductListBySearch = (req, res) => {
    let orderBy = req.body.orderBy ? req.body.orderBy : "asc";
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
    let limitTo = req.body.limitTo ? parseInt(req.body.limitTo) : 100;
    let skip = parseInt(req.body.skip);
    let findArgs = {};

    for (let key in req.body.filters) {
        if (req.body.filters[key].length > 0) {
            if (key === "price") {
                // gte -  greater than price [0-10]
                // lte - less than
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                };
            } else {
                findArgs[key] = req.body.filters[key];
            }
        }
    }

    Product.find(findArgs)
        .select("-image")
        .populate("category")
        .sort([[sortBy, orderBy]])
        .skip(skip)
        .limit(limitTo)
        .exec((err, data) => {
            if (err) {
                return res.status(400).json({
                    error: "Products not found"
                });
            }
            res.json({
                size: data.length,
                data
            });
        });
};

//get product image
exports.getImage = (req, res, next) => {

    if(req.product.image.data){
        res.set('Content-Type', req.product.image.contentType);
        return res.send(req.product.image.data);
    }

    next();

};

//decrease product quantity
exports.decreaseQuantity = (req, res, next) => {
    let bulkOps = req.body.order.products.map((item) => {
        return{
            updateOne:{
                filter: {_id: item._id},
                update: {$inc: {quantity: -item.count, sold: +item.count}}
            }
        };
    });

    Product.bulkWrite(bulkOps, {}, (error, products) => {
        if(error){
            return res.status(400).json({
                error: 'Unable to update product'
            });
        }

        next();

    });

};

exports.searchProduct = (req, res) => {
  //create query object to hold search value and category value
    const query = {};
    //assign search value to query.name
    if(req.query.search){

        query.name = {$regex: req.query.search === 'All' ? '' : req.query.search, $options: 'i'};

        if(req.query.category && req.query.category!== 'All'){
            query.category = req.query.category;
        }

        //find the product based on query object with 2 properties
        //search and category
        Product.find(query, (err, products) => {
            if(err){
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }

            res.json(products);
        }).select('-image');
    }
};