const mongoose = require('mongoose');
require('dotenv').config();


const mongoDb = async () =>{
    try{await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected Successfully")
    }catch(error){
        console.log('error',error);
    }
}
module.exports= mongoDb;