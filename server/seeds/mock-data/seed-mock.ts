import "reflect-metadata";
import Container from "typedi";
import { plainToInstance } from "class-transformer";
import AppDataSource from "../../src/config/database";
import SettingMap from "../../src/constants/setting-map";
import SettingService from "../../src/services/setting.service";
import LocationService from "../../src/services/location.service";
import VendorService from "../../src/services/vendor.service";
import UserService from "../../src/services/user.service";
import DriverService from "../../src/services/driver.service";
import VehicleService from "../../src/services/vehicle.service";
import OutsourcedVehicleService from "../../src/services/outsourced-vehicle.service";
import ScheduleService from "../../src/services/schedule.service";
import LeaveRequestService from "../../src/services/leave-request.service";
import VehicleServiceService from "../../src/services/vehicle-service.service";
import ExpenseService from "../../src/services/expense.service";
import BookingRequestService from "../../src/services/booking-request.service";
import CreateLocationDto from "../../src/dtos/location/create-location.dto";
import CreateVendorDto from "../../src/dtos/vendor/create-vendor.dto";
import CreateUserDto from "../../src/dtos/user/create-user.dto";
import CreateDriverDto from "../../src/dtos/driver/create-driver.dto";
import CreateVehicleDto from "../../src/dtos/vehicle/create-vehicle.dto";
import CreateOutsourcedVehicleDto from "../../src/dtos/outsourced-vehicle/create-outsourced-vehicle.dto";
import CreateScheduleDto from "../../src/dtos/schedule/create-schedule.dto";
import CreateLeaveRequestDto from "../../src/dtos/leave-request/create-leave-request.dto";
import CreateVehicleServiceDto from "../../src/dtos/vehicle-service/create-vehicle-service.dto";
import CreateExpenseDto from "../../src/dtos/expense/create-expense.dto";
import CreateBookingRequestDto from "../../src/dtos/booking-request/create-booking-request.dto";
import CurrentUser from "../../src/templates/current-user";
import logger from "../../src/utils/logger";
import locations from "./data/locations.json";
import vendors from "./data/vendors.json";
import users from "./data/users.json";
import drivers from "./data/drivers.json";
import vehicles from "./data/vehicles.json";
import outsourcedVehicles from "./data/outsourced-vehicles.json";
import schedules from "./data/schedules.json";
import leaveRequests from "./data/leave-requests.json";
import vehicleServices from "./data/vehicle-services.json";
import expenses from "./data/expenses.json";
import bookingRequests from "./data/booking-requests.json";

const settingService: SettingService = Container.get(SettingService);
const locationService: LocationService = Container.get(LocationService);
const vendorService: VendorService = Container.get(VendorService);
const userService: UserService = Container.get(UserService);
const driverService: DriverService = Container.get(DriverService);
const vehicleService: VehicleService = Container.get(VehicleService);
const outsourcedVehicleService: OutsourcedVehicleService = Container.get(
	OutsourcedVehicleService,
);
const scheduleService: ScheduleService = Container.get(ScheduleService);
const leaveRequestService: LeaveRequestService =
	Container.get(LeaveRequestService);
const vehicleServiceService: VehicleServiceService = Container.get(
	VehicleServiceService,
);
const expenseService: ExpenseService = Container.get(ExpenseService);
const bookingRequestService: BookingRequestService = Container.get(
	BookingRequestService,
);

const seedLocations = async (currentUser: CurrentUser) => {
	// Transform the location data into DTOs
	const locationDtos: CreateLocationDto[] = plainToInstance(
		CreateLocationDto,
		locations,
		{
			excludeExtraneousValues: true,
		},
	);

	// Create locations
	for (const locationDto of locationDtos) {
		await locationService.createLocation(currentUser, locationDto);
	}
};

const seedVendors = async (currentUser: CurrentUser) => {
	// Transform the vendor data into DTOs
	const vendorDtos: CreateVendorDto[] = plainToInstance(
		CreateVendorDto,
		vendors,
		{
			excludeExtraneousValues: true,
		},
	);

	// Create vendors
	for (const vendorDto of vendorDtos) {
		await vendorService.createVendor(currentUser, vendorDto);
	}
};

const seedUsers = async (currentUser: CurrentUser) => {
	// Transform the user data into DTOs
	const userDtos: CreateUserDto[] = plainToInstance(CreateUserDto, users, {
		excludeExtraneousValues: true,
	});

	// Create users
	for (const userDto of userDtos) {
		await userService.createUser(currentUser, userDto);
	}
};

const seedDrivers = async (currentUser: CurrentUser) => {
	// Transform the driver data into DTOs
	const driverDtos: CreateDriverDto[] = plainToInstance(
		CreateDriverDto,
		drivers,
		{
			excludeExtraneousValues: true,
		},
	);

	// Create drivers
	for (const driverDto of driverDtos) {
		await driverService.createDriver(currentUser, driverDto);
	}
};

