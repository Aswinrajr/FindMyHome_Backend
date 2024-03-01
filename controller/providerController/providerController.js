const Provider = require("../../model/providerModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const path = require("path");
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

//Provider Registration
const providerLogin = async (req, res) => {
  console.log("Welcome to provider Login");
  try {
    const { email, password } = req.body;
    console.log(email, password);

    const provider = await Provider.findOne({
      providerEmail: email,
      status: "Active",
    });
    console.log("Provider", provider);

    if (provider) {
      if (provider.status === "Active") {
        const matchPassword = await bcrypt.compare(
          password,
          provider.providerPassword
        );
        if (matchPassword) {
          const secretKey = process.env.JWT_ADMIN_SECRET_KEY;

          const token = jwt.sign(
            { providerToken: provider.providerEmail },
            secretKey,
            { expiresIn: "24h" }
          );
          console.log("Token created", token);

          console.log("Provider login successful");
          res
            .status(200)
            .json({ msg: "Provider login successful", provider: provider });
        } else {
          console.log("Password is incorrect");
          res.status(401).json({ msg: "Incorrect password" });
        }
      } else {
        console.log("User is blocked ");
        res
          .status(401)
          .json({ msg: "Something went wrong please contact admin" });
      }
    } else {
      console.log("Provider is not registered, please sign up");
      res.status(404).json({ msg: "Provider not registered, please sign up" });
    }
  } catch (err) {
    console.log("Error in provider verification", err);
    res.status(500).json({ msg: "Internal Server Error" });
  }
};

const providerSignUp = async (req, res) => {
  try {
    const { residenceName, email, mobile, password, confirmPassword } =
      req.body;
    console.log(residenceName, email, mobile, password, confirmPassword);

    const existingProvider = await Provider.findOne({ providerEmail: email });

    if (existingProvider) {
      console.log("Provider is already registered. Please login.");
      res
        .status(400)
        .json({ message: "Provider is already registered. Please login." });
    } else {
      if (password === confirmPassword) {
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log("Password hashed:", hashedPassword);

        const provider = new Provider({
          providerName: residenceName,
          providerEmail: email,
          providerMobile: mobile,
          providerPassword: hashedPassword,
        });

        await provider.save();
        console.log("Sign up successful.");

        // await twilio.messages.create({
        //   body: `Welcome ${residenceName} you are successfully Registered in FindMyHome`,
        //   to: `+91 ${mobile}`,
        //   from: +16464010343,
        // });

        res.status(201).json({ message: "Sign up successful." });
      } else {
        console.log("Passwords do not match.");
        res.status(400).json({ message: "Passwords do not match." });
      }
    }
  } catch (err) {
    console.log("Error in provider registration:", err);
    res.status(500).json({
      message: "Provider is already registered . Please try again later.",
    });
  }
};

const providerReqOtp = async (req, res) => {
  try {
    console.log("Welcome to otp", req.body);
    let { mobile } = req.body;
    mobile = parseInt(mobile);
    console.log(typeof mobile);

    const provider = await Provider.findOne({ providerMobile: mobile });
    console.log(provider);

    if (provider) {
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
      console.log("No provider found");
      res.status(404).json({ msg: "Admin not found" });
    }
  } catch (err) {
    console.log("Error in req for otp", err);
  }
};

const providerVerifyOtp = async (req, res) => {
  try {
    console.log("Welcome to verify otp");
    const OTP = req.body.otp;
    const secretKey = process.env.JWT_ADMIN_SECRET_KEY;
    const mobile = req.app.locals.smobile;

    if (req.app.locals.sOTP === OTP) {
      const provider = await Provider.findOne({ providerMobile: mobile });
      if (provider) {
        const token = jwt.sign(
          { providerToken: provider.providerEmail },
          secretKey,
          {
            expiresIn: "24h",
          }
        );
        console.log("Token", token);
        res
          .status(200)
          .json({ msg: "OTP verified successfully", provider: provider });
      } else {
        res.status(404).json({ msg: "Provider not found" });
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

const getRoomData = async (req, res) => {
  try {
    const { email } = req.query;
    console.log("email", email);

    const provider = await Provider.findOne({ providerEmail: email });
    console.log(provider);

    if (!provider) {
      return res.status(404).json({ error: "Provider not found" });
    }

    const providerId = provider._id;

    const roomsData = await Room.find({ providerId, status: "Available" });

    console.log("roomsData", roomsData);
    res.status(200).json(roomsData);
  } catch (err) {
    console.log("Error in getting the room data", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const providerAddrooms = async (req, res) => {
  console.log("Req.body", req.body);
  const { roomType, adults, children, amount, status, amenities, email } =
    req.body;
  const { provider } = JSON.parse(email);

  const images = req.files ? req.files.map((file) => file.path) : [];
  console.log("Add room ", email);

  try {
    const providerId = await Provider.findOne({ providerEmail: provider });
    console.log("Provider Add room", providerId);
    const newRoom = new Room({
      providerId: providerId._id,
      roomType,
      adults,
      children,
      amount,
      status,
      amenities: JSON.parse(amenities),
      images,
    });

    const savedRoom = await newRoom.save();

    res
      .status(200)
      .json({ message: "Room added successfully", room: savedRoom });
  } catch (error) {
    console.error("Error adding room:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const roomDataId = async (req, res) => {
  try {
    console.log("Welcome to doom data", req.params.id);
    const room = await Room.findOne({ _id: req.params.id });
    console.log(room);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(room);
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const updateRooms = async (req, res) => {
  console.log("Req.body", req.body);
  const { id } = req.params;
  const { roomType, adults, children, amount, status, amenities } = req.body;
  const images = req.files ? req.files.map((file) => file.path) : [];
  console.log(images);
  console.log(req.params);

  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      { _id: id },
      {
        roomType,
        adults,
        children,
        amount,
        status,
        amenities: JSON.parse(amenities),
        images,
      },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Room updated successfully", room: updatedRoom });
  } catch (error) {
    console.error("Error updating room:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const completeProviderData = async (req, res) => {
  try {
    const { provider } = JSON.parse(req.body.providerEmail);
    console.log("Provider Email:", provider);
    const providerData = await Provider.findOne({ providerEmail: provider });
    console.log(providerData);
    if (providerData.Profile === "Not Completed") {
      res.json({ msg: "Complete your profile Data" });
    } else {
      res.status(200).json({ success: true });
    }
  } catch (err) {
    console.error("Error completing provider data:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
const saveProviderData = async (req, res) => {
  try {
    console.log("welcome to save provider data", req.body);
    const { recidenceName, rooms, location, facilities, city, coordinates } =
      req.body;
    const { provider } = JSON.parse(req.body.providerEmail);
    const images = req.files ? req.files.map((file) => file.path) : [];
    console.log("recidenceName", recidenceName);
    console.log("room", rooms);
    console.log("location", location);
    console.log("facilities", facilities);
    console.log("images", images);
    console.log("providerEmail", provider);
    console.log("city", city);
    console.log("coordinates", coordinates);

    const postalCodeRegex = /\b\d{6}\b/;
    const postalCodeMatch = location.match(postalCodeRegex);
    const postalCode = postalCodeMatch ? postalCodeMatch[0] : "";

    const addressWithoutPostalCode = location
      .replace(postalCodeRegex, "")
      .trim();

    const addressComponents = addressWithoutPostalCode
      .split(",")
      .map((component) => component.trim());

    const house = addressComponents.shift();

    const country = addressComponents.pop();

    const state = addressComponents.pop();

    const street = addressComponents.join(", ");

    console.log("House:", house);
    console.log("Street:", street);
    console.log("State:", state);
    console.log("Country:", country);
    console.log("Postal Code:", postalCode);

 

    // Split the coordinates string at the comma delimiter
    const [latitudeStr, longitudeStr] = coordinates.split(',');
    
    // Parse the latitude and longitude strings into numbers
    const latitude = parseFloat(latitudeStr);
    const longitude = parseFloat(longitudeStr);
    
    console.log("Latitude:", latitude); // Output: Latitude: 8.5241391
    console.log("Longitude:", longitude); // Output: Longitude: 76.9366376
    

    const updateProvider = await Provider.findOneAndUpdate(
      { providerEmail: provider },
      {
        $set: {
          providerAddress: location,
          ProviderCity: city,
          ProviderState: state,
          providerImage: images,
          providerRooms: parseInt(rooms),
          Profile: "Completed",
          coordinates: [longitude, latitude],
        },
      },
      { new: true }
    );

    console.log("ProviderSaved successfully", updateProvider);

    res.json({ success: true, message: "Provider data saved successfully" });
  } catch (err) {
    console.log("error in saving the data", err);

    res
      .status(500)
      .json({ success: false, message: "Failed to save provider data" });
  }
};

module.exports = {
  providerLogin,
  providerSignUp,
  providerReqOtp,
  providerVerifyOtp,
  providerAddrooms,
  getRoomData,
  roomDataId,
  updateRooms,
  completeProviderData,
  saveProviderData,
};
