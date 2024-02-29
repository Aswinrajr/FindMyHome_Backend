const express = require('express');
const adminRoute = express();

const adminController = require('../../controller/adminController/adminController');


adminRoute.get("/",adminController.adminLogin)
adminRoute.post("/login",adminController.adminVerifyLogin)
adminRoute.post("/reqotp",adminController.reqForOtp)
adminRoute.post("/verifyotp",adminController.verifyOtp)


adminRoute.get("/users",adminController.getUsersData)
adminRoute.post("/users/action",adminController.userAction)
adminRoute.get("/providers",adminController.getProviderData)
adminRoute.post("/providers/action/:id",adminController.providerAction)
adminRoute.get("/getallbookingdata",adminController.getAdminBookingData)



module.exports = adminRoute;