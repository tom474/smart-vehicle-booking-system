import { Service } from "typedi";
import { EntityManager, Repository } from "typeorm";
import PublicTripAccess from "../database/entities/PublicTripAccess";
import AppDataSource from "../config/database";
import ApiError from "../templates/api-error";

@Service()
class PublicTripAccessRepository {
	private readonly repository: Repository<PublicTripAccess> =
		AppDataSource.getRepository(PublicTripAccess);

	private getRepository(
		manager?: EntityManager,
	): Repository<PublicTripAccess> {
		return manager
			? manager.getRepository(PublicTripAccess)
			: this.repository;
	}

	public async findByCode(
		code: string,
		manager?: EntityManager,
	): Promise<PublicTripAccess> {
		// Get the repository
		const repository: Repository<PublicTripAccess> =
			this.getRepository(manager);

		const access: PublicTripAccess | null = await repository
			.createQueryBuilder("access")
			.leftJoinAndSelect("access.trip", "trip")
			.leftJoinAndSelect("trip.outsourcedVehicle", "outsourcedVehicle")
			.where("access.code = :code", { code })
			.getOne();

		if (!access) {
			throw new ApiError("No public url for this trip", 400);
		}

		return access;
	}

	public async findByTripId(
		tripId: string,
		manager?: EntityManager,
	): Promise<PublicTripAccess> {
		// Get the repository
		const repository: Repository<PublicTripAccess> =
			this.getRepository(manager);

		const access: PublicTripAccess | null = await repository
			.createQueryBuilder("access")
			.leftJoinAndSelect("access.trip", "trip")
			.leftJoinAndSelect("trip.outsourcedVehicle", "outsourcedVehicle")
			.where("trip.id = :tripId", { tripId })
			.getOne();

		if (!access) {
			throw new ApiError("No public url for this trip", 400);
		}

		return access;
	}

	public async deleteByTripId(
		tripId: string,
		manager?: EntityManager,
	): Promise<void> {
		const repository: Repository<PublicTripAccess> =
			this.getRepository(manager);

		await repository
			.createQueryBuilder()
			.delete()
			.where("trip_id = :tripId", { tripId })
			.execute();
	}

	public async create(
		access: PublicTripAccess,
		manager?: EntityManager,
	): Promise<PublicTripAccess> {
		// Get the repository
		const repository: Repository<PublicTripAccess> =
			this.getRepository(manager);

		// Save the new booking request
		return await repository.save(access);
	}
}

export default PublicTripAccessRepository;
