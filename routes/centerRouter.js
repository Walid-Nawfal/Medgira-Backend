const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate =  require('../authenticate')
var app = express()
var cors = require('cors');


app.use(cors());
app.use(bodyParser.json())

const Centers = require('../models/centers');

const centerRouter = express.Router();

centerRouter.use(bodyParser.json());

centerRouter.route('/')
.get((req,res,next) => {
    Centers.find({})
    .populate('comments.author')
    .then((centers) => {
        console.log(centers);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(centers);
    }, (err) => next(err))
    .catch((err) => next(err));
})

.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Centers.create(req.body)
    .then((center) => {
        console.log('Center Created ', center);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(center);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /centers');
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Centers.remove({})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

centerRouter.route('/:centerId')
.get((req,res,next) => {
    Centers.findById(req.params.centerId)
    .populate('comments.author')
    .then((center) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(center);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /centers/'+ req.params.centerId);
})
.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Centers.findByIdAndUpdate(req.params.centerId, {
        $set: req.body
    }, { new: true })
    .then((center) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(center);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Centers.findByIdAndRemove(req.params.centerId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

centerRouter.route('/:centerId/comments')
.get((req,res,next) => {
    Centers.findById(req.params.centerId)
    .populate('comments.author')
    .then((center) => {
        if (center != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(center.comments);
        }
        else {
            err = new Error('Center ' + req.params.centerId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})

.post(authenticate.verifyUser, (req, res, next) => {
    Centers.findById(req.params.centerId)
    .then((center) => {
        if (center != null) {
            req.body.author = req.user._id;
            console.log(center.comments);
            center.comments.push(req.body);
            console.log(center.comments);
            console.log(req.body);
            center.save()
            .then((center) => {
                Centers.findById(center._id)
                .populate('comments.author')
                .then((center) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(center);
                })
            }, (err) => next(err));
        }
        else {
            err = new Error('Center ' + req.params.centerId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})

.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /centers/'
        + req.params.centerId + '/comments');
})
.delete(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Centers.findById(req.params.centerId)
    .then((center) => {
        if (center != null) {
            for (var i = (center.comments.length -1); i >= 0; i--) {
                center.comments.id(center.comments[i]._id).remove();
            }
            center.save()
            .then((center) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(center);                
            }, (err) => next(err));
        }
        else {
            err = new Error('Center ' + req.params.centerId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});

centerRouter.route('/:centerId/comments/:commentId')
.get((req,res,next) => {
    Centers.findById(req.params.centerId)
    .populate('mongoose.path')
    .then((center) => {
        if (center != null && center.comments.id(req.params.commentId) != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(center.comments.id(req.params.commentId));
        }
        else if (center == null) {
            err = new Error('Center ' + req.params.centerId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /centers/'+ req.params.centerId
        + '/comments/' + req.params.commentId);
})
.put(authenticate.verifyUser, (req, res, next) => {
    Centers.findById(req.params.centerId)
        .then((center) => {
            if(!req.user._id.equals(center.comments.id(req.params.commentId).author)){
                err = new Error('You are not authorized to edit this comment!');
                err.status = 403;
                return next(err);
            }
            if (center != null && center.comments.id(req.params.commentId) != null) {
                if (req.body.rating) {
                     center.comments.id(req.params.commentId).rating = req.body.rating;
                 }
                if (req.body.comment) {
                    center.comments.id(req.params.commentId).comment = req.body.comment;                
                }
            center.save()
            .then((center) => {
                Centers.findById(center._id)
                .populate((center) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(center);      
                })         
            }, (err) => next(err));
        }
        else if (center == null) {
            err = new Error('Center ' + req.params.centerId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(authenticate.verifyUser, (req, res, next) => {
    Centers.findById(req.params.centerId)
    .then((center) => {
        if (center != null && center.comments.id(req.params.commentId) != null) {
            if(!req.user._id.equals(center.comments.id(req.params.commentId).author)){
                err = new Error('You are not authorized to Delete this comment!');
                err.status = 403;
                return next(err);
            }
            center.comments.id(req.params.commentId).remove();
            center.save()
            .then((center) => {
                Centers.findById(center._id)
                .populate((center) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(center);      
                })                 
            }, (err) => next(err));
        }
        else if (center == null) {
            err = new Error('Center ' + req.params.centerId + ' not found');
            err.status = 404;
            return next(err);
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = centerRouter;