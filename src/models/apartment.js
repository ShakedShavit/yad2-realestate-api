const mongoose = require('mongoose');
const validator = require('validator');
require('../db/mongoose');

const apartmentConfig = {
    types: [
        'apartment',
        'garden-apartment',
        'private-house/cottage',
        'rooftop/penthouse',
        'lots',
        'duplex',
        'vacation-apartment',
        'two-family-dwelling',
        'basement/parterre',
        'triplex',
        'residential-unit',
        'farm/estate',
        'auxiliary-farm',
        'protected-accommodation',
        'residential-building',
        'studio/loft',
        'garage',
        'parking',
        'general'
    ],
    condition: [
        'brand-new',
        'new',
        'renovated',
        'good',
        'in-need-of-renovation'
    ],
    otherProperties: [
        'town',
        'streetName',
        'houseNum',
        'floor',
        'buildingMaxFloor',
        'isStandingOnPolls',
        'numberOfRooms',
        'numberOfParkingSpots',
        'numberOfBalconies',
        'hasAirConditioning',
        'hasFurniture',
        'isRenovated',
        'hasSafeRoom',
        'isAccessible',
        'hasKosherKitchen',
        'hasShed',
        'hasLift',
        'hasSunHeatedWaterTanks',
        'hasPandorDoors',
        'hasTadiranAc',
        'hasWindowBars',
        'description',
        'furnitureDescription',
        'price',
        'builtSqm',
        'totalSqm',
        'date',
        'isImmediate',
        'canBeInContactOnWeekends'
    ]
}

const apartmentSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (!apartmentConfig.types.includes(value)) throw new Error(`Apartment's type must be one of the following: ${apartmentConfig.types}. The type that was specified is ${value}`);
        }
    },
    condition: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (!apartmentConfig.condition.includes(value)) throw new Error(`Apartment's type must be one of the following: ${apartmentConfig.condition}. The type that was specified is ${value}`);
        }
    },
    location: {
        town: {
            type: String,
            required: true,
            trim: true
        },
        streetName: {
            type: String,
            trim: true
        },
        houseNum: {
            type: Number,
            required: true
        },
        floor: {
            type: Number,
            required: true
        },
        buildingMaxFloor: {
            type: Number,
            required: true
        },
    },
    properties: {
        isStandingOnPolls: {
            type: Boolean,
            required: false,
            default: false
        },
        numberOfRooms: {
            type: Number,
            required: true,
            validate(value) {
                const minNum = 0;
                const maxNum = 12;
                if (value < minNum) throw new Error(`Number of rooms cannot be less than ${minNum}`);
                if (value > maxNum) throw new Error(`Number of rooms cannot surpass ${maxNum}`);
                const reminder = value % 1;
                if (reminder !== 0 && (value > 7 || value < 1)) throw new Error('Number of rooms must be a whole number if it is bigger than 7 or smaller than 1');
                if (reminder !== 0.5 && reminder !== 0) throw new Error('Number of rooms cannot have a fraction different than .5 or .0');
            }
        },
        numberOfParkingSpots: {
            type: Number,
            required: false,
            default: 0,
            validate(value) {
                if (value % 1 !== 0) throw new Error('Number of parking spots cannot include a fraction');
                if (value < 0 || value > 3) throw new Error('Number of parking spots cannot be less than 0 or more than 3');
            }
        },
        numberOfBalconies: {
            type: Number,
            required: false,
            default: 0,
            validate(value) {
                if (value % 1 !== 0) throw new Error('Number of balconies cannot include a fraction');
                if (value < 0 || value > 3) throw new Error('Number of balconies cannot be less than 0 or more than 3');
            }
        },
        hasAirConditioning: {
            type: Boolean,
            default: false,
            required: false
        },
        hasFurniture: {
            type: Boolean,
            default: false,
            required: false
        },
        isRenovated: {
            type: Boolean,
            default: false,
            required: false
        },
        hasSafeRoom: {
            type: Boolean,
            default: false,
            required: false
        },
        isAccessible: {
            type: Boolean,
            default: false,
            required: false
        },
        hasKosherKitchen: {
            type: Boolean,
            default: false,
            required: false
        },
        hasShed: {
            type: Boolean,
            default: false,
            required: false
        },
        hasLift: {
            type: Boolean,
            default: false,
            required: false
        },
        hasSunHeatedWaterTanks: {
            type: Boolean,
            default: false,
            required: false
        },
        hasPandorDoors: {
            type: Boolean,
            default: false,
            required: false
        },
        hasTadiranAc: {
            type: Boolean,
            default: false,
            required: false
        },
        hasWindowBars: {
            type: Boolean,
            default: false,
            required: false
        },
        description: {
            type: String,
            trim: true,
            validate(value) {
                if (value.length > 400) throw new Error('Description cannot surpass 400 letters in length');
            }
        },
        furnitureDescription: {
            type: String,
            trim: true,
            validate(value) {
                if (value.length > 400) throw new Error('Description cannot surpass 400 letters in length');
            }
        }
    },
    price: {
        type: Number,
        required: true,
        min: 100000
    },
    size: {
        builtSqm: {
            type: Number,
            min: 0
        },
        totalSqm: {
            type: Number,
            min: 0,
            required: true
        }
    },
    entranceDate: {
        date: {
            type: Date,
            required: true,
            validate(value) {
                if (value < Date.now()) throw new Error('Entry date cannot be before today');
            }
        },
        isImmediate: {
            type: Boolean,
            default: false
        }
    },
    publishers: [{
        publisherName: {
            type: String,
            required: true,
            trim: true
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
        canBeInContactOnWeekends: {
            type: Boolean,
            default: true
        }
    }],
    contactEmail: {
        type: String,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) throw new Error('Email is not valid');
        }
    },
    publisher: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

apartmentSchema.virtual('files', {
    ref: 'FileModel',
    localField: '_id',
    foreignField: 'owner'
});

const ApartmentModel = mongoose.model('ApartmentModel', apartmentSchema);

module.exports = ApartmentModel;