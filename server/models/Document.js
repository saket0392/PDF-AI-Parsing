const mongoose = require("mongoose");
const { Schema } = mongoose;

const DocSchema = new Schema({
    filename:{
        type:String,
        required: true
    },
    createdAt:{
        type:Date,
        default:Date.now,
    }
})

module.exports = mongoose.model("Document", DocSchema);