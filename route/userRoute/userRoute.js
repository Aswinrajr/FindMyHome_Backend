const express = require("express")
const userRoute = express()
const jwt = require('jsonwebtoken')
const multer = require("multer")

const userController = require('../../controller/userController/userController')


userRoute.post("/signup",userController.userRegistration)
userRoute.post('/login',userController.userLogin)
userRoute.post("/reqotp",userController.reqForOtp)
userRoute.post("/verifyotp",userController.verifyOtp)

userRoute.post("/searchrooms",userController.searchRooms)
userRoute.post("/fetchdata",userController.getCombinedData)
userRoute.post("/bookroom/:id",userController.bookRoom)
userRoute.post("/placeorder",userController.placeOrder)




module.exports = userRoute