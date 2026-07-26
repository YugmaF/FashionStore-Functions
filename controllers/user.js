const User = require('../models/users');
const generator = require('generate-password');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const {createAuditLog} = require('./userAudit');

exports.getUserById = (req, res, next, id) => {
    User.findById(id).populate('product').exec((err, user) => {
        if (err || !user) {
            res.status(400).json({
                error: 'User not found!'
            });
        }

        req.profile = user;
        next();
    });
};

exports.getAdminByAdminId = (req, res, next, id) => {
    User.findById(id).populate('product').exec((err, user) => {
        if (err || !user) {
            res.status(400).json({
                error: 'User not found!'
            });
        }

        req.adminProfile = user;
        next();
    });
};

//method to remove cart products
exports.removeItemById = (req, res) => {
    User.updateOne(
        {_id: req.profile._id},
        {$pull: {product: req.body._id}}, //remove item by product id
        {safe: true, multi: true}, //safe callbacks errors, update multiple docs

        function (err) {
            //if error send error or success
            if (err) return res.send(500, {error: err});
            // Log cart item removal
            createAuditLog(req.profile._id, req.profile.email, 'CART_REMOVE', req, {productId: req.body._id});
            return res.send(200, {success: 'Successfully Removed.'});
        })
};

exports.removeWishListItem = (req, res) => {
    User.updateOne(
        {_id: req.profile._id},
        {$pull: {wishlist: req.body._id}},
        {safe: true, multi: true},

        function (err) {
            if (err) return res.send(500, {error: err});
            // Log wishlist item removal
            createAuditLog(req.profile._id, req.profile.email, 'WISHLIST_REMOVE', req, {productId: req.body._id});
            return res.send(200, {success: 'Successfully Removed.'});
        })
};

//function read user details
exports.read = (req, res) => {
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;

    return res.json(req.profile);   //get entire profile
};

//function to read address of the user
exports.address = (req, res) => {
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;

    //get only needed info
    return res.json({
        address1: req.profile.address1,
        address2: req.profile.address2,
        town: req.profile.town,
        postal_code: req.profile.postal_code,
        mobile: req.profile.mobile
    });
};

//method to reset password
exports.resetPassword = (req, res) => {
    console.log("reset password function");
    const user = req.profile;
    const randomPassword = generator.generate({
        length: 10,
        numbers: true
    });
    user.password = randomPassword;
    console.log(randomPassword);

    user.save((err, data) => {
        if(err){
            return res.status(400).json({
                error:errorHandler(err)
            });
        }
        // Log admin password reset
        createAuditLog(user._id, user.email, 'PASSWORD_CHANGE', req, {
            resetBy: req.auth ? req.auth._id : 'admin',
            resetType: 'admin-initiated'
        });
        res.json(data);
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user:process.env.EMAIL,
                pass:process.env.PASSWORD
            }
        });

        transporter.use('compile', hbs({
            viewEngine: {
                extName: '.handlebars',
                partialsDir: './email_views/',
                layoutsDir: './email_views/',
                defaultLayout: '',
            },
            viewPath: './email_views/',
            extName: '.handlebars',
        }));

        let emailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            cc: process.env.EMAIL,
            subject: 'Password Reset',
            template: 'reset_password_email_view',
            context: {
                password: randomPassword
            }
        };

        transporter.sendMail(emailOptions, function (err, success) {
            if(err){
                console.log(err);
            }else{
                console.log("Email sent successfully");
            }
        });
    });
};

//method to update users using requests
exports.update = (req, res) => {
    let updateSet = {$set: {}, $addToSet: {}};  //add to set used to not to replace existing cart items
    let auditMetadata = {updatedFields: []};

    if (req.body.name != null) {
        updateSet.$set.name = req.body.name //update name
        auditMetadata.updatedFields.push('name');
    }
    if (req.body.password != null) {
        updateSet.$set.password = req.body.password //update password
        auditMetadata.updatedFields.push('password');
    }
    if (req.body.email != null) {
        updateSet.$set.email = req.body.email   //update email
        auditMetadata.updatedFields.push('email');
    }
    if (req.body.address1 != null) {
        //update address details
        updateSet.$set.address1 = req.body.address1;
        updateSet.$set.address2 = req.body.address2;
        updateSet.$set.town = req.body.town;
        updateSet.$set.postal_code = req.body.postal_code;
        updateSet.$set.mobile = req.body.mobile;
        auditMetadata.updatedFields.push('address');
    }
    //adding products to the shopping cart
    if (req.body.product != null) {
        updateSet.$addToSet.product = req.body.product  //update cart products
        auditMetadata.cartAction = 'add';
        auditMetadata.productId = req.body.product;
    }

    //update user doc using user id
    User.findOneAndUpdate({_id: req.profile._id}, updateSet, {new: true}, (err, user) => {
        if (err) {
            return res.status(400).json({
                error: 'Unauthorized Action!'
            })
        }

        // Log profile update
        if (auditMetadata.updatedFields.length > 0) {
            createAuditLog(user._id, user.email, 'PROFILE_UPDATE', req, auditMetadata);
        }
        // Log cart addition separately
        if (req.body.product != null) {
            createAuditLog(user._id, user.email, 'CART_ADD', req, {productId: req.body.product});
        }

        user.hashed_password = undefined;
        user.salt = undefined;

        res.json(user);
    });
};

exports.updateWishList = (req, res) => {
    let updateSet = {$addToSet: {}};  //add to set used to not to replace existing wishlist items

    if (req.body.product != null) {
        updateSet.$addToSet.wishlist = req.body.product
    }

    User.findOneAndUpdate({_id: req.profile._id}, updateSet, {new: true}, (err, user) => {
        if (err) {
            return res.status(400).json({
                error: 'Unauthorized Action!'
            })
        }

        // Log wishlist addition
        if (req.body.product != null) {
            createAuditLog(user._id, user.email, 'WISHLIST_ADD', req, {productId: req.body.product});
        }

        user.hashed_password = undefined;
        user.salt = undefined;

        res.json(user);
    });
};

exports.getAllUsers = (req, res) => {
    let orderBy = req.query.orderBy ? req.query.orderBy:'ASC';
    let sortBy = req.query.sortBy ? req.query.sortBy:'_id';

    User.find()
        .sort([[sortBy, orderBy]])
        .exec((err, data) => {
            if(err){
                res.status(400).json({
                    error: 'Users not found!'
                });
            }

            res.json(data);
        });
};

exports.addOrderToUserHistory = (req, res, next) => {
    let history = []

    req.body.order.products.forEach((item) => {
        history.push({
            _id: item._id,
            name: item.name,
            description: item.description,
            category: item.category,
            quantity: item.count,
            transaction_id: req.body.order.transaction_id,
            amount: req.body.order.amount
        })
    })

    User.findOneAndUpdate(
        {_id: req.profile._id},
        {$push: {history: history}},
        {new: true},
        (error, data) => {
            if(error){
                return res.status(400).json({
                    error: 'Unable to update user purchase history'
                })
            }
            // Log order placement
            createAuditLog(req.profile._id, req.profile.email, 'ORDER_PLACED', req, {
                transactionId: req.body.order.transaction_id,
                amount: req.body.order.amount,
                productCount: req.body.order.products.length
            });
            next();
        }
    );

}