const express = require('express') 
const bodyParser = require('body-parser')
const firebase = require('../firebase-config')
const router = express.Router() 

// middleware
router.use(bodyParser.urlencoded({ extended: true }))
router.use(bodyParser.json())
router.use(bodyParser.raw())

router.post('/register' , (req,res) => {
    
})

module.exports = router