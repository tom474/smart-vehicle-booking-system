import { Service } from "typedi";
import { EntityManager, Repository, SelectQueryBuilder } from "typeorm";
import AppDataSource from "../config/database";
import RoleMap from "../constants/role-map";
import User from "../database/entities/User";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class UserRepository {
	private readonly userRepository: Repository<User> =
		AppDataSource.getRepository(User);

	private getRepository(manager?: EntityManager): Repository<User> {
		return manager ? manager.getRepository(User) : this.userRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<User[]> {
		// Get the repository
		const repository: Repository<User> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<User> = repository
			.createQueryBuilder("user")
			.leftJoinAndSelect("user.role", "role")
			.leftJoinAndSelect("user.dedicatedVehicle", "dedicated_vehicle");

		if (query) {
			// Apply filters if provided
			await this.applyFilters(queryBuilder, query);

			// Apply search if provided
			if (query.searchField && query.searchValue) {
				await this.applySearch(queryBuilder, query);
			}

			// Apply order by if provided
			if (query.orderField && query.orderDirection) {
				await this.applyOrderBy(queryBuilder, query);
			} else {
				queryBuilder
					.addSelect(
						"CAST(SUBSTRING(user.id, 5) AS INTEGER)",
						"numeric_id",
					)
					.orderBy("numeric_id", "ASC");
			}
		}

		// Apply pagination if provided
		if (pagination) {
			await this.applyPagination(queryBuilder, pagination);
		}

		return await queryBuilder.getMany();
	}

	public async findByRole(role: string, manager?: EntityManager) {
		// Get the repository
		const repository: Repository<User> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<User> = repository
			.createQueryBuilder("user")
			.leftJoinAndSelect("user.role", "role")
			.leftJoinAndSelect("user.dedicatedVehicle", "dedicated_vehicle")
			.where("role.key = :role", { role });

		return await queryBuilder.getMany();
	}

	public async findOne(
		id: string,
		manager?: EntityManager,
	): Promise<User | null> {
		// Get the repository
		const repository: Repository<User> = this.getRepository(manager);

		// Find user by ID
		const user: User | null = await repository
			.createQueryBuilder("user")
			.leftJoinAndSelect("user.role", "role")
			.leftJoinAndSelect("user.dedicatedVehicle", "dedicated_vehicle")
			.where("user.id = :id", { id })
			.getOne();

		return user;
	}

	public async findExecutiveById(
		id: string,
		manager?: EntityManager,
	): Promise<User | null> {
		// Get the repository
		const repository: Repository<User> = this.getRepository(manager);

		// Find executive by ID
		const executive: User | null = await repository
			.createQueryBuilder("user")
			.leftJoinAndSelect("user.role", "role")
			.leftJoinAndSelect("user.dedicatedVehicle", "dedicated_vehicle")
			.leftJoinAndSelect("dedicated_vehicle.driver", "dedicated_driver")
			.leftJoinAndSelect(
				"user.executiveVehicleActivity",
				"vehicle_activity",
			)
			.where("user.id = :id", { id: id })
			.andWhere("role.key = :key", { key: RoleMap.EXECUTIVE })
			.getOne();

		return executive;
	}

	public async findOneByMicrosoftIdAndEmail(
		microsoftId: string,
		email: string,
		manager?: EntityManager,
	): Promise<User | null> {
		// Get the repository
		const repository: Repository<User> = this.getRepository(manager);

		// Find user by Microsoft ID and email
		const user: User | null = await repository
			.createQueryBuilder("user")
			.leftJoinAndSelect("user.role", "role")
			.where("user.microsoftId = :microsoftId", {
				microsoftId: microsoftId,
			})
			.andWhere("user.email = :email", {
				email: email,
			})
			.getOne();

		return user;
	}

	public async create(user: User, manager?: EntityManager): Promise<User> {
		// Get the repository
		const repository: Repository<User> = this.getRepository(manager);

		// Check if the user's ID already exists
		const existingUser: User | null = await repository
			.createQueryBuilder("user")
			.where("user.id = :id", { id: user.id })
			.getOne();
		if (existingUser) {
			throw new ApiError(
				`User with ID '${user.id}' already exists.`,
				409,
			);
		}

		// Check if the user's Microsoft ID already exists
		const existingUserWithMicrosoftId: User | null = await repository
			.createQueryBuilder("user")
			.where("user.microsoftId = :microsoftId", {
				microsoftId: user.microsoftId,
			})
			.getOne();
		if (existingUserWithMicrosoftId) {
			throw new ApiError(
				`User with Microsoft ID '${user.microsoftId}' already exists.`,
				409,
			);
		}

		// Check if the user's email already exists
		const existingUserWithEmail: User | null = await repository
			.createQueryBuilder("user")
			.where("user.email = :email", { email: user.email })
			.getOne();
		if (existingUserWithEmail) {
			throw new ApiError(
				`User with email '${user.email}' already exists.`,
				409,
			);
		}

		// Check if the user's phone number already exists
		const existingUserWithPhoneNumber: User | null = await repository
			.createQueryBuilder("user")
			.where("user.phoneNumber = :phoneNumber", {
				phoneNumber: user.phoneNumber,
			})
			.getOne();
		if (existingUserWithPhoneNumber) {
			throw new ApiError(
				`User with phone number '${user.phoneNumber}' already exists.`,
				409,
			);
		}

		// Save the new user
		return await repository.save(user);
	}

	public async update(user: User, manager?: EntityManager): Promise<User> {
		// Get the repository
		const repository: Repository<User> = this.getRepository(manager);

		// Check if the user exists
		const existingUser: User | null = await repository
			.createQueryBuilder("user")
			.where("user.id = :id", { id: user.id })
			.getOne();
		if (!existingUser) {
			throw new ApiError(`User with ID '${user.id}' not found.`, 404);
		}

		// Check if other users with the same phone number exist
		const existingUserWithPhoneNumber: User | null = await repository
			.createQueryBuilder("user")
			.where("user.id != :id", { id: user.id })
			.andWhere("user.phoneNumber = :phoneNumber", {
				phoneNumber: user.phoneNumber,
			})
			.getOne();
		if (existingUserWithPhoneNumber) {
			throw new ApiError(
				`User with phone number '${user.phoneNumber}' already exists.`,
				409,
			);
		}

		// Save the updated user
		return await repository.save(user);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<User>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for status if provided
		if (query.status) {
			const statusValue: string = query.status as string;
			if (statusValue.includes(",")) {
				// Handle comma-separated values
				const statusValues: string[] = statusValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere("user.status IN (:...statusValues)", {
					statusValues: statusValues,
				});
			} else {
				queryBuilder.andWhere("user.status = :status", {
					status: statusValue,
				});
			}
		}

		// Apply filter for roleId if provided
		if (query.roleId) {
			const roleIdValue: string = query.roleId as string;
			if (roleIdValue.includes(",")) {
				// Handle comma-separated values
				const roleIdValues: string[] = roleIdValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere("role.id IN (:...roleIdValues)", {
					roleIdValues: roleIdValues,
				});
			} else {
				queryBuilder.andWhere("role.id = :roleId", {
					roleId: roleIdValue,
				});
			}
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<User>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"name",
			"email",
			"phoneNumber",
			"roleTitle",
		];

		// Validate search field
		const searchField: string = query.searchField as string;
		if (!allowedSearchFields.includes(searchField)) {
			throw new ApiError(
				`Search field must be one of the following: ${allowedSearchFields.join(", ")}.`,
				400,
			);
		}

		// Normalize search value
		const searchValue: string = query.searchValue as string;
		const normalizedSearchValue: string = searchValue
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "");

		// Apply search to the query builder
		if (searchField === "roleTitle") {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(role.title, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(user.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		}
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<User>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"name",
			"email",
			"phoneNumber",
		];
		const allowedOrderDirections: string[] = ["ASC", "DESC"];

		// Validate order field
		const orderField: string = query.orderField as string;
		if (!allowedOrderFields.includes(orderField)) {
			throw new ApiError(
				`Order field must be one of the following: ${allowedOrderFields.join(", ")}.`,
				400,
			);
		}

		// Validate order direction
		const orderDirection: string = query.orderDirection as string;
		if (!allowedOrderDirections.includes(orderDirection)) {
			throw new ApiError(
				`Order direction must be one of the following: ${allowedOrderDirections.join(", ")}.`,
				400,
			);
		}

		// Apply order by to the query builder
		if (orderField === "id") {
			queryBuilder
				.addSelect(
					"CAST(SUBSTRING(user.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`user.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<User>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default UserRepository;
