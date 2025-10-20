import Container, { Service } from "typedi";
import cron, { ScheduledTask } from "node-cron";
import { CronJobBase, CronJobRegistry } from "./cron.types";
import cronstrue from "cronstrue";
import ScheduleUpcomingTripsJob from "./jobs/scheduled-trip.job";
import TripReminderJob from "./jobs/trip-reminder.job";
import TripOptimizeJob from "./jobs/trip-optimize.job";
import { EntityManager } from "typeorm";
import SettingMap from "../constants/setting-map";
import logger from "../utils/logger";

@Service()
export class CronService {
	private tasks = new Map<string, ScheduledTask>();
	private instances = new Map<string, CronJobBase>();
	private readonly tz = process.env.TZ ?? "Asia/Ho_Chi_Minh";
	private running = new Set<string>();

	private wrapNoOverlap(name: string, fn: () => Promise<void>) {
		return async () => {
			if (this.running.has(name)) {
				logger.info(`[cron] skip ${name}: previous run still active`);
				return;
			}
			this.running.add(name);
			const started = Date.now();
			try {
				await fn();
				logger.info(`[cron] ${name} done in ${Date.now() - started}ms`);
			} catch (e) {
				logger.error(`[cron] ${name} failed`, e);
			} finally {
				this.running.delete(name);
			}
		};
	}

	private async importAllJobs() {
		CronJobRegistry.push(
			TripOptimizeJob,
			ScheduleUpcomingTripsJob,
			TripReminderJob,
		);
	}

	async init() {
		// Always start fresh (handles hot-reloads / toggles)
		this.stopAll();

		await this.importAllJobs();

		for (const JobClass of CronJobRegistry) {
			const job = Container.get(JobClass) as CronJobBase;

			// Wait for async initialization for all jobs that have it
			await (job as CronJobBase).waitForInitialization();

			this.instances.set(job.name, job);
		}

		for (const job of this.instances.values()) {
			const isEnabled = await this.isJobEnabled(job.name);

			if (isEnabled) {
				const task = cron.schedule(
					job.schedule,
					this.wrapNoOverlap(job.name, job.run.bind(job)),
					{ timezone: job.tz ?? this.tz },
				);
				this.tasks.set(job.name, task);

				const tz = job.tz ?? this.tz;
				const human = this.formatSpec(job.schedule);
				logger.info(
					`[cron][scheduled] ${job.name} — ${human} | timezone = ${tz})`,
				);
			} else {
				logger.info(`[cron][disabled] ${job.name} — job is disabled`);
			}
		}
	}

	async restart(
		name: "schedule-upcoming-trips" | "trip-reminder" | "trip-optimize",
		manager: EntityManager,
	) {
		// Find the job class from registry
		const JobClass = CronJobRegistry.find((cls) => {
			const tempJob = Container.get(cls) as CronJobBase;
			return tempJob.name === name;
		});

		if (!JobClass) throw new Error(`Job class not found: ${name}`);

		// Stop and remove existing scheduled task
		const existingTask = this.tasks.get(name);
		if (existingTask) {
			existingTask.stop();
			this.tasks.delete(name);
		}

		// Remove from running set if it's currently running
		this.running.delete(name);

		// Create fresh instance
		const newJob = Container.get(JobClass) as CronJobBase;

		// update schedule
		await (newJob as CronJobBase).updateSchedule(manager);

		this.instances.set(name, newJob);

		const isEnabled = await this.isJobEnabled(name, manager);

		if (isEnabled) {
			// Reschedule the task with new instance (now with updated schedule)
			const task = cron.schedule(
				newJob.schedule,
				this.wrapNoOverlap(newJob.name, newJob.run.bind(newJob)),
				{ timezone: newJob.tz ?? this.tz },
			);
			this.tasks.set(name, task);

			const tz = newJob.tz ?? this.tz;
			const human = this.formatSpec(newJob.schedule);
			logger.info(
				`[cron][scheduled] ${newJob.name} — ${human} | timezone = ${tz})`,
			);
		}
	}

	private formatSpec(spec: string): string {
		try {
			// AM/PM style; set use24HourTimeFormat: true if you prefer 24h
			return cronstrue.toString(spec, {
				use24HourTimeFormat: false,
				throwExceptionOnParseError: false,
			});
		} catch {
			return `spec="${spec}"`;
		}
	}

	private async isJobEnabled(
		name: string,
		manager?: EntityManager,
	): Promise<boolean> {
		try {
			// avoid circular dependency
			const { default: SettingService } = await import(
				"../services/setting.service"
			);
			const settingService = Container.get(SettingService);

			// Map to the corresponding setting key
			const enabledSettingKey = this.getEnabledSettingKey(name);
			if (!enabledSettingKey) {
				return true;
			}

			const setting = await settingService.getSettingByKey(
				enabledSettingKey,
				manager,
			);
			return setting.value === "true";
		} catch (error) {
			logger.error(
				`[cron] Failed to check if ${name} is enabled:`,
				error,
			);
			// Default to enabled if we can't check
			return true;
		}
	}

	async enable(
		name: "schedule-upcoming-trips" | "trip-reminder" | "trip-optimize",
		manager: EntityManager,
	) {
		const job = this.instances.get(name);
		if (!job) {
			throw new Error(`Job instance not found: ${name}`);
		}

		// Check if already running
		if (this.tasks.has(name)) {
			return;
		}

		await job.updateSchedule(manager);

		// Schedule the task
		const task = cron.schedule(
			job.schedule,
			this.wrapNoOverlap(job.name, job.run.bind(job)),
			{ timezone: job.tz ?? this.tz },
		);
		this.tasks.set(name, task);

		const tz = job.tz ?? this.tz;
		const human = this.formatSpec(job.schedule);
		logger.info(
			`[cron][enabled] ${job.name} — ${human} | timezone = ${tz})`,
		);
	}

	async disable(
		name: "schedule-upcoming-trips" | "trip-reminder" | "trip-optimize",
	) {
		const existingTask = this.tasks.get(name);
		if (existingTask) {
			existingTask.stop();
			this.tasks.delete(name);
			logger.info(`[cron][disabled] ${name} — job stopped`);
		} else {
			logger.info(`[cron] ${name} is already disabled`);
		}

		// Remove from running set if it's currently running
		this.running.delete(name);
	}

	private getEnabledSettingKey(jobName: string): string | null {
		const enabledSettingMappings: Record<string, string> = {
			"schedule-upcoming-trips": SettingMap.TRIP_FINALIZER_ENABLED,
			"trip-reminder": SettingMap.TRIP_REMINDER_ENABLED,
			"trip-optimize": SettingMap.TRIP_OPTIMIZER_ENABLED,
		};

		return enabledSettingMappings[jobName] || null;
	}

	stopAll() {
		this.tasks.forEach((t) => t.stop());
		this.tasks.clear();
	}
}
