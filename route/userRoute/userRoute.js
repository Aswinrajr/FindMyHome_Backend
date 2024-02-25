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



module.exports = userRoute