const ObjectId = require('mongodb').ObjectId
const db = require('./database')
const utils = require('../utils')

const collection = 'project_restaurants'

async function readRestaurant(id){
    return await db.connect({
        collection,
        run: async (rests) => {
            utils.validateId(id)
            console.log(`reading rest id: ${id}`)
            const content = await rests.findOne({ "_id": new ObjectId(id) })
            if (content == null){
                throw utils.throwError('Not Found', 404)
            }else{
                return content
            }
        }
    })
   
}

async function readRestaurantQuery(condition){
    return await db.connect({
        collection,
        run: async (rests) => {
            const content = await rests.findOne(condition)
            if (content == null){
                throw utils.throwError('Not Found', 404)
            }else{
                return content
            }
        }
    })
}

async function deleteRestaurant(owner, id){
    return await db.connect({
        collection,
        run: async (rests) => {
            console.log(`deleting id: ${id}`)
            utils.validateId(id)
            const ownerInfo = await rests.findOne({ "_id": new ObjectId(id) }, { projection: {"owner": 1} })
            if (ownerInfo == null) throw utils.throwError('Not Found', 404)
            if (owner !== ownerInfo.owner) throw utils.throwError('you are not owner', 403)
            const res = await rests.deleteOne({ "_id": new ObjectId(id) })
            return res
        }
    })
}

async function rateRestaurant(id, score, owner){ 
    return await db.connect({
        collection,
        run: async (rests) => {
            utils.validateId(id)
            if (score <= 0 || score > 10 ) throw utils.throwError('score must be 1 ~ 10')
            const re = await rests.findOne({
                "_id": new ObjectId(id),
                "grades": {
                    $elemMatch: {
                        "user": owner
                    }
                }
            }, {
                "grades": 1,
                "_id": 0
            })
            console.log(re)
            if (re !== null){
                throw utils.throwError('you already voted')
            }
            const res = await rests.updateOne({ "_id": new ObjectId(id) }, { 
                $push: {
                    grades: {
                        $each: [ { user: owner, score } ]
                    }
                }
            })
            return res
        }
    })
}

async function updateRestaurant(owner, id, 
    {
        name,
        borough = '',
        cuisine = '',
        photo = undefined,
        photo_mimetype = '',
        address: {
            street = '',
            building = '',
            zipcode = '',
            coord = []
        }
    }
    ){
    return await db.connect({
        collection,
        run: async (rests) => {
            utils.validateId(id)
            const ownerInfo = await rests.findOne({ "_id": new ObjectId(id) }, { projection: {"owner": 1} })
            if (owner !== ownerInfo.owner) throw utils.throwError('you are not owner', 403)
            const toUpdate = {
                name,
                borough,
                cuisine,
                address: {
                    street,
                    building,
                    zipcode,
                    coord: coord[0] && coord[1] ? coord : []
                }
            }
            if (photo){
                toUpdate.photo = photo
                toUpdate.photo_mimetype = photo_mimetype
            }
            const update = await rests.updateOne({ "_id": new ObjectId(id) }, {
                $set: toUpdate
            })
            return update
        }
    })
}

async function listRestaurant(page = 1){
    return await db.connect({
        collection,
        run: async (rests) => {
            const cusor = await rests.find({}, {
                projection:  {
                    "_id": 1,
                    "name": 1
                }
            })
            const total = await cusor.count()
            const content = await cusor.skip(10 * Math.max(0, page - 1)).limit(10)
            const list = []
            while(await content.hasNext()){
                list.push(await content.next())
            }
            return {total, list}
        }
    })
}

async function createRestaurant({
    name,
    borough = '',
    cuisine = '',
    photo = '',
    photo_mimetype = '',
    address: {
        street = '',
        building = '',
        zipcode = '',
        coord = []
    } = {},
    owner
}){
    return await db.connect({
        collection,
        run: async (rests) => {
            if (!name) throw utils.throwError('name is required field')
            if (!owner) throw utils.throwError('owner is required field')
            const re = await rests.insertOne({
                name, borough, cuisine, photo, photo_mimetype, address: {
                    street, building, zipcode, coord: coord[0] && coord[1] ? coord : []
                },
                grades: [],
                owner
            })
            return re
        }
    })
}


module.exports = {
    createRestaurant, 
    listRestaurant, 
    readRestaurant, 
    readRestaurantQuery,
    updateRestaurant,
    deleteRestaurant,
    rateRestaurant
}
