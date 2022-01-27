const express = require('express') 
const bodyParser = require('body-parser')
const firebase = require('../firebase-config')
const router = express.Router() 

// middleware
router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())
router.use(bodyParser.raw())

router.post('/register' , (req,res) => {
    const firestore = firebase.firststore
    const auth = firebase.auth

    if(!req.body.email) return res.json({ code : 1 , status : "Don't have email in body"})
    if(!req.body.password) return res.json({ code : 2 , status : "Don't have password in body"})
    if(!req.body.firstname) return res.json({ code : 3 , status : "Don't have firstname in body"})
    if(!req.body.lastname) return res.json({ code : 4 , status : "Don't have lastname in body"})
    if(!req.body.restaurantName) return res.json({ code : 5 , status : "Don't have restaurantName in body"})
    if(!req.body.detail) return res.json({ code : 6 , status : "Don't have detail in body"})
    if(!req.body.phone) return res.json({ code : 7 , status : "Don't have phone in body"})
    if(!req.body.address) return res.json({ code : 8 , status : "Don't have address in body"})
    if(!req.body.type) return res.json({ code : 9 , status : "Don't have type in body"})

    auth.createUserWithEmailAndPassword(req.body.email , req.body.password)
    .then((result) => {
        const randomId = (Math.floor(Math.random() * 999999999) + 1000000000).toString()
        const token = (Math.floor(Math.random() * 999999999) + 1000000000).toString()
        const userRef = firestore.collection('user').doc(result.user.uid)
        const restaurantRef = firestore.collection('restaurant').doc(randomId)
        const userData = {
            id : result.user.uid,
            create : new Date().valueOf(),
            email : req.body.email,
            firstname : req.body.firstname,
            lastname : req.body.lastname,
            provider : 'email',
            blacklist : false,
            token : token,
            phone : req.body.phone,
            address : req.body.address,
            userImg : '',
            admin : {access : "restaurant" , id:randomId}
        }
        const restaurantData = {
            id : randomId,
            restaurantName : req.body.restaurantName,
            detail : req.body.detail,
            contract : {
                email : req.body.email,
                phone : req.body.phone,
                address : req.body.address
            },
            img : [],
            type : req.body.type,
            menu : [],
            menuImg : [],
            owner : result.user.uid,
            token : token,
            display : true
        }

        restaurantRef.set(restaurantData)
        .then( _ => {
            userRef.set(userData)
            .then( _ =>{
                res.status(200)
                res.json({
                    status : 'save to db'
                })
            })
            .catch( _ => {
                res.status(500)
                res.json({
                    status : 'something want wrong'
                })
            })
        })
        .catch( _ => {
            res.status(500)
            res.json({
                status : 'something want wrong'
            })
        })
    })
    .catch(error => {
        res.status(500)
        res.json({
            status : error.code
        })
    })
})

router.get('/find' , (req,res) => {
    if(!req.query.keyword) return res.json({ code : 1 , status : "Don't have keyword in body"})

    const firestore = firebase.firststore
    const keyword = req.query.keyword
    const restaurantRef = firestore.collection('restaurant').where('display','==',true)
    restaurantRef.get()
    .then(docs => {
        var temp = []
        docs.forEach(doc => {
            if(doc.data().id.toLowerCase().search(keyword.toLowerCase()) > -1 || 
               doc.data().type.toLowerCase().search(keyword.toLowerCase()) > -1 || 
               JSON.stringify(doc.data().contract).toLowerCase().search(keyword.toLowerCase()) > -1 || 
               doc.data().restaurantName.toLowerCase().search(keyword.toLowerCase()) > -1 || 
               doc.data().detail.toLowerCase().search(keyword.toLowerCase()) > -1 || 
               JSON.stringify(doc.data().menu).toLowerCase().search(keyword.toLowerCase()) > -1) {
                var restaurantData = {
                    "menuImg": doc.data().menuImg,
                    "id": doc.data().id,
                    "img": doc.data().img,
                    "type": doc.data().type,
                    "menu": doc.data().menu,
                    "contract": doc.data().contract,
                    "restaurantName": doc.data().restaurantName,
                    "detail": doc.data().detail,
                    "owner": doc.data().owner,
                }
                temp = [...temp , restaurantData]
            }
        })
        res.json({
            data : temp
        })
    })
    .catch( _ => {
        res.status(500)
        res.json({
            status : 'something want wrong'
        })
    })
})

