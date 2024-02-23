const mongoose = require('mongoose');
require('dotenv').config() ;



const dbConnect = (req,res)=>{
    mongoose.connect(`${process.env.DATABASE_CONNECTION}`).then(()=>{
        console.log("Connected to database")
    })
    .catch(err=>{
        console.log("Error in conncting the datbase",err)
    });
};

module.exports = dbConnect;