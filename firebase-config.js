const firebase = require('firebase/compat/app')
require('firebase/compat/firestore')
require('firebase/compat/storage')
require('firebase/compat/auth')

const firebaseConfig = {
    apiKey: "AIzaSyBZISq0DJC0QQ5UNzVd_vMeNKTR_Kr4_xY",
    authDomain: "web-app-chumphon.firebaseapp.com",
    projectId: "web-app-chumphon",
    storageBucket: "web-app-chumphon.appspot.com",
    messagingSenderId: "531181843148",
    appId: "1:531181843148:web:81dcce8ab7a1592c864869",
    measurementId: "G-J2MNNKW51N"
}

const firebaseApp = firebase.initializeApp(firebaseConfig)

module.exports = {
    firebase : firebaseApp,
    firststore : firebaseApp.firestore(),
    auth : firebaseApp.auth()
}