const getApartmentObj = (propertiesObj, publishers, userId) => {
    return ({
        type: propertiesObj.type,
        condition: propertiesObj.condition,
        location: {
            town: propertiesObj.town,
            streetName: propertiesObj.streetName,
            houseNum: propertiesObj.houseNum,
            floor: propertiesObj.floor,
            buildingMaxFloor: propertiesObj.buildingMaxFloor
        },
        properties: {
            isStandingOnPolls: propertiesObj.isStandingOnPolls,
            numberOfRooms: propertiesObj.numberOfRooms,
            numberOfParkingSpots: propertiesObj.numberOfParkingSpots,
            numberOfBalconies: propertiesObj.numberOfBalconies,
            hasAirConditioning: propertiesObj.hasAirConditioning,
            hasFurniture: propertiesObj.hasFurniture,
            isRenovated: propertiesObj.isRenovated,
            hasSafeRoom: propertiesObj.hasSafeRoom,
            isAccessible: propertiesObj.isAccessible,
            hasKosherKitchen: propertiesObj.hasKosherKitchen,
            hasShed: propertiesObj.hasShed,
            hasLift: propertiesObj.hasLift,
            hasSunHeatedWaterTanks: propertiesObj.hasSunHeatedWaterTanks,
            hasPandorDoors: propertiesObj.hasPandorDoors,
            hasTadiranAc: propertiesObj.hasTadiranAc,
            hasWindowBars: propertiesObj.hasWindowBars,
            description: propertiesObj.description,
            furnitureDescription: propertiesObj.furnitureDescription
        },
        price: propertiesObj.price,
        size: {
            builtSqm: propertiesObj.builtSqm,
            totalSqm: propertiesObj.totalSqm
        },
        entranceDate: {
            date: propertiesObj.date,
            isImmediate: propertiesObj.isImmediate
        },
        publishers,
        contactEmail: propertiesObj.contactEmail,
        publisher: userId
    });
}

module.exports = getApartmentObj;