router.get('/:id' , (req,res) => {
    const id = req.params.id
    const firestore = firebase.firststore
    const restaurantRef = firestore.collection('restaurant').doc(id)

    restaurantRef.get()
    .then(doc => {
        if(doc.exists){
            if(doc.data().display) {
                res.status(200)
                res.json({
                    "menuImg": doc.data().menuImg,
                    "id": doc.data().id,
                    "img": doc.data().img,
                    "type": doc.data().type,
                    "menu": doc.data().menu,
                    "contract": doc.data().contract,
                    "restaurantName": doc.data().restaurantName,
                    "detail": doc.data().detail,
                    "owner": doc.data().owner,
                })
            } else {
                res.status(500)
                res.json({
                    status : "restaurant is deleted"
                })
            }
        } else {
            res.status(500)
            res.json({
                status : "not found restaurant"
            })
        }
    })
    .catch(e => {
        res.status(500)
        res.json({
            status : "not found restaurant"
        })
    })

})

router.put('/:id' , (req,res) => {
    const id = req.params.id
    const token = req.body.token

    if(!id) return res.json({ code : 1 , status : "Don't have id in parans"})
    if(!token) return res.json({ code : 2 , status : "Don't have token in body"})

    const firestore = firebase.firststore
    const restaurantRef = firestore.collection('restaurant').doc(id)

    restaurantRef.get()
    .then(result => {
        if(result.exists) {
            if(result.data().token != token) {
                res.status(500)
                res.json({
                    user : {},
                    code : "token is not correct"
                })
            } else {
                restaurantRef.update({
                    contract: {
                        address: req.body.address ? req.body.address : result.data().address,
                        phone: req.body.phone ? req.body.phone : result.data().phone,
                        email: req.body.email ? req.body.email : result.data().email,
                    },
                    type: req.body.type ? req.body.type : result.data().type,
                    detail: req.body.detail ? req.body.detail : result.data().detail,
                    restaurantName: req.body.restaurantName ? req.body.restaurantName : result.data().restaurantName,
                })
                .then(_ => {
                    res.status(200)
                    res.json({
                        data : {
                            contract: {
                                address: req.body.address ? req.body.address : result.data().address,
                                phone: req.body.phone ? req.body.phone : result.data().phone,
                                email: req.body.email ? req.body.email : result.data().email,
                            },
                            type: req.body.type ? req.body.type : result.data().type,
                            detail: req.body.detail ? req.body.detail : result.data().detail,
                            restaurantName: req.body.restaurantName ? req.body.restaurantName : result.data().restaurantName,
                        },
                        code : "update to db"
                    })
                })
                .catch( e =>{
                    res.status(500)
                    res.json({
                        user : {},
                        code : "Can not update to db",
                        error : e
                    })
                })

            }
        } else {
            res.status(500)
            res.json({
                user : {},
                code : "not found restaurant"
            })
        }
    })

})

router.post('/:id/addMenu' , (req,res) => {
    const id = req.params.id
    
    if(!req.body.menu) return res.json({ code : 1 , status : "Don't have menu in body"})
    if(!req.body.price) return res.json({ code : 2 , status : "Don't have price in body"})
    if(!req.body.img) return res.json({ code : 2 , status : "Don't have img in body"})

})

router.delete('/:id' , (req,res) => {
    const id = req.params.id

    if(!id) return res.json({ code : 1 , status : "Don't have id in parans"})
    
    const firestore = firebase.firststore
    const userRef = firestore.collection('restaurant').doc(id)
    userRef.update({
        display : false
    })
    .then( _ => {
        res.json({
            status : 'delete restaurant complete'
        })
    })
    .catch( _ => {
        res.json({
            status : 'can not delete restaurant'
        })
    })
})

router.get('/' , (req,res) => {
    const firestore = firebase.firststore
    const restaurantRef = firestore.collection('restaurant').where('display','==',true)
    restaurantRef.get()
    .then( docs => {
        var temp = []
        docs.forEach( doc => {
            var restaurantData = {
                "menuImg": doc.data().menuImg,
                "id": doc.data().id,
                "img": doc.data().img,
                "type": doc.data().type,
                "menu": doc.data().menu,
                "contract": doc.data().contract,
                "restaurantName": doc.data().restaurantName,
                "detail": doc.data().detail,
                "owner": doc.data().owner,
            }
            temp = [...temp , restaurantData]
        })
        res.status(200)
        res.json({data : temp})
    })
    .catch( _ => {
        res.status(500)
        res.json({
            status : 'something want wrong'
        })
    })
})

module.exports = router