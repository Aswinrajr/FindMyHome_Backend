const User = require("../../model/userModel");
const Provider = require("../../model/providerModel");
const Rooms = require("../../model/roomModel");
const Order = require("../../model/orderModel")



const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const path = require("path");
const mongoose = require("mongoose");
const Room = require("../../model/roomModel");

const SID = process.env.TWILIO_ACCOUNT_SID_ID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const twilio = require("twilio")(SID, TOKEN);

function generate_OTP() {
  console.log("in generate OTP");
  const digit = "0123456789";
  let OTP = "";

  for (i = 0; i < 5; i++) {
    OTP += digit[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

const userRegistration = async (req, res) => {
  try {
    console.log("Welcome to user sign up", req.body);
    const { userName, email, mobile, password, confirmPassword } = req.body;
    console.log(userName, email, mobile, password, confirmPassword);

    const user = await User.findOne({ userEmail: email });
    console.log(user);

    if (user) {
      console.log("User is already registered, please login");
      return res
        .status(400)
        .json({ message: "User is already registered, please login" });
    } else {
      if (password === confirmPassword) {
        const hashPassword = await bcrypt.hash(password, 10);
        console.log("Password hashed", hashPassword);
        const newUser = new User({
          userName: userName,
          userEmail: email,
          userMobile: mobile,
          userPassword: hashPassword,
        });
        await newUser.save();
        await twilio.messages.create({
          body: `welcome ${userName} you are successfully registerd with FindMyHome`,
          to: `+91 ${mobile}`,
          from: +16464010343,
        });
        console.log("Sign Up successful");
        return res.status(201).json({ message: "Sign Up successful" });
      } else {
        console.log("Passwords do not match");
        return res.status(400).json({ message: "Passwords do not match" });
      }
    }
  } catch (err) {
    console.log("Error in user Registration", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const userLogin = async (req, res) => {
  console.log("Welcome to user Login");
  try {
    const { email, password } = req.body;
    console.log(email, password);

    const user = await User.findOne({ userEmail: email });
    console.log("User", user);

    if (user) {
      console.log(user.status);
      if (user.status == "Active") {
        const matchPassword = await bcrypt.compare(password, user.userPassword);
        if (matchPassword) {
          const secretKey = process.env.JWT_ADMIN_SECRET_KEY;

          const token = jwt.sign({ userToken: user.userEmail }, secretKey, {
            expiresIn: "24h",
          });
          console.log("Token created", token);

          console.log("user login successful");
          res.status(200).json({ msg: "user login successful", user: user });
        } else {
          console.log("Password is incorrect");
          res.status(401).json({ msg: "Incorrect password" });
        }
      } else {
        console.log("User is blocked");
        res
          .status(401)
          .json({ msg: "Something went wrong please contact admin" });
      }
    } else {
      console.log("user is not registered, please sign up");
      res.status(404).json({ msg: "user not registered, please sign up" });
    }
  } catch (err) {
    console.log("Error in user verification", err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

const reqForOtp = async (req, res) => {
  try {
    console.log("Welcome to otp", req.body);
    let { mobile } = req.body;
    mobile = parseInt(mobile);
    console.log(typeof mobile);

    const user = await User.findOne({ userMobile: mobile });
    console.log(user);

    if (user) {
      const OTP = generate_OTP();
      req.app.locals.sOTP = OTP;
      req.app.locals.smobile = mobile;
      console.log("OTP: ", OTP, "Mobile: ", mobile);
      console.log(
        "sOTP: ",
        req.app.locals.sOTP,
        "sMobile: ",
        req.app.locals.smobile
      );
      console.log(OTP);

      await twilio.messages
        .create({
          body: OTP,
          to: `+91 ${mobile}`,
          from: +16464010343,
        })
        .then((message) => {
          console.log(message);
          console.log("OTP Sent To The Registered Mobile Number");
          res.status(200).json({ msg: "OTP Sent Successfully" });
        })
        .catch((error) => {
          console.error("Error sending OTP:", error);
          res
            .status(400)
            .json({ msg: "Failed to send OTP. Please try again later." });
        });
    } else {
      console.log("No user found");
      res.status(404).json({ msg: "user not found" });
    }
  } catch (err) {
    console.log("Error in req for otp", err);
  }
};

const verifyOtp = async (req, res) => {
  try {
    console.log("Welcome to verify otp");
    const OTP = req.body.otp;
    const secretKey = process.env.JWT_ADMIN_SECRET_KEY;
    const mobile = req.app.locals.smobile;

    if (req.app.locals.sOTP === OTP) {
      const user = await User.findOne({ userMobile: mobile });
      if (user) {
        const token = jwt.sign({ userToken: user.userEmail }, secretKey, {
          expiresIn: "24h",
        });
        console.log("Token", token);
        res.status(200).json({ msg: "OTP verified successfully", user: user });
      } else {
        res.status(404).json({ msg: "user not found" });
      }
    } else {
      console.log("Otp incorrect");
      res.status(401).json({ msg: "Incorrect OTP" });
    }
  } catch (err) {
    console.log("Error in verify the otp", err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

// const searchRooms = async (req, res) => {
//   try {
//     console.log(req.body);
//     const { city, latitude, longitude, checkIn, checkOut, adults, children } =
//       req.body;

//     const nearbyProviders = await Provider.find({
//       coordinates: {
//         $near: {
//           $geometry: {
//             coordinates: [longitude, latitude],
//           },
//           $maxDistance: 1000000000,
//         },
//       },
//     });
//     console.log("Provider searched", nearbyProviders);

//     const providerIds = nearbyProviders.map((provider) => provider._id);

//     const availableRooms = await Rooms.find({
//       providerId: { $in: providerIds },
//       status: "Available",
//       adults: { $gte: adults },
//       children: { $gte: children },
//     });
//     console.log("Available rooms", availableRooms);

//     res.json({ success: true, availableRooms });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

const searchRooms = async (req, res) => {
  try {
    console.log(req.body);
    const { city, latitude, longitude, checkIn, checkOut, adults, children } =
      req.body;

    const nearbyProviders = await Provider.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [longitude, latitude] },
          distanceField: "distance",
          spherical: true,
          key: "coordinates",
          maxDistance: 1000000000,
          distanceMultiplier: 0.001,
        },
      },
    ]);

    console.log("Provider searched", nearbyProviders);

    console.log("Available rooms", nearbyProviders);

    res.status(200).json({ success: true, nearbyProviders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getCombinedData = async (req, res) => {
  try {
    console.log("Welcome to combined data", req.body);
    const formData = req.body.formData;
    const nearbyProviders = req.body.nearbyProviders;

    console.log("Formdata", formData);
    console.log("nearbyProviders", nearbyProviders);

    const roomData = await Room.find({ status: "Available" });
    console.log("Roomdata", roomData);

    const combinedData = [];

    nearbyProviders.forEach((provider) => {
      roomData.forEach((room) => {
        if (String(provider._id) === String(room.providerId)) {
          combinedData.push({
            room: room,
            distance: provider.distance,
          });
        }
      });
    });

    console.log("..................................");
    console.log("combinedData", combinedData);
    console.log("..................................");
    res.status(200).json(combinedData);
  } catch (error) {
    console.error("Error in getCombinedData:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const bookRoom = async (req, res) => {
  try {
    console.log("Welcome to room booking", req.body);
    const { formData } = req.body.data;

    let user = req.body.user;
    user = JSON.parse(user);
    const email = user.user;
    console.log(email);

    const { id } = req.params;
    console.log("Room id", id);

    const roomData = await Rooms.findOne({ _id: id, status: "Available" });
    const providerData = await Provider.findOne({ _id: roomData.providerId });
    const userData = await User.findOne({ userEmail: email });

    console.log("Room data", roomData);
    console.log("providerData", providerData);
    console.log("userData", userData);

    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(formData.checkOut);

    const timeDifference = Math.abs(
      checkOutDate.getTime() - checkInDate.getTime()
    );
    const numberOfDays = Math.ceil(timeDifference / (1000 * 3600 * 24));

    const bookingDetails = {
      userId: userData._id,
      roomId: roomData._id,
      providerId: providerData._id,
      roomType: roomData.roomType,
      adults: formData.adults,
      children: formData.children,
      numberOfDays,
      checkInDate: formData.checkIn,
      checkOutDate: formData.checkOut,
      amount: roomData.amount,
      totalAmounttoPay: numberOfDays * roomData.amount,
      city: formData.city,
    };

    console.log(bookingDetails);

    res
      .status(200)
      .json({
        success: true,
        message: "Room booked successfully",
        bookingDetails,
      });
  } catch (err) {
    console.log("Error in room booking", err);

    res
      .status(500)
      .json({
        success: false,
        message: "Error in room booking",
        error: err.message,
      });
  }
};



const placeOrder = async (req, res) => {
  try {
    console.log("Welcome to place order", req.body);
    const orderDetails = req.body;

    const newOrder = new Order(orderDetails);

    const savedOrder = await newOrder.save();

    console.log("Order saved successfully:", savedOrder);

   
    res.status(200).json({ success: true, message: "Order placed successfully", order: savedOrder });
  } catch (err) {
    console.log("Error in placing the order:", err);
    

    res.status(500).json({ success: false, message: "Error in placing the order", error: err.message });
  }
};

module.exports = { placeOrder };


module.exports = {
  userRegistration,
  userLogin,
  reqForOtp,
  verifyOtp,
  searchRooms,
  getCombinedData,
  bookRoom,
  placeOrder
};
