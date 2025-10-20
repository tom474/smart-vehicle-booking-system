import "es6-shim";
import "reflect-metadata";
import express, { Application, Request, Response } from "express";
import { useContainer, useExpressServer } from "routing-controllers";
import Container from "typedi";
import cookieParser from "cookie-parser";
import { PORT } from "./config/env";
import initializeDatabase from "./database/postgresql";
import ErrorMiddleware from "./middlewares/error.middleware";
import AuthenticationController from "./controllers/authentication.controller";
import SettingController from "./controllers/setting.controller";
import RoleController from "./controllers/role.controller";
import PermissionController from "./controllers/permission.controller";
import LocationController from "./controllers/location.controller";
import VendorController from "./controllers/vendor.controller";
import UserController from "./controllers/user.controller";
import DriverController from "./controllers/driver.controller";
import VehicleController from "./controllers/vehicle.controller";
import OutsourcedVehicleController from "./controllers/outsourced-vehicle.controller";
import BookingRequestController from "./controllers/booking-request.controller";
import TripController from "./controllers/trip.controller";
import TripTicketController from "./controllers/trip-ticket.controller";
import TripStopController from "./controllers/trip-stop.controller";
import TripFeedbackController from "./controllers/trip-feedback.controller";
import LeaveRequestController from "./controllers/leave-request.controller";
import VehicleServiceController from "./controllers/vehicle-service.controller";
import ScheduleController from "./controllers/schedule.controller";
import ExpenseController from "./controllers/expense.controller";
import ExecutiveVehicleActivityController from "./controllers/executive-vehicle-activity.controller";
import NotificationController from "./controllers/notification.controller";
import ActivityLogController from "./controllers/activity-log.controller";
import ReportController from "./controllers/report-generator.controller";
import { CronService } from "./cron/cron.service";
import logger from "./utils/logger";

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routing Controllers
useContainer(Container);

useExpressServer(app, {
	cors: {
		origin: true,
		credentials: true,
	},
	routePrefix: "/api",
	controllers: [
		AuthenticationController,
		SettingController,
		RoleController,
		PermissionController,
		LocationController,
		VendorController,
		UserController,
		DriverController,
		VehicleController,
		OutsourcedVehicleController,
		BookingRequestController,
		TripController,
		TripTicketController,
		TripStopController,
		TripFeedbackController,
		LeaveRequestController,
		VehicleServiceController,
		ScheduleController,
		ExpenseController,
		ExecutiveVehicleActivityController,
		NotificationController,
		ActivityLogController,
		ReportController,
	],
	middlewares: [ErrorMiddleware],
	defaultErrorHandler: false,
	classTransformer: true,
	validation: true,
});

// Health Check Route
app.get("/", (req: Request, res: Response) => {
	res.send("Vehicle Booking System API is running!");
});

// Start the server
const startServer: () => Promise<void> = async () => {
	try {
		await initializeDatabase();
		Container.get(CronService).init();
		app.listen(PORT, async () => {
			logger.info(
				`Vehicle Booking System API is running on http://localhost:${PORT}`,
			);
		});
	} catch (error: unknown) {
		logger.error("Error starting the server:", error);
		process.exit(1);
	}
};

startServer();
