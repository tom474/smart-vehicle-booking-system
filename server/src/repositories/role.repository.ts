import { Service } from "typedi";
import { EntityManager, Repository, SelectQueryBuilder } from "typeorm";
import AppDataSource from "../config/database";
import Role from "../database/entities/Role";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class RoleRepository {
	private readonly roleRepository: Repository<Role> =
		AppDataSource.getRepository(Role);

	private getRepository(manager?: EntityManager): Repository<Role> {
		return manager ? manager.getRepository(Role) : this.roleRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<Role[]> {
		// Get the repository
		const repository: Repository<Role> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Role> = repository
			.createQueryBuilder("role")
			.leftJoinAndSelect("role.permissions", "permissions")
			.leftJoinAndSelect("role.users", "users")
			.leftJoinAndSelect("role.drivers", "drivers");

		if (query) {
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
						"CAST(SUBSTRING(role.id, 5) AS INTEGER)",
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

	public async findOne(
		id: string,
		manager?: EntityManager,
	): Promise<Role | null> {
		// Get the repository
		const repository: Repository<Role> = this.getRepository(manager);

		// Find role by ID
		const role: Role | null = await repository
			.createQueryBuilder("role")
			.leftJoinAndSelect("role.permissions", "permissions")
			.leftJoinAndSelect("role.users", "users")
			.leftJoinAndSelect("role.drivers", "drivers")
			.where("role.id = :id", { id })
			.getOne();

		return role;
	}

	public async findOneByTitle(
		title: string,
		manager?: EntityManager,
	): Promise<Role | null> {
		// Get the repository
		const repository: Repository<Role> = this.getRepository(manager);

		// Find role by title
		const role: Role | null = await repository
			.createQueryBuilder("role")
			.leftJoinAndSelect("role.permissions", "permissions")
			.leftJoinAndSelect("role.users", "users")
			.leftJoinAndSelect("role.drivers", "drivers")
			.where("role.title = :title", { title })
			.getOne();

		return role;
	}

	public async findOneByKey(
		key: string,
		manager?: EntityManager,
	): Promise<Role | null> {
		// Get the repository
		const repository: Repository<Role> = this.getRepository(manager);

		// Find role by key
		const role: Role | null = await repository
			.createQueryBuilder("role")
			.leftJoinAndSelect("role.permissions", "permissions")
			.leftJoinAndSelect("role.users", "users")
			.leftJoinAndSelect("role.drivers", "drivers")
			.where("role.key = :key", { key })
			.getOne();

		return role;
	}

	public async create(role: Role, manager?: EntityManager): Promise<Role> {
		// Get the repository
		const repository: Repository<Role> = this.getRepository(manager);

		// Check if the role's ID already exists
		const existingRoleWithId: Role | null = await repository
			.createQueryBuilder("role")
			.where("role.id = :id", { id: role.id })
			.getOne();
		if (existingRoleWithId) {
			throw new ApiError(
				`Role with ID '${role.id}' already exists.`,
				409,
			);
		}

		// Check if the role's title already exists
		const existingRoleWithTitle: Role | null = await repository
			.createQueryBuilder("role")
			.where("role.title = :title", { title: role.title })
			.getOne();
		if (existingRoleWithTitle) {
			throw new ApiError(
				`Role with title '${role.title}' already exists.`,
				409,
			);
		}

		// Check if the role's key already exists
		const existingRoleWithKey: Role | null = await repository
			.createQueryBuilder("role")
			.where("role.key = :key", { key: role.key })
			.getOne();
		if (existingRoleWithKey) {
			throw new ApiError(
				`Role with key '${role.key}' already exists.`,
				409,
			);
		}

		// Save the new role
		return await repository.save(role);
	}

	public async update(role: Role, manager?: EntityManager): Promise<Role> {
		// Get the repository
		const repository: Repository<Role> = this.getRepository(manager);

		// Check if the role exists
		const existingRole: Role | null = await repository
			.createQueryBuilder("role")
			.where("role.id = :id", { id: role.id })
			.getOne();
		if (!existingRole) {
			throw new ApiError(`Role with ID '${role.id}' not found.`, 404);
		}

		// Check if other roles with the same title exist
		const existingRoleWithTitle: Role | null = await repository
			.createQueryBuilder("role")
			.where("role.id != :id", { id: role.id })
			.andWhere("role.title = :title", { title: role.title })
			.getOne();
		if (existingRoleWithTitle) {
			throw new ApiError(
				`Role with title '${role.title}' already exists.`,
				409,
			);
		}

		// Save the updated role
		return await repository.save(role);
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<Role>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"title",
			"key",
			"description",
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
		queryBuilder.andWhere(
			`LOWER(REGEXP_REPLACE(role.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
			{
				searchPattern: `%${normalizedSearchValue}%`,
			},
		);
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<Role>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"title",
			"key",
			"description",
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
					"CAST(SUBSTRING(role.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`role.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<Role>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default RoleRepository;
