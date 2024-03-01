const Admin = require("../../model/adminModel");
const User = require("../../model/userModel");
const Provider = require("../../model/providerModel");
const Order = require("../../model/orderModel");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config();

const fast2sms = require("fast2sms");
const SID = process.env.TWILIO_ACCOUNT_SID_ID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const twilio = require("twilio")(SID, TOKEN);

//Generate OTP
function generate_OTP() {
  console.log("in generate OTP");
  const digit = "0123456789";
  let OTP = "";

  for (i = 0; i < 5; i++) {
    OTP += digit[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

//ADMIN REGISTRATION
const adminLogin = async (req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  const admin = await Admin.findOne();
  console.log("Admin", admin);
  if (!admin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    console.log("Password hashed", passwordHash);
    const admin = new Admin({
      adminEmail,
      adminPassword: passwordHash,
    });
    await admin.save();
    console.log("Admin registered ");
    res.status(201).json({ status: "Admin Created successfully" });
  } else {
    console.log("else");
    res.status(201).json({ status: "Admin exist" });
  }
};

//ADMIN VERIFICATION
const adminVerifyLogin = async (req, res) => {
  console.log("Welcome to admin login");
  const { email, password } = req.body;
  console.log("Req.body", req.body);
  const admin = await Admin.findOne({ adminEmail: email });
  try {
    console.log(admin);

    if (admin) {
      const matchPassword = await bcrypt.compare(password, admin.adminPassword);
      const secretKey = process.env.JWT_ADMIN_SECRET_KEY;
      if (matchPassword) {
        const token = jwt.sign({ adminToken: admin.adminEmail }, secretKey, {
          expiresIn: "24h",
        });

        console.log("Token created and dashboard", token);

        res
          .status(200)
          .json({ msg: "Login successful", admin: admin, token: token });
      } else {
        console.log("Password incorrect");
        res.status(401).json({ msg: "Incorrect password" });
      }
    } else {
      console.log("Admin not found");
      res.status(404).json({ msg: "Admin not found" });
    }
  } catch (err) {
    console.log("Error in verify admin", err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

const reqForOtp = async (req, res) => {
  try {
    console.log("Welcome to otp");
    const { mobile } = req.body;

    const admin = await Admin.findOne({ adminMobile: mobile });
    console.log(admin);

    if (admin) {
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
      console.log("No admin found");
      res.status(404).json({ msg: "Admin not found" });
    }
  } catch (err) {
    console.log("Error in sending OTP:", err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

//Verify otp
const verifyOtp = async (req, res) => {
  try {
    console.log("Welcome to verify otp");
    const OTP = req.body.otp;
    const secretKey = process.env.JWT_ADMIN_SECRET_KEY;
    const mobile = req.app.locals.smobile;

    if (req.app.locals.sOTP === OTP) {
      const admin = await Admin.findOne({ adminMobile: mobile });
      if (admin) {
        const token = jwt.sign({ adminToken: admin.adminEmail }, secretKey, {
          expiresIn: "24h",
        });
        console.log("Token", token);
        res
          .status(200)
          .json({ msg: "OTP verified successfully", admin: admin });
      } else {
        res.status(404).json({ msg: "Admin not found" });
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

const getUsersData = async (req, res) => {
  try {
    console.log("Welcome to users data");
    const usersData = await User.find();
    console.log(usersData);
    res.status(200).json(usersData);
  } catch (err) {
    console.log("Error in getting the users data", err);
  }
};

const userAction = async (req, res) => {
  try {
    console.log("User action", req.body);
    const users = await User.findOne({ _id: req.body.userId });
    if (users.status === "Active") {
      users.status = "Blocked";
    } else {
      users.status = "Active";
    }
    await users.save();
    console.log(users);
    res
      .status(200)
      .json({ message: "User status updated successfully", users });
  } catch (error) {
    console.log("error in user actions", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProviderData = async (req, res) => {
  try {
    console.log("Welcome to Provider data");
    const providerData = await Provider.find();
    console.log(providerData);
    res.status(200).json(providerData);
  } catch (err) {
    console.log("Error in getting the provider data", err);
  }
};

const providerAction = async (req, res) => {
  try {
    console.log("Provider action", req.params);
    const provider = await Provider.findById({ _id: req.params.id });
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }
    provider.status = provider.status === "Active" ? "Blocked" : "Active";
    await provider.save();
    console.log(provider);
    res
      .status(200)
      .json({ message: "Provider status updated successfully", provider });
  } catch (error) {
    console.log("Error in provider action:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAdminBookingData = async (req, res) => {
  try {
    console.log("Welcome to admin booking data");
    const orderData = await Order.find();
    console.log(orderData);
    res.status(200).json({ orders: orderData });
  } catch (err) {
    console.log("Error in getting admin booking data", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  adminLogin,
  adminVerifyLogin,
  reqForOtp,
  verifyOtp,
  getUsersData,
  userAction,
  providerAction,
  getProviderData,
  getAdminBookingData,
};
