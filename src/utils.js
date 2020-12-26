const crypto = require('crypto')
const fs = require('fs')

const hasKey = (obj, keys = []) => {
    if (obj === null || !obj) return false
    const payload = Object.keys(obj)
    if (payload.length < keys.length) return false
    return keys.every(e => payload.includes(e))
}

function throwError(message, code = 400, redirect = '/error'){
    return {
        message, 
        code,
        redirect,
        custom: true
    }
}

module.exports = {
    hash256: (password) => {
        const h = crypto.createHash('md5')
        h.update(password)
        return h.digest('hex')
    },
    asyncHandle: ({
        keys = [], 
        run
    }) => {
        return async function(req, res, next){
            try {
                if (keys.length > 0 && !hasKey(req.fields, keys)){
                    res.status(400)
                    throw throwError(`required properties: ${keys}`)
                }else{
                    await run(req, res)
                }
            }catch(err){
                console.warn(`ERROR: ${err.message}`)
                next(err)
            }
        }
    },
    throwError,
    readFile: (path) => {
        return new Promise((res, rej) => {
            fs.readFile(path, {
               encoding: 'base64' 
            }, (err, base) => {
                if (err){
                    rej(err)
                    return
                }
                res(base)
            })
        })
    },
    validateId: (id) => {
        if (/[0-9A-Fa-f]{6}/g.test(id)) return
        throw throwError('id is not valid')
    }
}