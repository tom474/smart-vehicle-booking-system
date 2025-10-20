import { Service } from "typedi";
import { RegisterCronJob, CronJobBase } from "../cron.types";
import TripOptimizerService from "../../services/trip-optimizer.service";
import SettingService from "../../services/setting.service";
import SettingMap from "../../constants/setting-map";
import { parseScheduleType, parseTimeValue } from "./helper";
import { EntityManager } from "typeorm";
import logger from "../../utils/logger";

@Service()
@RegisterCronJob()
export default class TripOptimizeJob extends CronJobBase {
	readonly name = "trip-optimize";
	schedule = "0 0 23 * * *"; // every day at 23:00
	private initializationPromise: Promise<void>;

	constructor(
		private readonly tripOptimizerService: TripOptimizerService,
		private readonly settingService: SettingService,
	) {
		super();
		this.initializationPromise = this.initializeSchedule();
	}

	private async initializeSchedule(manager?: EntityManager): Promise<void> {
		const tripOptimizeTime = await this.settingService.getSettingByKey(
			SettingMap.TRIP_OPTIMIZER_TIME,
			manager,
		);

		const tripOptimizeDate = await this.settingService.getSettingByKey(
			SettingMap.TRIP_OPTIMIZER_SCHEDULE,
			manager,
		);

		if (!tripOptimizeTime || !tripOptimizeDate) {
			logger.info(`[cron][${this.name}] using default schedule`);
			return;
		}

		const time = parseTimeValue(tripOptimizeTime.value);
		const schedule = parseScheduleType(tripOptimizeDate.value);
		this.schedule = `0 ${time.minute} ${time.hour} * * ${schedule}`;
		logger.info(
			`[cron][${this.name}] loaded schedule from DB: ${this.schedule}`,
		);
	}

	async waitForInitialization(): Promise<void> {
		await this.initializationPromise;
	}

	public async updateSchedule(manager: EntityManager): Promise<void> {
		await this.initializeSchedule(manager);
	}

	async run() {
		const JOB = this.name;
		const started = Date.now();

		logger.info(`[cron][${JOB}] start`);

		try {
			await this.tripOptimizerService.optimizeTripsWithORTools();

			const ms = Date.now() - started;
			logger.info(`[cron][${JOB}] completed successfully in ${ms}ms`);
		} catch (error) {
			const ms = Date.now() - started;
			logger.error(`[cron][${JOB}] failed after ${ms}ms:`, error);
		}
	}
}
