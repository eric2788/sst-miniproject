const utils = require('../utils')
const db = require('./database')

async function login(username, password){
    return await db.connect({
        collection: 'project_users',
        run: async (users) => {
            password = utils.hash256(password)
            const result = await users.findOne({
                $and: [
                    { username },
                    { password }
                ]
            }, {
                projection: {
                    "username": 1
                }
            })
            if (result == null){
                throw utils.throwError('unknown username or password', 401, '/login')
            }else{
                return result
            }
        }
    })
}

async function register(username, password){
    return await db.connect({
        collection: 'project_users',
        run: async (users) => {
            const find = await users.findOne({
                "username": username
            }, { "_id": 1})
            if (find !== null) throw utils.throwError('username already registered', 400, '/register')
            password = utils.hash256(password)
            await users.insertOne({
                username, password
            })
            return username
        }
    }) 
}

module.exports = {
    login,
    register
}
