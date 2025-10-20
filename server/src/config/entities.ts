import IdCounter from "../database/entities/IdCounter";
import Setting from "../database/entities/Setting";
import Role from "../database/entities/Role";
import Permission from "../database/entities/Permission";
import Location from "../database/entities/Location";
import Vendor from "../database/entities/Vendor";
import User from "../database/entities/User";
import Driver from "../database/entities/Driver";
import Vehicle from "../database/entities/Vehicle";
import OutsourceVehicle from "../database/entities/OutsourcedVehicle";
import BookingRequest from "../database/entities/BookingRequest";
import OneWayBookingRequest from "../database/entities/OneWayBookingRequest";
import RoundTripBookingRequest from "../database/entities/RoundTripBookingRequest";
import Trip from "../database/entities/Trip";
import TripTicket from "../database/entities/TripTicket";
import TripStop from "../database/entities/TripStop";
import TripFeedback from "../database/entities/TripFeedback";
import PublicTripAccess from "../database/entities/PublicTripAccess";
import LeaveRequest from "../database/entities/LeaveRequest";
import VehicleService from "../database/entities/VehicleService";
import Schedule from "../database/entities/Schedule";
import Expense from "../database/entities/Expense";
import ExecutiveVehicleActivity from "../database/entities/ExecutiveVehicleActivity";
import Notification from "../database/entities/Notification";
import ActivityLog from "../database/entities/ActivityLog";

const AppEntities = [
	IdCounter,
	Setting,
	Role,
	Permission,
	Location,
	Vendor,
	User,
	Driver,
	Vehicle,
	OutsourceVehicle,
	BookingRequest,
	OneWayBookingRequest,
	RoundTripBookingRequest,
	Trip,
	TripTicket,
	TripStop,
	TripFeedback,
	PublicTripAccess,
	LeaveRequest,
	VehicleService,
	Schedule,
	Expense,
	ExecutiveVehicleActivity,
	Notification,
	ActivityLog,
];

export default AppEntities;
