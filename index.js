const express = require("express");
const cors = require("cors");
const cookieParser =require("cookie-parser");
const { json } = require("body-parser");
require('dotenv').config() ;

const adminRoute = require("./route/adminRoute/adminRoute")
const providerRoute = require('./route/providerRoute/providerRoute')
const userRoute = require('./route/userRoute/userRoute')
const dataBase = require('./database/dbConnect')

dataBase()

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
  }));
app.disable('x-powered-by');

app.use("/uploads", express.static("uploads"));
const PORT = process.env.PORT||1997;

app.use("/admin",adminRoute)
app.use('/provider',providerRoute)
app.use("/",userRoute)


app.listen(PORT,()=>{
    console.log(`server is running on http://localhost:${PORT}`);
});