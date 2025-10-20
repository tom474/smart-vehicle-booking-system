import { Service } from "typedi";
import TripRepository from "../../repositories/trip.repository";
import { RegisterCronJob, CronJobBase } from "../cron.types";
import NotificationService from "../../services/notification.service";
import Trip from "../../database/entities/Trip";
import AppDataSource from "../../config/database";
import NotificationBody from "../../dtos/notification/notification-body.dto";
import Priority from "../../database/enums/Priority";
import User from "../../database/entities/User";
import SettingService from "../../services/setting.service";
import SettingMap from "../../constants/setting-map";
import { parseTimeValue } from "./helper";
import { EntityManager } from "typeorm";
import logger from "../../utils/logger";

@Service()
@RegisterCronJob()
export default class TripReminderJob extends CronJobBase {
	name = "trip-reminder";
	schedule = "0 0 12 * * *"; // everyday at 12pm
	private initializationPromise: Promise<void>;

	constructor(
		private readonly tripRepository: TripRepository,
		private readonly notificationService: NotificationService,
		private readonly settingService: SettingService,
	) {
		super();
		this.initializationPromise = this.initializeSchedule();
	}

	private async initializeSchedule(manager?: EntityManager): Promise<void> {
		const tripReminderTime = await this.settingService.getSettingByKey(
			SettingMap.TRIP_REMINDER_TIME,
			manager,
		);

		if (!tripReminderTime) {
			logger.info(`[cron][${this.name}] using default schedule`);
			return;
		}

		const time = parseTimeValue(tripReminderTime.value);
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
		const trips: Trip[] = await this.tripRepository.getUpcomingTrip();

		if (trips.length === 0) {
			logger.info(
				`[cron] no eligible trips (status=SCHEDULING, departure tomorrow)`,
			);
			return;
		}

		await AppDataSource.transaction(async (manager) => {
			for (const trip of trips) {
				for (const ticket of trip.tickets) {
					const user: User = ticket.user;
					const notification = new NotificationBody(
						"trip reminder",
						"TripReminder",
						{ date: ticket.departureTime },
						ticket.id,
						Priority.HIGH,
					);

					await this.notificationService.sendUserNotification(
						notification,
						user.id,
						user.role.key,
						manager,
					);
				}
			}
		});

		logger.info("[cron] finish daily trip reminder");
	}
}
