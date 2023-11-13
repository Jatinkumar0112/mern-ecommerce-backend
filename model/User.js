const mongoose = require('mongoose');
const {Schema} = mongoose;


const UserSchema = new Schema({
    email:{type: String, require: true, unique: true},
    password: {type: Buffer, required: true},
    role: {type: String, required: true, default:'user'},
    addresses: {type:[Schema.Types.Mixed]},
    //TODO: We can make a separate Schema for this
    name:{type: String},
    salt:Buffer
})

const virtual  = UserSchema.virtual('id');
virtual.get(function(){
    return this._id;
})
UserSchema.set('toJSON',{
    virtuals: true,
    versionKey: false,
    transform: function (doc,ret) { delete ret._id}
})


exports.User = mongoose.model('User',UserSchema)