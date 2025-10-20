// src/cron/jobs/schedule-upcoming-trips.job.ts
import { Service } from "typedi";
import TripRepository from "../../repositories/trip.repository";
import BookingRequestRepository from "../../repositories/booking-request.repository";
import { RegisterCronJob, CronJobBase } from "../cron.types";
import Trip from "../../database/entities/Trip";
import AppDataSource from "../../config/database";
import TripStatus from "../../database/enums/TripStatus";
import RequestStatus from "../../database/enums/RequestStatus";
import IdCounterService from "../../services/id-counter.service";
import Schedule from "../../database/entities/Schedule";
import ScheduleRepository from "../../repositories/schedule.repository";
import NotificationBody from "../../dtos/notification/notification-body.dto";
import Priority from "../../database/enums/Priority";
import NotificationService from "../../services/notification.service";
import SettingService from "../../services/setting.service";
import SettingMap from "../../constants/setting-map";
import { parseTimeValue } from "./helper";
import { EntityManager } from "typeorm";
import logger from "../../utils/logger";

@Service()
@RegisterCronJob()
export default class ScheduleUpcomingTripsJob extends CronJobBase {
	name = "schedule-upcoming-trips";
	schedule = "0 0 21 * * *";
	private initializationPromise: Promise<void>;

	constructor(
		private readonly tripRepository: TripRepository,
		private readonly bookingRequestRepository: BookingRequestRepository,
		private readonly idCounterService: IdCounterService,
		private readonly scheduleRepository: ScheduleRepository,
		private readonly notificationService: NotificationService,
		private readonly settingService: SettingService,
	) {
		super();
		this.initializationPromise = this.initializeSchedule();
	}

	private async initializeSchedule(manager?: EntityManager): Promise<void> {
		const tripFinalizeTime = await this.settingService.getSettingByKey(
			SettingMap.TRIP_FINALIZER_TIME,
			manager,
		);

		if (!tripFinalizeTime) {
			logger.info(`[cron][${this.name}] using default schedule`);
			return;
		}

		const time = parseTimeValue(tripFinalizeTime.value);
		this.schedule = `0 ${time.minute} ${time.hour} * * *`;
		logger.info(
			`[cron][${this.name}] loaded schedule from DB: ${this.schedule}`,
		);
	}

	public async waitForInitialization(): Promise<void> {
		await this.initializationPromise;
	}

	public async updateSchedule(manager: EntityManager): Promise<void> {
		await this.initializeSchedule(manager);
	}

	async run() {
		const JOB = this.name;
		const started = Date.now();

		const tripFinalizeHour = await this.settingService.getSettingByKey(
			SettingMap.TRIP_FINALIZER_LEAD_HOURS,
		);

		logger.info(`[cron][${JOB}] start`);
		const trips: Trip[] = await this.tripRepository.findSchedulingTrips(
			Number(tripFinalizeHour.value),
		);

		if (trips.length === 0) {
			logger.info(
				`[cron][${JOB}] no eligible trips (status=SCHEDULING, departure ≤ ${tripFinalizeHour.value}h)`,
			);
			return;
		}

		logger.info(`[cron][${JOB}] found ${trips.length} trip(s)`);

		await AppDataSource.transaction(async (manager) => {
			for (const trip of trips) {
				// Store the old trip data before changing IDs
				const existingId = trip.id;
				const oldStops = [...trip.stops]; // Save stops
				const oldTickets = [...trip.tickets]; // Save tickets

				// Generate new trip ID
				const tripId = await this.idCounterService.generateId(
					"trip",
					manager,
				);

				const br = await this.bookingRequestRepository.findOneByTripId(
					existingId,
					manager,
				);

				// Update trip with new ID
				trip.status = TripStatus.SCHEDULED;
				trip.id = tripId;

				if (oldStops.length > 0) {
					trip.stops = oldStops.map((stop) => {
						stop.trip = trip; // Link to new trip
						return stop;
					});
				}

				if (oldTickets.length > 0) {
					trip.tickets = oldTickets.map((ticket) => {
						ticket.trip = trip; // Link to new trip
						return ticket;
					});
				}

				// Create the new trip with updated stops and tickets
				await this.tripRepository.create(trip, manager);

				// Delete the old trip (cascade should handle old stops/tickets)
				await this.tripRepository.delete(existingId, manager);

				// create schedule for driver
				const id: string = await this.idCounterService.generateId(
					"schedule",
					manager,
				);

				const newSchedule = new Schedule(
					id,
					`Trip Assignment - ${trip.id}`,
					trip.departureTime,
					trip.arrivalTime,
					`Driver assigned to trip ${trip.id}`,
					trip.driver,
					trip.vehicle,
				);
				await this.scheduleRepository.create(newSchedule, manager);

				const ApprovedRequestNotification = new NotificationBody(
					"Booking request approved",
					"BookingRequestApproved",
					{
						date: new Date().toLocaleDateString("en-GB", {
							day: "2-digit",
							month: "2-digit",
							year: "numeric",
						}),
					},
					br.id,
					Priority.HIGH,
				);
				await this.notificationService.sendUserNotification(
					ApprovedRequestNotification,
					br.requester.id,
					br.requester.role.key,
					manager,
				);

				const notification = new NotificationBody(
					"Driver new trip assigned",
					"DriverNewTripAssigned",
					{
						date: new Date(br.departureTime).toLocaleDateString(
							"en-GB",
							{
								day: "2-digit",
								month: "2-digit",
								year: "numeric",
							},
						),
						time: new Date(br.departureTime).toLocaleTimeString(
							"en-GB",
							{
								hour: "2-digit",
								minute: "2-digit",
								hour12: false,
							},
						),
					},
					trip.id,
					Priority.HIGH,
				);
				await this.notificationService.sendUserNotification(
					notification,
					trip.driver!.id,
					"driver",
					manager,
				);

				// approve its booking request (will throw if not found or save fails)
				if (br.status !== RequestStatus.APPROVED) {
					br.status = RequestStatus.APPROVED;
					await this.bookingRequestRepository.update(br, manager);
				}
			}
		});

		const ms = Date.now() - started;
		logger.info(
			`[cron][${JOB}] done in ${ms}ms — scheduled ${trips.length}`,
		);
	}
}
