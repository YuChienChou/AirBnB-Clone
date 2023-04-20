const express = require('express');
const { Sequelize, json } = require('sequelize');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');

const { setTokenCookie, restoreUser, requireAuth } = require('../../utils/auth');

const { Spot, SpotImage, Review, ReviewImage, User } = require('../../db/models');
const router = express.Router();


//Get all Reviews of the Current User
router.get('/current', requireAuth, async (req, res, next) => {

    const reviews = await Review.findAll({
        where: {
            userId: req.user.id,
        },
        include: [
            {model: User, attributes: ['id', 'firstname', 'lastName']},
            {model: Spot, attributes: ['id', 'ownerId', 'address', 'city', 'state', 'country', 'lat', 'lng', 'name', 'price']},
            {model: ReviewImage, attributes: ['id', 'url']}
        ]
    });

    // console.log(reviews);

    for (let i = 0; i < reviews.length; i++) {

        const review = reviews[i];
        const spot = review.Spot;

        // console.log(spot); //check it in the terminal!!!!

        let previewImage = await SpotImage.findOne({where: {spotId: spot.id
        }});

        if(previewImage) {
            previewImage = previewImage.url
        } else {
            previewImage = null
        };

        spot.dataValues.previewImage = previewImage; //check in the terminal fo rthe previewImage!!!

    }
    
    return res.status(200).json({
        Reviews: reviews
    });

});

//Add an Image to a Review based on the Review's id
router.post('/:reviewId/images', requireAuth, async(req, res, next) => {
    const { url } = req.body;


    const review = await Review.findByPk(req.params.reviewId);

    if(!review) {
        return res.status(404).json({message: "Review couldn't be found"});
    }

    if(review.userId !== req.user.id) {
        const err = new Error('Authentication required');
        err.status = 400;
        return next(err);
    };

    const allImages = await ReviewImage.findAll({
        where: {
            reviewId: review.id
        }
    });

    if(allImages.length >= 10) {
        return res.status(403).json({
            message: "Maximum number of images for this resource was reached"
        })
    } else {
        const newImage = await ReviewImage.create({
                reviewId: review.id,
                url
            });

        return res.status(200).json({
            id: newImage.id,
            url: newImage.url
        });
    }

    
})







module.exports = router;