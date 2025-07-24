"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.getUserByEmail = getUserByEmail;
exports.getFacilities = getFacilities;
exports.getFacilitiesByManager = getFacilitiesByManager;
exports.getFacilityById = getFacilityById;
exports.createFacility = createFacility;
exports.updateFacility = updateFacility;
exports.deleteFacility = deleteFacility;
exports.getRoomsByFacilityManager = getRoomsByFacilityManager;
exports.getRoomsByFacilityId = getRoomsByFacilityId;
exports.getRooms = getRooms;
exports.getRoomById = getRoomById;
exports.createRoom = createRoom;
exports.updateRoom = updateRoom;
exports.deleteRoom = deleteRoom;
exports.getBookings = getBookings;
exports.getBookingsWithDetails = getBookingsWithDetails;
exports.getUserBookingsWithDetails = getUserBookingsWithDetails;
exports.getBookingsByUserId = getBookingsByUserId;
exports.getBookingById = getBookingById;
exports.createBooking = createBooking;
exports.updateBooking = updateBooking;
exports.getResources = getResources;
exports.getResourceById = getResourceById;
exports.createResource = createResource;
exports.updateResource = updateResource;
exports.deleteResource = deleteResource;
exports.getResourcesByFacility = getResourcesByFacility;
exports.adminGetAllUsers = adminGetAllUsers;
exports.adminGetAllBookings = adminGetAllBookings;
exports.adminCreateResource = adminCreateResource;
exports.checkBookingConflicts = checkBookingConflicts;
exports.getAvailableRooms = getAvailableRooms;
exports.assignResourceToRoom = assignResourceToRoom;
exports.removeResourceFromRoom = removeResourceFromRoom;
exports.removeAllResourcesFromRoom = removeAllResourcesFromRoom;
exports.getResourcesForRoom = getResourcesForRoom;
exports.getRoomsWithResource = getRoomsWithResource;
exports.uploadRoomImage = uploadRoomImage;
exports.deleteRoomImage = deleteRoomImage;
exports.getPendingBookingsByFacilityManager = getPendingBookingsByFacilityManager;
exports.getAllBookingsByFacilityManager = getAllBookingsByFacilityManager;
exports.getTodaysBookingsByFacilityManager = getTodaysBookingsByFacilityManager;
var supabase_1 = require("./supabase");
// Users
function getUsers() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('users')
                            .select('*')];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error fetching users:', error);
                        throw error;
                    }
                    return [2 /*return*/, data || []];
                case 2:
                    error_1 = _b.sent();
                    console.error('Exception in getUsers:', error_1);
                    throw error_1;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getUserById(id) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('users')
                            .select('*')
                            .eq('id', id)
                            .single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error fetching user ".concat(id, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, data];
                case 2:
                    error_2 = _b.sent();
                    console.error('Exception in getUserById:', error_2);
                    throw error_2;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getUserByEmail(email) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('users')
                            .select('*')
                            .eq('email', email)
                            .single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error fetching user by email ".concat(email, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, data];
                case 2:
                    error_3 = _b.sent();
                    console.error('Exception in getUserByEmail:', error_3);
                    throw error_3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Facilities
