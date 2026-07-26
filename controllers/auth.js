const User = require("../models/users");
const jwt = require('jsonwebtoken');//token generation
const request = require('request');
const expressJwt = require('express-jwt');//auth check
const {errorHandler} = require('../helpers/dbErrorHandler');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const Handlebars = require('handlebars');
const lodash = require('lodash');
const {createAuditLog} = require('./userAudit');

exports.signup = (req, res) => {
    const user = new User(req.body);
    user.save((err, user) => {
        if (err) {
            createAuditLog(null, req.body.email, 'SIGNUP', req, {error: errorHandler(err)}, 'FAILURE', errorHandler(err));
            return res.status(400).json({error: errorHandler(err)});
        }
        user.salt = undefined;
        user.hash_password = undefined;

        // Log successful signup
        createAuditLog(user._id, user.email, 'SIGNUP', req, {role: user.role});

        res.json({
            user
        });

        if (typeof req.body.role !== 'undefined' && req.body.role === 2) {
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL,
                    pass: process.env.PASSWORD
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
                to: req.body.email,
                cc: process.env.EMAIL,
                subject: 'New account details',
                template: 'email_view',
                context: {
                    username: req.body.email,
                    password: req.body.password,
                    name: req.body.name
                }
            };

            transporter.sendMail(emailOptions, function (err, success) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Email sent successfully");
                }
            });
        }
    });
};

exports.signin = (req, res) => {
    //find the user based on email
    const {email, password} = req.body;
    User.findOne({email}, (err, user) => {
        if (err || !user) {
            createAuditLog(null, email, 'LOGIN_FAILED', req, {reason: 'User does not exist'}, 'FAILURE', 'User does not exist');
            return res.status(400).json({error: 'User does not exist!'});
        }
        //authenticate the user
        if (!user.auth(password)) {
            createAuditLog(user._id, user.email, 'LOGIN_FAILED', req, {reason: 'Incorrect password'}, 'FAILURE', 'Incorrect credentials');
            return res.status(401).json({
                error: 'Incorrect credentials!'
            });
        }
        //authenticate the user
        if (user.state === '0') {
            createAuditLog(user._id, user.email, 'LOGIN_FAILED', req, {reason: 'Inactive user'}, 'FAILURE', 'Inactive User. Access denied');
            return res.status(401).json({
                error: "Inactive User. Access denied!"
            });
        }

        //if authenticated generate a token with uid and secret
        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET);
        //add to cookie with expiry date
        res.cookie('t', token, {expire: new Date() + 9999});

        // Log successful login
        createAuditLog(user._id, user.email, 'LOGIN', req, {role: user.role});

        //return user and token to the front-end client
        const {_id, name, email, role} = user;
        return res.json({token, user: {_id, name, email, role}});
    })
};

exports.signout = (req, res) => {
    // Log logout if user is authenticated
    if (req.auth && req.auth._id) {
        User.findById(req.auth._id, (err, user) => {
            if (!err && user) {
                createAuditLog(user._id, user.email, 'LOGOUT', req);
            }
        });
    }
    res.clearCookie('t');
    res.status(200).json({message: 'Signout success!'})
};

//signin check middleware
exports.requiredSignin = expressJwt({secret: process.env.JWT_SECRET, userProperty: "auth"});

//authentication middleware
exports.isAuth = (req, res, next) => {
    console.log(req);
    let user = req.profile && req.auth && req.profile._id == req.auth._id;
    if (!user) {
        return res.status(403).json({
            error: "Access denied"
        });
    }

    next();
};

//authentication middleware
exports.isAuthCheckForAdminOperations = (req, res, next) => {
    let user = req.adminProfile && req.auth && req.adminProfile._id == req.auth._id;
    if (!user) {
        return res.status(403).json({
            error: "Access denied"
        });
    }

    next();
};

//admin routes authentication middleware
exports.isAdmin = (req, res, next) => {
    if (req.profile.role === "0" || req.profile.role === "2") {
        return res.status(403).json({
            error: "Not a admin. Access denied!"
        });
    }

    next();
};

//admin routes authentication middleware
exports.isAdminCheckForResetPassword = (req, res, next) => {
    if (req.adminProfile.role === "0" || req.adminProfile.role === "2") {
        return res.status(403).json({
            error: "Not a admin. Access denied!"
        });
    }

    next();
};

