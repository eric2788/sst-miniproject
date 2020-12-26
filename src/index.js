const express = require('express')
const session = require('cookie-session')
const formiddable = require('express-formidable')
const process = require('process')
const url = require('url')
const { MongoError } = require('mongodb')
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
})
const app = express()
const rests = require('./models/restaurants')
const utils = require('./utils')

const user = require('./routes/user')
const restaurant = require('./routes/restaurant')

app.set('trust proxy', 1)

app.set('views', './assets/views');
app.set('view engine', 'ejs');

app.use(session({
    name: 'session',
    maxAge: 3600 * 1000, // 1 hour
    keys: ['eric_lam', 'miniproject']
}))




app.use(formiddable())

const whiteList = [ '/login', '/register', '/api/restaurant', '/error']

app.use((req, res, next) => {
    if (req.method !== 'GET'){
        return next()
    }
    if (req.session.username && (req.path === '/login' || req.path === '/register')){
        return res.redirect('/')
    }
    if (whiteList.some(s => req.path.startsWith(s)) || req.session.username){
        return next()
    }
    console.log('user not login')
    res.status(401)
    return res.redirect('/login')
})

app.use((req, res, next) => {
    if (req.method === 'GET') {
        return next()
    }
    console.log(`session: ${JSON.stringify(req.session)}`)
    if (!req.path.startsWith('/api/user') && !req.session.username){
        console.log('request not login')
        res.status(401)
        return res.redirect('/login')
    }
    next()
})

// index 
app.get('/', utils.asyncHandle({
    run: async (req, res) => {
        const page = parseInt(req.query.page) || 1
        const restaurants = await rests.listRestaurant(page)
        const maxPage = Math.ceil(restaurants.total / 10)
        console.log(req.session.username)
        res.render('index', {
            title: 'index',
            restaurants,
            page: Math.min(page, maxPage),
            username: req.session.username,
            maxPage
        })
    }
}))


// user

app.get('/login', (req, res) => {
    res.render('login', {
        code: req.query.code || '',
        error_message: req.query.message || '',
        register: false
    })
})
app.get('/register', (req, res) => {
    res.render('login', {
        code: req.query.code || '',
        error_message: req.query.message || '',
        register: true
    })
})

// view

app.get('/rest/:restaurant', utils.asyncHandle({
    run: async (req, res) => {
        const rest = await rests.readRestaurant(req.params.restaurant)
        const owner = rest.owner === req.session.username
        const success = req.query.success
        const editable = false
        const mode = 'update'
        res.render('rest', {
            rest,
            owner,
            editable,
            success,
            mode
        })
    }
}))

app.get('/gmap', (req, res) => {
    res.render('gmap', {
        title: 'UNKNOWN',
        lat: 0,
        lon: 0,
        ...req.query
    })
})

// create

app.get('/rest', utils.asyncHandle({
    run: async (req, res) => {
        const owner = true
        const editable = true
        const success = req.query.success
        const mode = 'create'
        res.render('rest', {
            rest: {
                name: '',
                borough: '',
                cuisine: '',
                photo: '',
                photo_mimetype: '',
                address: {
                    street: '',
                    building:  '',
                    zipcode: '',
                    coord: []
                },
                grades: []
            },
            owner,
            editable,
            success,
            mode
        })
    }
}))

// modify

app.get('/modify/:restaurant', utils.asyncHandle({
    run: async (req, res) => {
        const id = req.params.restaurant
        const rest = await rests.readRestaurant(id)
        const owner = rest.owner === req.session.username
        const success = req.query.success
        const editable = true
        const mode = 'update'
        if (!owner) {
            throw utils.throwError('you are not owner', 401)
        }
        res.render('rest', {
            rest,
            owner,
            editable,
            success,
            mode
        })
    }
}))

app.get('/rate/:restaurant', utils.asyncHandle({
    run: async (req, res) => {
        const rest = await rests.readRestaurant(req.params.restaurant)
        res.render('rate', {
            rest: {
                name: rest.name,
                _id: rest._id
            }
        })
    }
}))

// error

app.get('/error', (req, res) => {
    res.render('error', req.query)
})

// api

app.use('/api/user', user)
app.use('/api/restaurant', restaurant)

app.get('*', (req, res) => res.redirect('/'))

// error handle

app.use((err, req, res, next) => {
    if (!err) {
        return next()
    }
    if (err.custom){ // custom error
        res.status(err.code)
        return res.redirect(url.format({
            pathname: err.redirect,
            query: err
        }))
    }else{
        if (err instanceof MongoError){ // mongodb error
            res.status(400)
            return res.redirect(url.format({
                pathname: err.redirect || req.path,
                query: {
                    message: err.message,
                    code: err.code 
                }
            }))
        }
    }
    // server error
    res.status(500).send('Internal Server Error')
    console.error(err)
    return next()
})


async function start(){
    return new Promise((res, ) => {
        app.listen(process.env.PORT || 8099)
        console.log('express server started')
        res()
    })
}

start().catch(console.error)


const prompt = function (){
    readline.question(``,(cmd) => {
        if (cmd === 'exit') {
            process.exit(0)
        }else{
            prompt()
        }
    })
}

prompt()