function getFacilities() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    console.log('Fetching all facilities...');
                    return [4 /*yield*/, supabase_1.supabase
                            .from('facilities')
                            .select('*')];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error fetching facilities:', error);
                        throw error;
                    }
                    if (data && data.length > 0) {
                        console.log("Found ".concat(data.length, " facilities:"));
                        data.forEach(function (facility) {
                            console.log("- Facility ID: ".concat(facility.id, ", Name: ").concat(facility.name, ", Location: ").concat(facility.location || 'N/A'));
                        });
                    }
                    else {
                        console.log('No facilities found in the database.');
                    }
                    return [2 /*return*/, data || []];
                case 2:
                    error_4 = _b.sent();
                    console.error('Exception in getFacilities:', error_4);
                    throw error_4;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getFacilitiesByManager(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_5;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('facilities')
                            .select('*')
                            .eq('manager_id', userId)];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error fetching facilities by manager:', error);
                        throw error;
                    }
                    return [2 /*return*/, data || []];
                case 2:
                    error_5 = _b.sent();
                    console.error('Exception in getFacilitiesByManager:', error_5);
                    throw error_5;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getFacilityById(id) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_6;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('facilities')
                            .select('*')
                            .eq('id', id)
                            .single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error fetching facility ".concat(id, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, data];
                case 2:
                    error_6 = _b.sent();
                    console.error('Exception in getFacilityById:', error_6);
                    throw error_6;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function createFacility(facilityInput) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_7;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('facilities')
                            .insert(facilityInput)
                            .select()
                            .single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error creating facility:', error);
                        throw error;
                    }
                    return [2 /*return*/, data];
                case 2:
                    error_7 = _b.sent();
                    console.error('Exception in createFacility:', error_7);
                    throw error_7;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function updateFacility(id, facilityInput) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_8;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('facilities')
                            .update(facilityInput)
                            .eq('id', id)
                            .select()
                            .single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error updating facility ".concat(id, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, data];
                case 2:
                    error_8 = _b.sent();
                    console.error('Exception in updateFacility:', error_8);
                    throw error_8;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function deleteFacility(id) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, rooms, roomsError, error, error_9;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('rooms')
                            .select('id')
                            .eq('facility_id', id)
                            .limit(1)];
                case 1:
                    _a = _b.sent(), rooms = _a.data, roomsError = _a.error;
                    if (roomsError) {
                        console.error("Error checking rooms for facility ".concat(id, ":"), roomsError);
                        throw roomsError;
                    }
                    if (rooms && rooms.length > 0) {
                        throw new Error('Cannot delete facility with associated rooms. Please delete or reassign rooms first.');
                    }
                    return [4 /*yield*/, supabase_1.supabase
                            .from('facilities')
                            .delete()
                            .eq('id', id)];
                case 2:
                    error = (_b.sent()).error;
                    if (error) {
                        console.error("Error deleting facility ".concat(id, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, true];
                case 3:
                    error_9 = _b.sent();
                    console.error('Exception in deleteFacility:', error_9);
                    throw error_9;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Rooms
// Helper function to get the IDs of rooms managed by a facility manager.
// Not exported, as it's only used by other functions in this file.
function getManagedRoomIds(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, facility, facilityError, _b, rooms, roomsError;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, supabase_1.supabase
                        .from('facilities')
                        .select('id')
                        .eq('manager_id', userId)
                        .single()];
                case 1:
                    _a = _c.sent(), facility = _a.data, facilityError = _a.error;
                    if (facilityError || !facility) {
                        // It's not an error if a manager has no facility, just return empty.
                        if (facilityError && facilityError.code !== 'PGRST116') { // PGRST116: "not found"
                            console.error("Error fetching facility for manager ".concat(userId, ":"), facilityError);
                            throw facilityError;
                        }
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, supabase_1.supabase
                            .from('rooms')
                            .select('id')
                            .eq('facility_id', facility.id)];
                case 2:
                    _b = _c.sent(), rooms = _b.data, roomsError = _b.error;
                    if (roomsError) {
                        console.error("Error fetching rooms for facility ".concat(facility.id, ":"), roomsError);
                        throw roomsError;
                    }
                    return [2 /*return*/, (rooms || []).map(function (r) { return r.id; })];
            }
        });
    });
}
function getRoomsByFacilityManager(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, facility, facilityError, _b, rooms, roomsError, normalizedRooms, error_10;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('facilities')
                            .select('id')
                            .eq('manager_id', userId)
                            .single()];
                case 1:
                    _a = _c.sent(), facility = _a.data, facilityError = _a.error;
                    if (facilityError || !facility) {
                        if (facilityError && facilityError.code !== 'PGRST116') {
                            console.error("Error fetching facility for manager ".concat(userId, ":"), facilityError);
                            throw facilityError;
                        }
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, supabase_1.supabase
                            .from('rooms')
                            .select("*, facilities!facility_id(id, name, location)")
                            .eq('facility_id', facility.id)];
                case 2:
                    _b = _c.sent(), rooms = _b.data, roomsError = _b.error;
                    if (roomsError) {
                        console.error("Error fetching rooms for facility ".concat(facility.id, ":"), roomsError);
                        throw roomsError;
                    }
                    normalizedRooms = rooms ? rooms.map(function (room) {
                        var normalizedFacility = null;
                        if (room.facilities) {
                            normalizedFacility = {
                                id: room.facilities.id,
                                name: room.facilities.name,
                                location: room.facilities.location
                            };
                        }
                        else if (room.facility_id) {
                            normalizedFacility = {
                                id: room.facility_id,
                                name: "Unknown Facility",
                                location: "Unknown Location"
                            };
                        }
                        return __assign(__assign({}, room), { facility: normalizedFacility, facilities: undefined });
                    }) : [];
                    return [2 /*return*/, normalizedRooms];
                case 3:
                    error_10 = _c.sent();
                    console.error('Exception in getRoomsByFacilityManager:', error_10);
                    throw error_10;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getRoomsByFacilityId(facilityId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, rooms, roomsError, normalizedRooms, error_11;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('rooms')
                            .select("*, facilities!facility_id(id, name, location)")
                            .eq('facility_id', facilityId)];
                case 1:
                    _a = _b.sent(), rooms = _a.data, roomsError = _a.error;
                    if (roomsError) {
                        console.error("Error fetching rooms for facility ".concat(facilityId, ":"), roomsError);
                        throw roomsError;
                    }
                    normalizedRooms = rooms ? rooms.map(function (room) {
                        var normalizedFacility = null;
                        if (room.facilities) {
                            normalizedFacility = {
                                id: room.facilities.id,
                                name: room.facilities.name,
                                location: room.facilities.location
                            };
                        }
                        else if (room.facility_id) {
                            normalizedFacility = {
                                id: room.facility_id,
                                name: "Unknown Facility",
                                location: "Unknown Location"
                            };
                        }
                        return __assign(__assign({}, room), { facility: normalizedFacility, facilities: undefined });
                    }) : [];
                    return [2 /*return*/, normalizedRooms];
                case 2:
                    error_11 = _b.sent();
                    console.error('Exception in getRoomsByFacilityId:', error_11);
                    throw error_11;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getRooms() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, rooms, roomsError, roomsWithFacility, roomsWithoutFacility, sampleRoom, _b, facilityData, facilityError, roomsWithResourceDetails, error_12;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    console.log('Fetching rooms with explicit facility join...');
                    return [4 /*yield*/, supabase_1.supabase
                            .from('rooms')
                            .select("\n        *,\n        facility:facilities!facility_id(id, name, location)\n      ")];
                case 1:
                    _a = _c.sent(), rooms = _a.data, roomsError = _a.error;
                    if (roomsError) {
                        console.error('Error fetching rooms:', roomsError);
                        throw roomsError;
                    }
                    if (!rooms || rooms.length === 0) {
                        console.log('No rooms found');
                        return [2 /*return*/, []];
                    }
                    console.log("Found ".concat(rooms.length, " rooms"));
                    roomsWithFacility = rooms.filter(function (room) { return room.facility && room.facility.name; });
                    roomsWithoutFacility = rooms.filter(function (room) { return !room.facility || !room.facility.name; });
                    console.log("Rooms with valid facility data: ".concat(roomsWithFacility.length));
                    console.log("Rooms with missing facility data: ".concat(roomsWithoutFacility.length));
                    if (!(roomsWithoutFacility.length > 0)) return [3 /*break*/, 3];
                    sampleRoom = roomsWithoutFacility[0];
                    console.log("Sample room with missing facility: Room ID ".concat(sampleRoom.id, ", Facility ID ").concat(sampleRoom.facility_id));
                    return [4 /*yield*/, supabase_1.supabase
                            .from('facilities')
                            .select('*')
                            .eq('id', sampleRoom.facility_id)
                            .single()];
                case 2:
                    _b = _c.sent(), facilityData = _b.data, facilityError = _b.error;
                    if (facilityError) {
                        console.error("Error fetching facility ".concat(sampleRoom.facility_id, ":"), facilityError);
                    }
                    else if (facilityData) {
                        console.log("Facility exists but join failed. Facility data:", facilityData);
                    }
                    else {
                        console.log("Facility with ID ".concat(sampleRoom.facility_id, " does not exist in the database."));
                    }
                    _c.label = 3;
                case 3: return [4 /*yield*/, Promise.all(rooms.map(function (room) { return __awaiter(_this, void 0, void 0, function () {
                        var facility, _a, resourceDetails, resourcesError;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    facility = null;
                                    if (room.facilities) {
                                        facility = {
                                            id: room.facilities.id,
                                            name: room.facilities.name,
                                            location: room.facilities.location
                                        };
                                    }
                                    else if (room.facility_id) {
                                        // If join failed but we have a facility_id, use placeholder
                                        facility = {
                                            id: room.facility_id,
                                            name: "Unknown Facility",
                                            location: "Unknown Location"
                                        };
                                    }
                                    // If the room has no resources, return as is
                                    if (!room.room_resources || room.room_resources.length === 0) {
                                        return [2 /*return*/, __assign(__assign({}, room), { facility: facility, facilities: undefined, resourceDetails: [] })];
                                    }
                                    return [4 /*yield*/, supabase_1.supabase
                                            .from('resources')
                                            .select('*')
                                            .in('id', room.room_resources)];
                                case 1:
                                    _a = _b.sent(), resourceDetails = _a.data, resourcesError = _a.error;
                                    if (resourcesError) {
                                        console.error("Error fetching resource details for room ".concat(room.id, ":"), resourcesError);
                                        return [2 /*return*/, __assign(__assign({}, room), { facility: facility, facilities: undefined, resourceDetails: [] })];
                                    }
                                    return [2 /*return*/, __assign(__assign({}, room), { facility: facility, facilities: undefined, resourceDetails: resourceDetails || [] })];
                            }
                        });
                    }); }))];
                case 4:
                    roomsWithResourceDetails = _c.sent();
                    return [2 /*return*/, roomsWithResourceDetails || []];
                case 5:
                    error_12 = _c.sent();
                    console.error('Exception in getRooms:', error_12);
                    throw error_12;
                case 6: return [2 /*return*/];
            }
        });
    });
}
function getRoomById(id) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, room, roomError, facility, _b, resourceDetails, resourcesError, error_13;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('rooms')
                            .select("\n        *,\n        facilities!facility_id (id, name, location)\n      ")
                            .eq('id', id)
                            .single()];
                case 1:
                    _a = _c.sent(), room = _a.data, roomError = _a.error;
                    if (roomError) {
                        console.error("Error fetching room ".concat(id, ":"), roomError);
                        throw roomError;
                    }
                    if (!room)
                        return [2 /*return*/, null
                            // Normalize facility property
                        ];
                    facility = null;
                    if (room.facilities) {
                        facility = {
                            id: room.facilities.id,
                            name: room.facilities.name,
                            location: room.facilities.location
                        };
                    }
                    else if (room.facility_id) {
                        facility = {
                            id: room.facility_id,
                            name: "Unknown Facility",
                            location: "Unknown Location"
                        };
                    }
                    // If the room has no resources, return as is
                    if (!room.room_resources || room.room_resources.length === 0) {
                        return [2 /*return*/, __assign(__assign({}, room), { facility: facility, facilities: undefined, resourceDetails: [] })];
                    }
                    return [4 /*yield*/, supabase_1.supabase
                            .from('resources')
                            .select('*')
                            .in('id', room.room_resources)];
                case 2:
                    _b = _c.sent(), resourceDetails = _b.data, resourcesError = _b.error;
                    if (resourcesError) {
                        console.error("Error fetching resource details for room ".concat(id, ":"), resourcesError);
                        return [2 /*return*/, __assign(__assign({}, room), { facility: facility, facilities: undefined, resourceDetails: [] })];
                    }
                    return [2 /*return*/, __assign(__assign({}, room), { facility: facility, facilities: undefined, resourceDetails: resourceDetails || [] })];
                case 3:
                    error_13 = _c.sent();
                    console.error('Exception in getRoomById:', error_13);
                    throw error_13;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function createRoom(roomInput) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, room, error, error_14;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('rooms')
                            .insert({
                            name: roomInput.name,
                            location: roomInput.location,
                            capacity: roomInput.capacity,
                            room_resources: roomInput.room_resources || [],
                            status: roomInput.status || 'available',
                            image: roomInput.image || null,
                            description: roomInput.description || null,
                            facility_id: roomInput.facility_id, // Add this line
                        })
                            .select()
                            .single()];
                case 1:
                    _a = _b.sent(), room = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error creating room:', error);
                        throw error;
                    }
                    // Return the room with resource details
                    return [2 /*return*/, getRoomById(room.id)];
                case 2:
                    error_14 = _b.sent();
                    console.error('Exception in createRoom:', error_14);
                    throw error_14;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function updateRoom(id, roomInput) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, room, error, error_15;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('rooms')
                            .update({
                            name: roomInput.name,
                            location: roomInput.location,
                            capacity: roomInput.capacity,
                            room_resources: roomInput.room_resources,
                            status: roomInput.status,
                            image: roomInput.image,
                            description: roomInput.description
                        })
                            .eq('id', id)
                            .select()
                            .single()];
                case 1:
                    _a = _b.sent(), room = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error updating room ".concat(id, ":"), error);
                        throw error;
                    }
                    // Return the room with resource details
                    return [2 /*return*/, getRoomById(id)];
                case 2:
                    error_15 = _b.sent();
                    console.error('Exception in updateRoom:', error_15);
                    throw error_15;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function deleteRoom(id) {
    return __awaiter(this, void 0, void 0, function () {
        var currentDate, _a, activeBookings, bookingError, error, error_16;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    currentDate = new Date().toISOString();
                    return [4 /*yield*/, supabase_1.supabase
                            .from('bookings')
                            .select('id')
                            .eq('room_id', id)
                            .neq('status', 'cancelled') // Exclude cancelled bookings
                            .gt('end_time', currentDate) // Only include future or ongoing bookings
                            .limit(1)];
                case 1:
                    _a = _b.sent(), activeBookings = _a.data, bookingError = _a.error;
                    if (bookingError) {
                        console.error("Error checking bookings for room ".concat(id, ":"), bookingError);
                        throw bookingError;
                    }
                    // If there are active or future bookings, don't allow deletion
                    if (activeBookings && activeBookings.length > 0) {
                        throw new Error('Cannot delete room with active or future bookings. Cancel all active bookings first.');
                    }
                    return [4 /*yield*/, supabase_1.supabase
                            .from('rooms')
                            .delete()
                            .eq('id', id)];
                case 2:
                    error = (_b.sent()).error;
                    if (error) {
                        console.error("Error deleting room ".concat(id, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, true];
                case 3:
                    error_16 = _b.sent();
                    console.error('Exception in deleteRoom:', error_16);
                    throw error_16;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Bookings
function getBookings() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_17;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('bookings')
                            .select('*')];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error fetching bookings:', error);
                        throw error;
                    }
                    return [2 /*return*/, data || []];
                case 2:
                    error_17 = _b.sent();
                    console.error('Exception in getBookings:', error_17);
                    throw error_17;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getBookingsWithDetails() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_18;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('bookings')
                            .select("\n        *,\n        rooms:room_id(id, name, location, capacity),\n        users:user_id(id, name, email)\n      ")];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error fetching bookings with details:', error);
                        throw error;
                    }
                    return [2 /*return*/, data || []];
                case 2:
                    error_18 = _b.sent();
                    console.error('Exception in getBookingsWithDetails:', error_18);
                    throw error_18;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getUserBookingsWithDetails(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, bookings, error_19;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    if (!userId) {
                        console.warn('getUserBookingsWithDetails called with empty userId');
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, supabase_1.supabase
                            .from('bookings')
                            .select("\n        *,\n        rooms:room_id(id, name, location, capacity),\n        users:user_id(id, name, email)\n      ")
                            .eq('user_id', userId)
                            .order('created_at', { ascending: false })];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error fetching bookings with details for user ".concat(userId, ":"), error);
                        throw error;
                    }
                    bookings = data || [];
                    console.log("Fetched ".concat(bookings.length, " bookings for user ").concat(userId));
                    return [2 /*return*/, bookings];
                case 2:
                    error_19 = _b.sent();
                    console.error('Exception in getUserBookingsWithDetails:', error_19);
                    // Return empty array instead of throwing to prevent UI errors
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getBookingsByUserId(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_20;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('bookings')
                            .select('*')
                            .eq('user_id', userId)];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error fetching bookings for user ".concat(userId, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, data || []];
                case 2:
                    error_20 = _b.sent();
                    console.error('Exception in getBookingsByUserId:', error_20);
                    throw error_20;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getBookingById(id) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_21;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('bookings')
                            .select('*')
                            .eq('id', id)
                            .single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error fetching booking ".concat(id, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, data];
                case 2:
                    error_21 = _b.sent();
                    console.error('Exception in getBookingById:', error_21);
                    throw error_21;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function createBooking(bookingData) {
    return __awaiter(this, void 0, void 0, function () {
        var newBooking, client, _a, data, error, error_22;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    // Ensure all required fields are present
                    if (!bookingData.room_id)
                        throw new Error('room_id is required');
                    if (!bookingData.user_id)
                        throw new Error('user_id is required');
                    if (!bookingData.title)
                        throw new Error('title is required');
                    if (!bookingData.start_time)
                        throw new Error('start_time is required');
                    if (!bookingData.end_time)
                        throw new Error('end_time is required');
                    newBooking = __assign(__assign({}, bookingData), { created_at: new Date().toISOString(), updated_at: new Date().toISOString(), 
                        // Ensure status is set
                        status: bookingData.status || 'pending' });
                    console.log("Creating booking: ".concat(JSON.stringify(newBooking, null, 2)));
                    client = (0, supabase_1.createAdminClient)();
                    return [4 /*yield*/, client
                            .from('bookings')
                            .insert(newBooking)
                            .select()
                            .single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error creating booking:', error);
                        throw new Error("Database error: ".concat(error.message));
                    }
                    if (!data) {
                        throw new Error('No data returned after booking creation');
                    }
                    console.log("Successfully created booking with ID: ".concat(data.id));
                    return [2 /*return*/, data];
                case 2:
                    error_22 = _b.sent();
                    console.error('Exception in createBooking:', error_22);
                    throw error_22;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function updateBooking(id, bookingData) {
    return __awaiter(this, void 0, void 0, function () {
        var updates, _a, data, error, error_23;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    updates = __assign(__assign({}, bookingData), { updated_at: new Date().toISOString() });
                    return [4 /*yield*/, supabase_1.supabase
                            .from('bookings')
                            .update(updates)
                            .eq('id', id)
                            .select()
                            .single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error updating booking ".concat(id, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, data];
                case 2:
                    error_23 = _b.sent();
                    console.error('Exception in updateBooking:', error_23);
                    throw error_23;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Resources
function getResources() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_24;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('resources')
                            .select('*')];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error fetching resources:', error);
                        throw error;
                    }
                    return [2 /*return*/, data || []];
                case 2:
                    error_24 = _b.sent();
                    console.error('Exception in getResources:', error_24);
                    throw error_24;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getResourceById(id) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_25;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('resources')
                            .select('*')
                            .eq('id', id)
                            .single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error fetching resource ".concat(id, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, data];
                case 2:
                    error_25 = _b.sent();
                    console.error('Exception in getResourceById:', error_25);
                    throw error_25;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function createResource(resourceData) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_26;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('resources')
                            .insert(resourceData)
                            .select()
                            .single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error creating resource:', error);
                        throw error;
                    }
                    return [2 /*return*/, data];
                case 2:
                    error_26 = _b.sent();
                    console.error('Exception in createResource:', error_26);
                    throw error_26;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function updateResource(id, resourceData) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_27;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('resources')
                            .update(resourceData)
                            .eq('id', id)
                            .select()
                            .single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error updating resource ".concat(id, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, data];
                case 2:
                    error_27 = _b.sent();
                    console.error('Exception in updateResource:', error_27);
                    throw error_27;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function deleteResource(id) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, bookings, bookingError, error, error_28;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('bookings')
                            .select('id')
                            .contains('resources', [id])
                            .limit(1)];
                case 1:
                    _a = _b.sent(), bookings = _a.data, bookingError = _a.error;
                    if (bookingError) {
                        console.error("Error checking bookings for resource ".concat(id, ":"), bookingError);
                        throw bookingError;
                    }
                    // If there are bookings using this resource, don't allow deletion
                    if (bookings && bookings.length > 0) {
                        throw new Error('Cannot delete resource that is being used in bookings');
                    }
                    return [4 /*yield*/, supabase_1.supabase
                            .from('resources')
                            .delete()
                            .eq('id', id)];
                case 2:
                    error = (_b.sent()).error;
                    if (error) {
                        console.error("Error deleting resource ".concat(id, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, true];
                case 3:
                    error_28 = _b.sent();
                    console.error('Exception in deleteResource:', error_28);
                    throw error_28;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getResourcesByFacility(facilityId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_29;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('resources')
                            .select('*')
                            .eq('facility_id', facilityId)];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error fetching resources for facility ".concat(facilityId, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, data || []];
                case 2:
                    error_29 = _b.sent();
                    console.error('Exception in getResourcesByFacility:', error_29);
                    throw error_29;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Admin operations - using admin client to bypass RLS
function adminGetAllUsers() {
    return __awaiter(this, void 0, void 0, function () {
        var adminClient, _a, data, error, error_30;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    adminClient = (0, supabase_1.createAdminClient)();
                    return [4 /*yield*/, adminClient
                            .from('users')
                            .select('*')];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Admin error fetching users:', error);
                        throw error;
                    }
                    return [2 /*return*/, data || []];
                case 2:
                    error_30 = _b.sent();
                    console.error('Exception in adminGetAllUsers:', error_30);
                    throw error_30;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function adminGetAllBookings() {
    return __awaiter(this, void 0, void 0, function () {
        var adminClient, _a, data, error, error_31;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    adminClient = (0, supabase_1.createAdminClient)();
                    return [4 /*yield*/, adminClient
                            .from('bookings')
                            .select('*')];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Admin error fetching bookings:', error);
                        throw error;
                    }
                    return [2 /*return*/, data || []];
                case 2:
                    error_31 = _b.sent();
                    console.error('Exception in adminGetAllBookings:', error_31);
                    throw error_31;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function adminCreateResource(resourceData) {
    return __awaiter(this, void 0, void 0, function () {
        var adminClient, _a, data, error, error_32;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    adminClient = (0, supabase_1.createAdminClient)();
                    return [4 /*yield*/, adminClient
                            .from('resources')
                            .insert(resourceData)
                            .select()
                            .single()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error creating resource:', error);
                        throw error;
                    }
                    return [2 /*return*/, data];
                case 2:
                    error_32 = _b.sent();
                    console.error('Exception in adminCreateResource:', error_32);
                    throw error_32;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Check for booking conflicts
function checkBookingConflicts(room_id, start_time, end_time, excludeBookingId) {
    return __awaiter(this, void 0, void 0, function () {
        var query, _a, data, error, newStart_1, newEnd_1, bufferMs_1, hasConflict, error_33;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    query = supabase_1.supabase
                        .from('bookings')
                        .select('id, start_time, end_time')
                        .eq('room_id', room_id)
                        .in('status', ['confirmed', 'pending']);
                    if (excludeBookingId) {
                        query = query.neq('id', excludeBookingId);
                    }
                    return [4 /*yield*/, query];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error checking booking conflicts:', error);
                        throw error;
                    }
                    newStart_1 = new Date(start_time);
                    newEnd_1 = new Date(end_time);
                    bufferMs_1 = 30 * 60 * 1000;
                    hasConflict = (data || []).some(function (booking) {
                        var existingStart = new Date(booking.start_time);
                        var existingEnd = new Date(booking.end_time);
                        var bufferEnd = new Date(existingEnd.getTime() + bufferMs_1);
                        // New booking cannot start before bufferEnd of existing booking
                        // and cannot end after existingStart
                        // Overlap if: newStart < bufferEnd && newEnd > existingStart
                        return newStart_1 < bufferEnd && newEnd_1 > existingStart;
                    });
                    return [2 /*return*/, hasConflict];
                case 2:
                    error_33 = _b.sent();
                    console.error('Exception in checkBookingConflicts:', error_33);
                    throw error_33;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Get available rooms for a time period
function getAvailableRooms(start_time, end_time) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, rooms, roomsError, _b, bookings, bookingsError, bookedRoomIds_1, error_34;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('rooms')
                            .select('*')
                            .eq('status', 'available')];
                case 1:
                    _a = _c.sent(), rooms = _a.data, roomsError = _a.error;
                    if (roomsError) {
                        console.error('Error fetching available rooms:', roomsError);
                        throw roomsError;
                    }
                    if (!rooms || rooms.length === 0) {
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, supabase_1.supabase
                            .from('bookings')
                            .select('room_id')
                            .eq('status', 'confirmed')
                            .or("start_time.gte.".concat(start_time, ",end_time.gt.").concat(start_time))
                            .or("start_time.lt.".concat(end_time, ",end_time.lte.").concat(end_time))
                            .or("start_time.lte.".concat(start_time, ",end_time.gte.").concat(end_time))];
                case 2:
                    _b = _c.sent(), bookings = _b.data, bookingsError = _b.error;
                    if (bookingsError) {
                        console.error('Error fetching conflicting bookings:', bookingsError);
                        throw bookingsError;
                    }
                    bookedRoomIds_1 = new Set((bookings || []).map(function (b) { return b.room_id; }));
                    return [2 /*return*/, rooms.filter(function (room) { return !bookedRoomIds_1.has(room.id); })];
                case 3:
                    error_34 = _c.sent();
                    console.error('Exception in getAvailableRooms:', error_34);
                    throw error_34;
                case 4: return [2 /*return*/];
            }
        });
    });
}
// New function to assign a resource to a room
function assignResourceToRoom(roomId_1, resourceId_1) {
    return __awaiter(this, arguments, void 0, function (roomId, resourceId, quantity) {
        var _a, existing, checkError, error, _b, data, error, error_35;
        if (quantity === void 0) { quantity = 1; }
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 6, , 7]);
                    console.log("Attempting to assign resource ".concat(resourceId, " to room ").concat(roomId, " with quantity ").concat(quantity));
                    return [4 /*yield*/, supabase_1.supabase
                            .from('room_resources')
                            .select('id')
                            .eq('room_id', roomId)
                            .eq('resource_id', resourceId)
                            .single()];
                case 1:
                    _a = _c.sent(), existing = _a.data, checkError = _a.error;
                    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
                        console.error('Error checking existing room resource:', checkError);
                        throw checkError;
                    }
                    if (!existing) return [3 /*break*/, 3];
                    console.log("Resource ".concat(resourceId, " already assigned to room ").concat(roomId, ", updating quantity to ").concat(quantity));
                    return [4 /*yield*/, supabase_1.supabase
                            .from('room_resources')
                            .update({ quantity: quantity })
                            .eq('id', existing.id)];
                case 2:
                    error = (_c.sent()).error;
                    if (error) {
                        console.error('Error updating room resource:', error);
                        throw error;
                    }
                    return [3 /*break*/, 5];
                case 3:
                    console.log("Creating new assignment for resource ".concat(resourceId, " to room ").concat(roomId));
                    return [4 /*yield*/, supabase_1.supabase
                            .from('room_resources')
                            .insert({
                            room_id: roomId,
                            resource_id: resourceId,
                            quantity: quantity
                        })];
                case 4:
                    _b = _c.sent(), data = _b.data, error = _b.error;
                    if (error) {
                        console.error('Error assigning resource to room:', error);
                        console.error('Error details:', JSON.stringify(error));
                        throw error;
                    }
                    console.log('Resource assignment successful:', data);
                    _c.label = 5;
                case 5: return [2 /*return*/, true];
                case 6:
                    error_35 = _c.sent();
                    console.error('Exception in assignResourceToRoom:', error_35);
                    throw error_35;
                case 7: return [2 /*return*/];
            }
        });
    });
}
// New function to remove a resource from a room
function removeResourceFromRoom(roomId, resourceId) {
    return __awaiter(this, void 0, void 0, function () {
        var error, error_36;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('room_resources')
                            .delete()
                            .eq('room_id', roomId)
                            .eq('resource_id', resourceId)];
                case 1:
                    error = (_a.sent()).error;
                    if (error) {
                        console.error('Error removing resource from room:', error);
                        throw error;
                    }
                    return [2 /*return*/, true];
                case 2:
                    error_36 = _a.sent();
                    console.error('Exception in removeResourceFromRoom:', error_36);
                    throw error_36;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// New function to remove all resources from a room
function removeAllResourcesFromRoom(roomId) {
    return __awaiter(this, void 0, void 0, function () {
        var error, error_37;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('room_resources')
                            .delete()
                            .eq('room_id', roomId)];
                case 1:
                    error = (_a.sent()).error;
                    if (error) {
                        console.error('Error removing all resources from room:', error);
                        throw error;
                    }
                    return [2 /*return*/, true];
                case 2:
                    error_37 = _a.sent();
                    console.error('Exception in removeAllResourcesFromRoom:', error_37);
                    throw error_37;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// New function to get resources for a specific room
function getResourcesForRoom(roomId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error, error_38;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('room_resources')
                            .select("\n        resource_id,\n        quantity,\n        resources:resource_id (\n          id,\n          name,\n          type,\n          status,\n          description\n        )\n      ")
                            .eq('room_id', roomId)];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error fetching resources for room ".concat(roomId, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, data.map(function (item) { return (__assign(__assign({}, item.resources), { quantity: item.quantity })); }) || []];
                case 2:
                    error_38 = _b.sent();
                    console.error('Exception in getResourcesForRoom:', error_38);
                    throw error_38;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// New function to get rooms that have a specific resource
function getRoomsWithResource(resourceId) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, rooms, error, error_39;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase_1.supabase
                            .from('rooms')
                            .select('*')
                            .contains('room_resources', [resourceId])];
                case 1:
                    _a = _b.sent(), rooms = _a.data, error = _a.error;
                    if (error) {
                        console.error("Error fetching rooms with resource ".concat(resourceId, ":"), error);
                        throw error;
                    }
                    return [2 /*return*/, rooms || []];
                case 2:
                    error_39 = _b.sent();
                    console.error('Exception in getRoomsWithResource:', error_39);
                    throw error_39;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Image upload functions
function uploadRoomImage(file) {
    return __awaiter(this, void 0, void 0, function () {
        var fileExt, fileName, filePath, _a, data, error, publicUrlData, error_40;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    fileExt = file.name.split('.').pop();
                    fileName = "".concat(Date.now(), "-").concat(Math.random().toString(36).substring(2, 15), ".").concat(fileExt);
                    filePath = "room-images/".concat(fileName);
                    console.log("Attempting to upload file to path: ".concat(filePath));
                    return [4 /*yield*/, supabase_1.supabase
                            .storage
                            .from('conference-hub')
                            .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: true // Changed from false to true
                        })];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error uploading image:', error);
                        throw error;
                    }
                    console.log('File uploaded successfully:', data);
                    publicUrlData = supabase_1.supabase
                        .storage
                        .from('conference-hub')
                        .getPublicUrl(data.path).data;
                    console.log('Generated public URL:', publicUrlData);
                    return [2 /*return*/, publicUrlData.publicUrl];
                case 2:
                    error_40 = _b.sent();
                    console.error('Exception in uploadRoomImage:', error_40);
                    throw error_40;
                case 3: return [2 /*return*/];
            }
        });
    });
}
function deleteRoomImage(imageUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var baseUrl, path, error, error_41;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    baseUrl = supabase_1.supabase.storage.from('conference-hub').getPublicUrl('').data.publicUrl;
                    path = imageUrl.replace(baseUrl, '');
                    return [4 /*yield*/, supabase_1.supabase
                            .storage
                            .from('conference-hub')
                            .remove([path])];
                case 1:
                    error = (_a.sent()).error;
                    if (error) {
                        console.error('Error deleting image:', error);
                        throw error;
                    }
                    return [2 /*return*/, true];
                case 2:
                    error_41 = _a.sent();
                    console.error('Exception in deleteRoomImage:', error_41);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getPendingBookingsByFacilityManager(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var roomIds, _a, data, error, error_42;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, getManagedRoomIds(userId)];
                case 1:
                    roomIds = _b.sent();
                    if (roomIds.length === 0) {
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, supabase_1.supabase
                            .from('bookings')
                            .select("\n        *,\n        rooms:room_id(id, name, location, capacity),\n        users:user_id(id, name, email)\n      ")
                            .in('room_id', roomIds)
                            .eq('status', 'pending')];
                case 2:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error fetching pending bookings:', error);
                        throw error;
                    }
                    return [2 /*return*/, data || []];
                case 3:
                    error_42 = _b.sent();
                    console.error('Exception in getPendingBookingsByFacilityManager:', error_42);
                    throw error_42;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getAllBookingsByFacilityManager(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var roomIds, _a, data, error, error_43;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, getManagedRoomIds(userId)];
                case 1:
                    roomIds = _b.sent();
                    if (roomIds.length === 0) {
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, supabase_1.supabase
                            .from('bookings')
                            .select("\n              *,\n              rooms:room_id(id, name, location, capacity),\n              users:user_id(id, name, email)\n          ")
                            .in('room_id', roomIds)
                            .order('start_time', { ascending: false })];
                case 2:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error fetching bookings:', error);
                        throw error;
                    }
                    return [2 /*return*/, data || []];
                case 3:
                    error_43 = _b.sent();
                    console.error('Exception in getAllBookingsByFacilityManager:', error_43);
                    throw error_43;
                case 4: return [2 /*return*/];
            }
        });
    });
}
function getTodaysBookingsByFacilityManager(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var roomIds, today, startOfDay, endOfDay, _a, data, error, error_44;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, getManagedRoomIds(userId)];
                case 1:
                    roomIds = _b.sent();
                    if (roomIds.length === 0) {
                        return [2 /*return*/, []];
                    }
                    today = new Date();
                    startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
                    endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();
                    return [4 /*yield*/, supabase_1.supabase
                            .from('bookings')
                            .select("\n        *,\n        rooms:room_id(id, name, location, capacity),\n        users:user_id(id, name, email)\n      ")
                            .in('room_id', roomIds)
                            .eq('status', 'confirmed')
                            .gte('start_time', startOfDay)
                            .lte('start_time', endOfDay)
                            .order('start_time', { ascending: true })];
                case 2:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error('Error fetching today\'s bookings:', error);
                        throw error;
                    }
                    return [2 /*return*/, data || []];
                case 3:
                    error_44 = _b.sent();
                    console.error('Exception in getTodaysBookingsByFacilityManager:', error_44);
                    throw error_44;
                case 4: return [2 /*return*/];
            }
        });
    });
}
