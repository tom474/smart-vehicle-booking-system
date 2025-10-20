import { EntityManager, Repository } from "typeorm";
import { Service } from "typedi";
import AppDataSource from "../config/database";
import IdCounter from "../database/entities/IdCounter";
import ApiError from "../templates/api-error";

@Service()
class IdCounterRepository {
	private readonly idCounterRepository: Repository<IdCounter> =
		AppDataSource.getRepository(IdCounter);

	private getRepository(manager?: EntityManager): Repository<IdCounter> {
		return manager
			? manager.getRepository(IdCounter)
			: this.idCounterRepository;
	}

	public async ensureExists(
		tableName: string,
		prefix: string,
		manager?: EntityManager,
	): Promise<void> {
		// Get the repository
		const repository: Repository<IdCounter> = this.getRepository(manager);

		// Check if the id counter already exists
		const existingIdCounter: IdCounter | null = await repository
			.createQueryBuilder("idCounter")
			.where("idCounter.tableName = :tableName", { tableName })
			.getOne();

		// If it does not exist, create a new one
		if (!existingIdCounter) {
			const newIdCounter: IdCounter = new IdCounter(tableName, prefix);
			await this.create(newIdCounter);
		}
	}

	public async findOneAndLock(
		tableName: string,
		manager?: EntityManager,
	): Promise<IdCounter | null> {
		// Get the repository
		const repository: Repository<IdCounter> = this.getRepository(manager);

		// Find the id counter by table name and lock it for update
		const idCounter: IdCounter | null = await repository
			.createQueryBuilder("idCounter")
			.setLock("pessimistic_write")
			.where("idCounter.tableName = :tableName", { tableName })
			.getOne();

		return idCounter;
	}

	public async create(
		idCounter: IdCounter,
		manager?: EntityManager,
	): Promise<IdCounter> {
		// Get the repository
		const repository: Repository<IdCounter> = this.getRepository(manager);

		// Check if the id counter's table name already exists
		const existingIdCounterWithTableName: IdCounter | null =
			await repository
				.createQueryBuilder("idCounter")
				.where("idCounter.tableName = :tableName", {
					tableName: idCounter.tableName,
				})
				.getOne();

		if (existingIdCounterWithTableName) {
			throw new ApiError(
				`Id counter for table "${idCounter.tableName}" already exists.`,
				409,
			);
		}

		// Check if the id counter's prefix already exists
		const existingIdCounterWithPrefix: IdCounter | null = await repository
			.createQueryBuilder("idCounter")
			.where("idCounter.prefix = :prefix", { prefix: idCounter.prefix })
			.getOne();
		if (existingIdCounterWithPrefix) {
			throw new ApiError(
				`Id counter with prefix "${idCounter.prefix}" already exists.`,
				409,
			);
		}

		// Create the new id counter
		return await repository.save(idCounter);
	}

	public async update(
		idCounter: IdCounter,
		manager?: EntityManager,
	): Promise<IdCounter> {
		// Get the repository
		const repository: Repository<IdCounter> = this.getRepository(manager);

		// Check if other id counters with the same prefix exist
		const existingIdCounterWithPrefix: IdCounter | null = await repository
			.createQueryBuilder("idCounter")
			.where("idCounter.tableName != :tableName", {
				tableName: idCounter.tableName,
			})
			.andWhere("idCounter.prefix = :prefix", {
				prefix: idCounter.prefix,
			})
			.getOne();
		if (existingIdCounterWithPrefix) {
			throw new ApiError(
				`Id counter with prefix "${idCounter.prefix}" already exists.`,
				409,
			);
		}

		// Update the id counter
		return await repository.save(idCounter);
	}
}

export default IdCounterRepository;
