const mongoose = require('mongoose');
require('../db/mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { default: validator } = require('validator');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) throw new Error('Email is not valid');
        }
    },
    password: {
        type: 'String',
        required: true,
        minlength: 6,
        validate(value) {
            if (!(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{6,}$/).test(value))
                throw new Error('Passwords must contain at least six characters, at least one letter, one number and one capital letter');
        }
    },
    firstName: {
        type: String,
        required: true,
        minlength: 1,
        validate(value) {
            if (!(/^[a-zA-Zא-ת]+$/).test(value))
            throw new Error('First name must only include letters');
        }
    },
    lastName: {
        type: String,
        required: true,
        minlength: 1,
        validate(value) {
            if (!(/^[a-zA-Zא-ת]+$/).test(value))
            throw new Error('Last name must only include letters');
        }
    },
    phoneNumber: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (isNaN(value)) throw new Error('Phone number can only include numbers');
            if (value.length !== 10) throw new Error(`Phone number must be exactly 10 digits long, it currently has ${value.length} digits`);
            if (value.substring(0, 2) !== '05') throw new Error('Phone number must start with 05 characters');
            if (value[2] === '9' || value[2] === '7' || value[2] === '6') throw new Error(`Phone number cannot begin with ${value.substring(0, 3)}, change the third character (${value[2]})`);
        }
    },
    dateOfBirth: {
        type: Date,
        validate(value) {
            if (value > Date.now()) throw new Error('Entry date cannot be before today');
        }
    },
    tokens: [
        {
            token: {
                type: String,
                required: true
            }
        }
    ]
}, {
    timestamps: true
});

userSchema.virtual('apartments', {
    ref: 'ApartmentModel',
    localField: '_id',
    foreignField: 'publisher'
});

// Hiding info
userSchema.methods.toJSON = function() {
    const user = this;
    const userObj = user.toObject();

    delete userObj.password;
    delete userObj.tokens;

    return userObj;
}

userSchema.methods.generateAuthToken = async function() {
    const user = this;
    const token = jwt.sign(
        {
            _id: user._id
        },
        process.env.TOKEN_SECRET,
        {
            expiresIn: "6h"
        }
    );

    user.tokens = user.tokens.concat({ token });
    await user.save();

    return token;
};

userSchema.statics.findByCredentials = async (email, password) => {  
    let loginCredentialsErrorMsg = 'email and/or password are incorrect';
    
    let user = await UserModel.findOne({ email });
    if (!user) throw new Error(loginCredentialsErrorMsg);

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch)
        throw new Error(loginCredentialsErrorMsg);

    return user;
};

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this;

    if (user.isModified('password'))
        user.password = await bcrypt.hash(user.password, 8);

    next();
});

const UserModel = mongoose.model('UserModel', userSchema);

module.exports = UserModel;