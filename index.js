const express = require('express') 
const app = express()  
const port = 3000  

// middleware
const user = require('./route/user') 
const restaurant = require('./route/restaurant')
const hotel = require('./route/hotel')

app.use('/user', user) 
app.use('/restaurant', restaurant) 
app.use('/hotel' , hotel)
  
app.listen(port, function() {
    console.log(`server is fucking on port ${port}`)
}) 