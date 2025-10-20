import { EntityManager } from "typeorm";

export abstract class CronJobBase {
	abstract readonly name: string; // unique
	abstract readonly schedule: string; // supports seconds: "*/10 * * * * *"
	readonly tz?: string; // optional override per job

	abstract run(): Promise<void>;

	abstract waitForInitialization(): Promise<void>;

	abstract updateSchedule(manager: EntityManager): Promise<void>;
}

// Global registry that fills up when job modules are imported
export const CronJobRegistry: Array<new (...args: any[]) => CronJobBase> = [];

// Decorator to auto-register job classes
export function RegisterCronJob(): ClassDecorator {
	return (target) => {
		CronJobRegistry.push(target as any);
	};
}
