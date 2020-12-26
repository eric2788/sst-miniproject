const express = require('express')
const router = express.Router()
const account = require('../models/account')
const { asyncHandle } = require('../utils')

router.post('/login', asyncHandle({
    keys: ['username', 'password'],
    run: async (req, res) => {
        const response = await account.login(req.fields.username, req.fields.password || '')
        res.status(200)
        req.session.username = response.username
        res.redirect('/')
    }
}))


router.post('/register', asyncHandle({
    keys: ['username', 'password'],
    run: async (req, res) => {
        const re = await account.register(req.fields.username, req.fields.password || '')
        req.session.username = re
        res.redirect('/')
    }
}))

router.get('/logout', asyncHandle({
    run: async (req, res) => {
        res.status(200)
        req.session = null
        res.redirect('/login')
    }
}))

module.exports = router