const seedVehicles = async (currentUser: CurrentUser) => {
	// Transform the vehicle data into DTOs
	const vehicleDtos: CreateVehicleDto[] = plainToInstance(
		CreateVehicleDto,
		vehicles,
		{
			excludeExtraneousValues: true,
		},
	);

	// Create vehicles
	for (const vehicleDto of vehicleDtos) {
		await vehicleService.createVehicle(currentUser, vehicleDto);
	}
};

const seedOutsourcedVehicles = async (currentUser: CurrentUser) => {
	// Transform the outsourced vehicle data into DTOs
	const outsourcedVehicleDtos: CreateOutsourcedVehicleDto[] = plainToInstance(
		CreateOutsourcedVehicleDto,
		outsourcedVehicles,
		{
			excludeExtraneousValues: true,
		},
	);

	// Create outsourced vehicles
	for (const outsourcedVehicleDto of outsourcedVehicleDtos) {
		await outsourcedVehicleService.createOutsourcedVehicle(
			currentUser,
			outsourcedVehicleDto,
		);
	}
};

const seedSchedules = async (currentUser: CurrentUser) => {
	// Transform the schedule data into DTOs
	const scheduleDtos: CreateScheduleDto[] = plainToInstance(
		CreateScheduleDto,
		schedules,
		{
			excludeExtraneousValues: true,
		},
	);

	// Create schedules
	for (const scheduleDto of scheduleDtos) {
		await scheduleService.createSchedule(currentUser, scheduleDto);
	}
};

const seedLeaveRequests = async (currentUser: CurrentUser) => {
	// Transform the leave request data into DTOs
	const leaveRequestDtos: CreateLeaveRequestDto[] = plainToInstance(
		CreateLeaveRequestDto,
		leaveRequests,
		{
			excludeExtraneousValues: true,
		},
	);

	// Create leave requests
	for (const leaveRequestDto of leaveRequestDtos) {
		await leaveRequestService.createLeaveRequest(
			currentUser,
			leaveRequestDto,
		);
	}
};

const seedVehicleServices = async (currentUser: CurrentUser) => {
	// Transform the vehicle service data into DTOs
	const vehicleServiceDtos: CreateVehicleServiceDto[] = plainToInstance(
		CreateVehicleServiceDto,
		vehicleServices,
		{
			excludeExtraneousValues: true,
		},
	);

	// Create vehicle services
	for (const vehicleServiceDto of vehicleServiceDtos) {
		await vehicleServiceService.createVehicleService(
			currentUser,
			vehicleServiceDto,
		);
	}
};

const seedExpenses = async (currentUser: CurrentUser) => {
	// Transform the expense data into DTOs
	const expenseDtos: CreateExpenseDto[] = plainToInstance(
		CreateExpenseDto,
		expenses,
		{
			excludeExtraneousValues: true,
		},
	);

	// Create expenses
	for (const expenseDto of expenseDtos) {
		await expenseService.createExpense(currentUser, expenseDto);
	}
};

const seedBookingRequests = async (currentUser: CurrentUser) => {
	// Transform the booking request data into DTOs
	const bookingRequestDtos: CreateBookingRequestDto[] = plainToInstance(
		CreateBookingRequestDto,
		bookingRequests,
		{
			excludeExtraneousValues: true,
		},
	);

	// Create booking requests
	for (const bookingRequestDto of bookingRequestDtos) {
		await bookingRequestService.createBookingRequest(
			currentUser,
			bookingRequestDto,
		);
	}
};

const seedMockData = async () => {
	try {
		await AppDataSource.initialize();
		const currentUser: CurrentUser = new CurrentUser("USR-1", "admin");

		// Disable notification and activity log before seeding
		const notificationEnabled = await settingService.getSettingByKey(
			SettingMap.NOTIFICATION_ENABLED,
		);
		await settingService.updateSetting(
			currentUser,
			notificationEnabled.id,
			{ value: "false" },
		);
		const activityLogEnabled = await settingService.getSettingByKey(
			SettingMap.ACTIVITY_LOG_ENABLED,
		);
		await settingService.updateSetting(currentUser, activityLogEnabled.id, {
			value: "false",
		});

		// Seed mock data
		await seedLocations(currentUser);
		await seedVendors(currentUser);
		await seedUsers(currentUser);
		await seedDrivers(currentUser);
		await seedVehicles(currentUser);
		await seedOutsourcedVehicles(currentUser);
		await seedSchedules(currentUser);
		await seedLeaveRequests(currentUser);
		await seedVehicleServices(currentUser);
		await seedExpenses(currentUser);
		await seedBookingRequests(currentUser);

		// Enable notification and activity log after seeding
		await settingService.updateSetting(
			currentUser,
			notificationEnabled.id,
			{ value: "true" },
		);
		await settingService.updateSetting(currentUser, activityLogEnabled.id, {
			value: "true",
		});
		logger.info("Mock data seeded successfully.");
	} catch (error: unknown) {
		logger.error("Error seeding mock data:", error);
	} finally {
		await AppDataSource.destroy();
	}
};

seedMockData();
