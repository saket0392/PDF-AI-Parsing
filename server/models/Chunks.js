const mongoose = require("mongoose");
const { Schema } = mongoose;

const ChunkSchema = new Schema({
    document:{
        type:Schema.Types.ObjectId,
        ref:"Document",
        required:true,
    },
    text:{
        type: String,
        required: true,
    },
    embedding:{
        type:[Number],
        required:true,
    },
    createdAt:{
        type:Date,
        default:Date.now,
    }
})

module.exports = mongoose.model("Chunk", ChunkSchema);