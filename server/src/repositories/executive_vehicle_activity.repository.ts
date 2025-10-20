import { EntityManager, Repository, SelectQueryBuilder } from "typeorm";
import { Service } from "typedi";
import AppDataSource from "../config/database";
import ExecutiveVehicleActivity from "../database/entities/ExecutiveVehicleActivity";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";
import ActivityStatus from "../database/enums/ActivityStatus";

@Service()
class ExecutiveVehicleActivityRepository {
	private readonly repository: Repository<ExecutiveVehicleActivity> =
		AppDataSource.getRepository(ExecutiveVehicleActivity);

	private getRepository(
		manager?: EntityManager,
	): Repository<ExecutiveVehicleActivity> {
		return manager
			? manager.getRepository(ExecutiveVehicleActivity)
			: this.repository;
	}

	public async findByExecutiveId(
		executiveId: string,
		pagination: Pagination,
		status?: "pending" | "approved" | "rejected",
		manager?: EntityManager,
	): Promise<ExecutiveVehicleActivity[]> {
		const repository = this.getRepository(manager);

		const qb = repository
			.createQueryBuilder("log")
			.leftJoinAndSelect("log.vehicle", "vehicle")
			.leftJoinAndSelect("vehicle.driver", "driver")
			.leftJoinAndSelect("log.executive", "executive")
			.where("executive.id = :executiveId", { executiveId });

		if (status) {
			qb.andWhere("log.status = :status", { status });
		}

		qb.orderBy("log.createdAt", "DESC");

		const skip = (pagination.page - 1) * pagination.limit;
		qb.skip(skip).take(pagination.limit);

		return await qb.getMany();
	}

	public async findByDriverId(
		driverId: string,
		pagination: Pagination,
		status?: "pending" | "approved" | "rejected",
		manager?: EntityManager,
	): Promise<ExecutiveVehicleActivity[]> {
		const repository = this.getRepository(manager);

		const qb = repository
			.createQueryBuilder("log")
			.leftJoinAndSelect("log.vehicle", "vehicle")
			.leftJoinAndSelect("vehicle.driver", "driver")
			.leftJoinAndSelect("log.executive", "executive")
			.where("driver.id = :driverId", { driverId });

		if (status) {
			qb.andWhere("log.status = :status", { status });
		}

		qb.orderBy("log.createdAt", "DESC");

		const skip = (pagination.page - 1) * pagination.limit;
		qb.skip(skip).take(pagination.limit);

		return await qb.getMany();
	}

	public async find(
		pagination: Pagination,
		query: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<ExecutiveVehicleActivity[]> {
		const repository = this.getRepository(manager);

		const qb: SelectQueryBuilder<ExecutiveVehicleActivity> = repository
			.createQueryBuilder("log")
			.leftJoinAndSelect("log.vehicle", "vehicle")
			.leftJoinAndSelect("vehicle.driver", "driver")
			.leftJoinAndSelect("log.executive", "executive");

		await this.applyFilters(qb, query);
		await this.applyOrderBy(qb, query);
		await this.applyPagination(qb, pagination);

		return await qb.getMany();
	}

	public async findOne(
		id: string,
		manager?: EntityManager,
	): Promise<ExecutiveVehicleActivity> {
		const repository = this.getRepository(manager);

		const log: ExecutiveVehicleActivity | null = await repository
			.createQueryBuilder("log")
			.where("log.id = :id", { id })
			.leftJoinAndSelect("log.vehicle", "vehicle")
			.leftJoinAndSelect("vehicle.driver", "driver")
			.leftJoinAndSelect("log.executive", "executive")
			.getOne();

		if (!log) {
			throw new ApiError(
				`Daily activity log with id "${id}" not found.`,
				404,
			);
		}

		return log;
	}

	public async setConfirmationStatus(
		id: string,
		isConfirmed: boolean,
		manager?: EntityManager,
	): Promise<ExecutiveVehicleActivity> {
		const repository = this.getRepository(manager);

		const log = await this.findOne(id, manager);

		log.status = isConfirmed
			? ActivityStatus.APPROVED
			: ActivityStatus.REJECTED;

		return await repository.save(log);
	}

	public async hasOverlappingLog(
		executiveId: string,
		startTime: Date,
		endTime: Date,
		manager?: EntityManager,
	): Promise<boolean> {
		const repository = this.getRepository(manager);

		const overlappingLog = await repository
			.createQueryBuilder("log")
			.where("log.executive = :executiveId", { executiveId })
			.andWhere(
				// Check if either startTime or endTime falls within any existing log
				"(log.startTime < :endTime AND log.endTime > :startTime)",
				{ startTime, endTime },
			)
			.getOne();

		return !!overlappingLog;
	}

	public async create(
		log: ExecutiveVehicleActivity,
		manager?: EntityManager,
	): Promise<ExecutiveVehicleActivity> {
		const repository = this.getRepository(manager);
		return await repository.save(log);
	}

	public async update(
		log: ExecutiveVehicleActivity,
		manager?: EntityManager,
	): Promise<ExecutiveVehicleActivity> {
		const repository = this.getRepository(manager);
		return await repository.save(log);
	}

	private async applyFilters(
		qb: SelectQueryBuilder<ExecutiveVehicleActivity>,
		query: Record<string, unknown>,
	): Promise<void> {
		if (query.driverId) {
			qb.andWhere("driver.id = :driverId", { driverId: query.driverId });
		}

		if (query.executiveId) {
			qb.andWhere("executive.id = :executiveId", {
				executiveId: query.executiveId,
			});
		}

		if (query.isConfirmed !== undefined) {
			qb.andWhere("log.isConfirmed = :isConfirmed", {
				isConfirmed: query.isConfirmed === "true",
			});
		}

		if (query.from && query.to) {
			qb.andWhere("log.startTime BETWEEN :from AND :to", {
				from: query.from,
				to: query.to,
			});
		}
	}

	private async applyOrderBy(
		qb: SelectQueryBuilder<ExecutiveVehicleActivity>,
		query: Record<string, unknown>,
	): Promise<void> {
		let orderField: string = "createdAt";
		let orderDirection: "ASC" | "DESC" = "DESC";

		if (query.orderField) {
			orderField = query.orderField as string;
		}

		if (query.orderDirection) {
			orderDirection = query.orderDirection as "ASC" | "DESC";
		}

		qb.orderBy(`log.${orderField}`, orderDirection);
	}

	private async applyPagination(
		qb: SelectQueryBuilder<ExecutiveVehicleActivity>,
		pagination: Pagination,
	): Promise<void> {
		const skip = (pagination.page - 1) * pagination.limit;
		qb.skip(skip).take(pagination.limit);
	}
}

export default ExecutiveVehicleActivityRepository;