//store manager routes authentication middleware
exports.isStoreManager = (req, res, next) => {
    if (req.profile.role === "0") {
        return res.status(403).json({
            error: "Not a admin. Access denied!"
        });
    }

    if (req.profile.role === "1" || req.profile.role === "2") {
        next();
    }
};

exports.changeState = (req, res) => {
    User.findOneAndUpdate({_id: req.body._id}, {state: req.body.state}, {new: true}, (err, user) => {
        if (err) {
            return res.status(400).json({
                error: 'Unauthorized Action!'
            })
        }

        // Log state change
        createAuditLog(user._id, user.email, 'STATE_CHANGE', req, {
            newState: req.body.state,
            changedBy: req.auth ? req.auth._id : 'system'
        });

        user.hashed_password = undefined;
        user.salt = undefined;

        res.json(user);
    });
};

exports.newsletterSignUp = (req, res) => {
    const email = req.body.email;
    console.log(email);
    if (!email) {
        return res.status(401).json({
            error: "Email required"
        });
    }

    const data = {
        members: [{
            email_address: email,
            status: '3',
        }]
    };

    const postData = JSON.stringify(data);

    const options = {
        url: 'https://us18.api.mailchimp.com/3.0/lists/21eefe5bcb',
        method: 'POST',
        headers: {
            Authorization: 'auth 70cf7b8e9292591bcbc47201fb4a387b-us18'
        },
        body: postData
    };

    request(options, (err, response, body) => {
        if (err) {
            return res.status(401).json({
                error: "Error in network connection!"
            });
        } else {
            if (response.statusCode = 200) {
                res.json(body);
            } else {
                return res.status(401).json({
                    error: "Error in network connection!"
                });
            }
        }
    });
}

exports.forgotPassword = (req, res) => {

    const {email} = req.body;

    User.findOne({email}, (err, user) => {
        if (err || !user) {
            createAuditLog(null, email, 'PASSWORD_RESET_REQUEST', req, {reason: 'User not found'}, 'FAILURE', 'User with this email does not exist');
            return res.status(400).json({error: "User with this email does not exists!"});
        }

        const token = jwt.sign({_id: user._id}, process.env.JWT_FORGOT_PASSWORD_SECRET);
        //add to cookie with expiry date
        res.cookie('t', token, {expire: new Date() + 9999});

        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
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
            from: 'noreply@quarantinefashionstore.com',
            to: email,
            cc: process.env.EMAIL,
            subject: 'Account activation link',
            template: 'forgot_password_email_view',
            context: {
                link: `${process.env.CLIENT_URL}/reset/password/${token}`,
            }
        };


        return user.updateOne({resetLink: token}, (err, success) => {
            if (err) {
                return res.status(400).json({error: "Reset password link error!"});
            }else{
                transporter.sendMail(emailOptions, function (err, success) {
                    if (err) {
                        console.log(err);
                        return res.json({error: "Email not found!"});
                    } else {
                        console.log("Email sent successfully");
                        // Log successful password reset request
                        createAuditLog(user._id, user.email, 'PASSWORD_RESET_REQUEST', req);
                        return res.json({message: 'Email is sent to the email address!'});
                    }
                });
            }
        });

    });
};

exports.resetPasswordByLink = (req, res) => {
  const {resetLink, newPassword} = req.body;
  if(resetLink){
        jwt.verify(resetLink, process.env.JWT_FORGOT_PASSWORD_SECRET, (error, data) => {
            if(error){
                return res.status(400).json({error : "Incorrect or expired!"});
            }
           User.findOne({resetLink}, (err,user) => {
               if(err || !user){
                   return res.status(400).json({error : "Cannot find the user with this token!"});
               }
              const obj = {
                password : newPassword
              };

               user = lodash.extend(user, obj);
               user.save((err, result) => {
                   if (err){
                       createAuditLog(user._id, user.email, 'PASSWORD_RESET_COMPLETE', req, {}, 'FAILURE', 'Reset password error');
                       return res.status(400).json({error : "reset password error"})
                   }else{
                       // Log successful password reset completion
                       createAuditLog(user._id, user.email, 'PASSWORD_RESET_COMPLETE', req);
                       return res.status(200).json({message: "Your password is changed!"})
                   }
               })

           });
        });
  }else{
      return res.status(401).json({error : "Unauthorized!"});
  }
};