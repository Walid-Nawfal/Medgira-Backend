var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
var User = require('../models/user');
var passport = require('passport');
var authenticate = require('../authenticate');
const { verify } = require('jsonwebtoken');

router.use(bodyParser.json());


router.get('/', authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
  User.find({}, (err, users) => {
    if (err) {
      return next(err);
    } else {
      res.statusCode = 200;
      res.setHeader('Content_type', 'application/json');
      res.json(users);
    }
  })
});

router.post('/signup', (req, res, next) => {
  // console.log(req.body);
  User.register(new User({username: req.body.username, email: req.body.email}),
    req.body.password, (err, user) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({
          err: err
        });
      } else {
        if (req.body.firstname) {
          user.firstname = req.body.firstname;
        }
        if (req.body.lastname) {
          user.lastname = req.body.lastname;
        }
        user.save((err, user) => {
          passport.authenticate('local')(req, res, () => {
            if (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.json({
                err: err
              });
              return;
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({
              success: true,
              status: 'Registration Successful!'
            });
          });
        });
      }
    });
});

router.post('/login', passport.authenticate('local'), (req, res) => {
  var token = authenticate.getToken({
    _id: req.user._id,
    firstname: req.user.firstname,
    lastname: req.user.lastname
  });
  
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  if(req.user.admin){
    res.json({
      success: true,
      status: 'You are successfully logged in!',
      token: token,
      admin: true
    });
  }
  else{
    res.json({
      success: true,
      status: 'You are successfully logged in!',
      token: token,
      admin: false
    });
  }
});


router.get('/logout', (req, res, next) => {
  res.redirect('/');
  if (req.session) {
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
});

module.exports = router;
