const express = require("express");
const providerRoute = express();
const providerController = require("../../controller/providerController/providerController");
// const upload = require('../../multer/multer')
const multer = require("multer");



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });



providerRoute.post("/login", providerController.providerLogin);
providerRoute.post("/signup", providerController.providerSignUp);
providerRoute.post("/reqotp", providerController.providerReqOtp);
providerRoute.post("/verifyotp", providerController.providerVerifyOtp);

providerRoute.post("/completedata",providerController.completeProviderData)


providerRoute.get("/rooms",providerController.getRoomData)
providerRoute.post("/rooms/addrooms", upload.array("images", 5), providerController.providerAddrooms);
providerRoute.get("/rooms/editrooms/:id",providerController.roomDataId)
providerRoute.post("/rooms/updaterooms/:id",upload.array("images", 5),providerController.updateRooms)


module.exports = providerRoute;
