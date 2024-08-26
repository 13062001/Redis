const { default: mongoose, Schema, model } = require("mongoose");

(async() => {
    await mongoose.connect('mongodb://localhost:27017');
})() ;

const UserSchema = new Schema(
    {
        name:{
            type:String,
            required:true
        },
        age:{
            type:Number,
            required:true
        },
        mobno:{
            type:Number,
            required:true
        }
    }
)

const User = model('user',UserSchema);

module.exports = User ;