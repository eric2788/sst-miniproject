const MongoClient = require('mongodb').MongoClient
const link = require('../../assets/secret/mongo.json').mongodb_url
const app = new MongoClient(link)

async function connect({collection, run}){
    const con = await app.connect()
    const db = await con.db('test')
    const coll = await db.collection(collection)
    const result = await run(coll)
    return result
}

module.exports = {
    connect
}