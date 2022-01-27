const express = require('express') 
const bodyParser = require('body-parser')
const firebase = require('../firebase-config')
const router = express.Router() 

// middleware
router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())
router.use(bodyParser.raw())

router.post('/register', function (req, res) {
    const firestore = firebase.firststore
    const auth = firebase.auth

    if(!req.body.email) return res.json({ code : 1 , status : "Don't have email in body"})
    if(!req.body.password) return res.json({ code : 2 , status : "Don't have password in body"})
    if(!req.body.firstname) return res.json({ code : 3 , status : "Don't have firstname in body"})
    if(!req.body.lastname) return res.json({ code : 4 , status : "Don't have lastname in body"})

    auth.createUserWithEmailAndPassword(req.body.email , req.body.password)
    .then(result => {
        const userRef = firestore.collection('user').doc(result.user.uid)
        const userData = {
            id : result.user.uid,
            create : new Date().valueOf(),
            email : req.body.email,
            firstname : req.body.firstname,
            lastname : req.body.lastname,
            provider : 'email',
            blacklist : false,
            token : Math.random() * 999999999,
            phone : '',
            address : '',
            userImg : '',
            admin : false
        }
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
    .catch(error => {
        res.status(500)
        res.json({
            status : error.code
        })
    })
})

router.post('./google-register', (req,res) => {
    if(!req.body.email) return res.json({ code : 1 , status : "Don't have email in body"})
    if(!req.body.uid) return res.json({ code : 2 , status : "Don't have uid in body"})
    if(!req.body.firstname) return res.json({ code : 3 , status : "Don't have firstname in body"})
    if(!req.body.lastname) return res.json({ code : 4 , status : "Don't have lastname in body"})
    if(!req.body.userImg) return res.json({ code : 5 , status : "Don't have userImg in body"})

    const firestore = firebase.firststore
    const userRef = firestore.collection('user').doc(req.body.uid)
    const token = Math.random() * 999999999
    const userData = {
        id : req.body.uid,
        create : new Date().valueOf(),
        email : req.body.email,
        firstname : req.body.firstname,
        lastname : req.body.lastname,
        provider : 'google',
        blacklist : false,
        token : token,
        phone : '',
        address : '',
        userImg : req.body.userImg,
        admin : false
    }
    
    userRef.set({userData})
    .then( _ =>{
        res.status(200)
        res.json({
            data : userData,
            token : token
        })
    })
    .catch( _ => {
        res.status(500)
        res.json({
            status : 'something want wrong'
        })
    })
})

router.post('/login', function (req, res) {
    const firestore = firebase.firststore
    const auth = firebase.auth
    
    if(!req.body.email) return res.json({ code : 1 , status : "Don't have email in body"})
    if(!req.body.password) return res.json({ code : 2 , status : "Don't have password in body"})

    auth.signInWithEmailAndPassword(req.body.email , req.body.password)
    .then(result => {
        const userRef = firestore.collection('user').doc(result.user.uid)
        userRef.get()
        .then(doc => {
            if(!doc.data().blacklist) {
                res.status(200)
                res.json({
                    id : doc.data().id,
                    user : {
                        email : doc.data().email,
                        firstname : doc.data().firstname,
                        lastname : doc.data().lastname,
                        create : doc.data().create,
                        phone : doc.data().phone,
                        address : doc.data().address,
                        admin : doc.data().admin
                    } , 
                    token :  doc.data().token
                })
            } else {
                res.status(500)
                res.json({
                    id : doc.data().id,
                    user : {},
                    status : "The user is in the blacklist."
                })
            }
        })
    })
    .catch(error => {
        res.status(500)
        res.json({
            status : error.code
        })
    })
})

router.get('/find', (req,res) => {
    if(!req.query.keyword) return res.json({ code : 1 , status : "Don't have keyword in body"})
    const firestore = firebase.firststore
    const keyword = req.query.keyword
    const userRef = firestore.collection('user').where('blacklist','==',false)
    userRef.get()
    .then(docs => {
        let temp = []
        docs.forEach(doc => {
            if(doc.data().firstname.toLowerCase().search(keyword.toLowerCase()) > -1 || 
               doc.data().lastname.toLowerCase().search(keyword.toLowerCase()) > -1 || 
               doc.data().email.toLowerCase().search(keyword.toLowerCase()) > -1) {
                var userInfo = {
                    "address": doc.data().address,
                    "blacklist": doc.data().blacklist,
                    "provider": doc.data().provider,
                    "id": doc.data().id,
                    "firstname": doc.data().firstname,
                    "phone": doc.data().phone,
                    "email": doc.data().email,
                    "userImg": doc.data().userImg,
                    "create": doc.data().create,
                    "lastname": doc.data().lastname
                }
                temp = [...temp , userInfo]
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
    if(!req.params.id) return res.json({ code : 1 , status : "Don't have id in parems"})
    const firestore = firebase.firststore
    const userRef = firestore.collection('user').doc(req.params.id)

    userRef.get()
    .then(doc => {
        if(doc.exists) {
            const userData = {
                id : doc.data().id,
                create : doc.data().create,
                email : doc.data().email,
                firstname : doc.data().firstname,
                lastname : doc.data().lastname
            }
            res.status(200)
            res.json({
                user : userData
            })
        } else {
            res.status(500)
            res.json({
                code : `not found user id ${req.params.id}`
            })
        }
    })
}) 

router.put('/:id' , (req,res) => {
    const id = req.params.id
    const token = req.body.token

    if(!id) return res.json({ code : 1 , status : "Don't have id in parans"})
    if(!token) return res.json({ code : 2 , status : "Don't have token in body"})

    const firestore = firebase.firststore
    const userRef = firestore.collection('user').doc(id)
    userRef.get()
    .then(result => {
        if(result.exists) {
            if(result.data().token != token) {
                res.status(500)
                res.json({
                    status : "token is not correct"
                })
            } else {
                userRef.update({
                    firstname : req.body.firstname ? req.body.firstname : result.data().firstname,
                    lastname : req.body.lastname ? req.body.lastname : result.data().lastname,
                    phone : req.body.phone ? req.body.phone : result.data().phone,
                    address : req.body.address ? req.body.address : result.data().address,
                    userImg : req.body.userImg ? req.body.userImg : result.data().userImg
                })
                .then(_ => {
                    res.json({
                        user : {
                            firstname : req.body.firstname ? req.body.firstname : result.data().firstname,
                            lastname : req.body.lastname ? req.body.lastname : result.data().lastname,
                            phone : req.body.phone ? req.body.phone : result.data().phone,
                            address : req.body.address ? req.body.address : result.data().address,
                            userImg : req.body.userImg ? req.body.userImg : result.data().userImg
                        },
                        status : "update on db"
                    })
                })
                .catch( e =>{
                    res.status(500)
                    res.json({
                        status : "Can not update to db"
                    })
                })
            }
        } else {
            res.status(500)
            res.json({
                user : {},
                code : "not found user"
            })
        }
    })
    
}) 

router.delete('/:id' , (req,res) => {
    const id = req.params.id

    if(!id) return res.json({ code : 1 , status : "Don't have id in parans"})

    const firestore = firebase.firststore
    const userRef = firestore.collection('user').doc(id)
    userRef.update({
        blacklist : true
    })
    .then( _ => {
        res.json({
            status : 'delete user complete'
        })
    })
    .catch( _ => {
        res.json({
            status : 'can not delete user'
        })
    })
})

module.exports = router