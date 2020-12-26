const express = require('express')
const router = express.Router()
const rests = require('../models/restaurants')
const { asyncHandle, readFile } = require('../utils')


router.post('/:restaurant', asyncHandle({
    keys: ['name'],
    run: async (req, res) => {
        const id = req.params.restaurant
        if (req.files.photo.size > 0){
            const type = req.files.photo.type
            const base64 = await readFile(req.files.photo.path)
            req.fields.photo = base64
            req.fields.photo_mimetype = type
        }
        await rests.updateRestaurant(req.session.username, id, {
            ...req.fields,
            address: {
                street: req.fields.street,
                building: req.fields.building,
                zipcode: req.fields.zipcode,
                coord: [req.fields.coord_x, req.fields.coord_y]
            }
        })
        return res.redirect(`/rest/${id}?success=updated`)
    }
}))

router.post('/', asyncHandle({
    keys: ['name'],
    run: async (req, res) => {
        req.fields.owner = req.session.username
        if (req.files.photo.size > 0){
            const type = req.files.photo.type
            const base64 = await readFile(req.files.photo.path)
            req.fields.photo = base64
            req.fields.photo_mimetype = type
        }
        const re = await rests.createRestaurant({
            ...req.fields,
            address: {
                street: req.fields.street,
                building: req.fields.building,
                zipcode: req.fields.zipcode,
                coord: [req.fields.coord_x, req.fields.coord_y]
            }
        })
        return res.redirect(`/rest/${re.insertedId}?success=created`)
    }
}))

router.get('/delete/:restaurant', asyncHandle({
    run: async (req, res) => {
        const id = req.params.restaurant
        await rests.deleteRestaurant(req.session.username, id)
        return res.redirect('/')
    }
}))

router.post('/rate/:restaurant', asyncHandle({
    keys: ['score'],
    run: async (req, res) => {
        const id = req.params.restaurant
        const score = req.fields.score
        const user = req.session.username
        await rests.rateRestaurant(id, score, user)
        return res.redirect(`/rest/${id}?success=rated`)
    }
}))


// TEST CASE NEEDED
router.get('/name/:restaurant', asyncHandle({
    run: async (req, res) => {
        const name = req.params.restaurant
        try {
            const result = await rests.readRestaurantQuery({"name": name})
            res.status(200)
            res.json(result)
        }catch(err){
            if (err.code === 404){
                res.json([])
            }else{
                throw err
            }
        }
    }
}))

// TEST CASE NEEDED
router.get('/borough/:borough', asyncHandle({
    run: async (req, res) => {
        const borough = req.params.borough
        try {
            const result = await rests.readRestaurantQuery({"borough": borough})
            res.status(200)
            res.json(result)
        }catch(err){
            if (err.code === 404){
                res.json([])
            }else{
                throw err
            }
        }
    }
}))

// TEST CASE NEEDED
router.get('/cuisine/:cuisine', asyncHandle({
    run: async (req, res) => {
        const cuisine = req.params.cuisine
        try {
            const result = await rests.readRestaurantQuery({"cuisine": cuisine})
            res.status(200)
            res.json(result)
        }catch(err){
            if (err.code === 404){
                res.json([])
            }else{
                throw err
            }
        }
    }
}))


module.exports = router