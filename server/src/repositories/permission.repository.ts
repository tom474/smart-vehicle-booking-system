import { Service } from "typedi";
import { EntityManager, Repository, SelectQueryBuilder } from "typeorm";
import AppDataSource from "../config/database";
import Permission from "../database/entities/Permission";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class PermissionRepository {
	private readonly permissionRepository: Repository<Permission> =
		AppDataSource.getRepository(Permission);

	private getRepository(manager?: EntityManager): Repository<Permission> {
		return manager
			? manager.getRepository(Permission)
			: this.permissionRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<Permission[]> {
		// Get the repository
		const repository: Repository<Permission> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Permission> = repository
			.createQueryBuilder("permission")
			.leftJoinAndSelect("permission.roles", "roles");

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
						"CAST(SUBSTRING(permission.id, 5) AS INTEGER)",
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
	): Promise<Permission | null> {
		// Get the repository
		const repository: Repository<Permission> = this.getRepository(manager);

		// Find permission by ID
		const permission: Permission | null = await repository
			.createQueryBuilder("permission")
			.leftJoinAndSelect("permission.roles", "roles")
			.where("permission.id = :id", { id })
			.getOne();

		return permission;
	}

	public async findOneByTitle(
		title: string,
		manager?: EntityManager,
	): Promise<Permission | null> {
		// Get the repository
		const repository: Repository<Permission> = this.getRepository(manager);

		// Find permission by title
		const permission: Permission | null = await repository
			.createQueryBuilder("permission")
			.leftJoinAndSelect("permission.roles", "roles")
			.where("permission.title = :title", { title })
			.getOne();

		return permission;
	}

	public async findOneByKey(
		key: string,
		manager?: EntityManager,
	): Promise<Permission | null> {
		// Get the repository
		const repository: Repository<Permission> = this.getRepository(manager);

		// Find permission by key
		const permission: Permission | null = await repository
			.createQueryBuilder("permission")
			.leftJoinAndSelect("permission.roles", "roles")
			.where("permission.key = :key", { key })
			.getOne();

		return permission;
	}

	public async create(
		permission: Permission,
		manager?: EntityManager,
	): Promise<Permission> {
		// Get the repository
		const repository: Repository<Permission> = this.getRepository(manager);

		// Check if the permission's ID already exists
		const existingPermissionWithId: Permission | null = await repository
			.createQueryBuilder("permission")
			.where("permission.id = :id", { id: permission.id })
			.getOne();
		if (existingPermissionWithId) {
			throw new ApiError(
				`Permission with ID '${permission.id}' already exists.`,
				409,
			);
		}

		// Check if the permission's key already exists
		const existingPermissionWithKey: Permission | null = await repository
			.createQueryBuilder("permission")
			.where("permission.key = :key", { key: permission.key })
			.getOne();
		if (existingPermissionWithKey) {
			throw new ApiError(
				`Permission with key '${permission.key}' already exists.`,
				409,
			);
		}

		// Check if the permission's title already exists
		const existingPermissionWithTitle: Permission | null = await repository
			.createQueryBuilder("permission")
			.where("permission.title = :title", { title: permission.title })
			.getOne();
		if (existingPermissionWithTitle) {
			throw new ApiError(
				`Permission with title '${permission.title}' already exists.`,
				409,
			);
		}

		// Save the new permission
		return await repository.save(permission);
	}

	public async update(
		permission: Permission,
		manager?: EntityManager,
	): Promise<Permission> {
		// Get the repository
		const repository: Repository<Permission> = this.getRepository(manager);

		// Check if the permission exists
		const existingPermission: Permission | null = await repository
			.createQueryBuilder("permission")
			.where("permission.id = :id", { id: permission.id })
			.getOne();
		if (!existingPermission) {
			throw new ApiError(
				`Permission with ID '${permission.id}' not found.`,
				404,
			);
		}

		// Check if other permissions with the same title exist
		const existingPermissionWithTitle: Permission | null = await repository
			.createQueryBuilder("permission")
			.where("permission.id != :id", { id: permission.id })
			.andWhere("permission.title = :title", { title: permission.title })
			.getOne();
		if (existingPermissionWithTitle) {
			throw new ApiError(
				`Permission with title '${permission.title}' already exists.`,
				409,
			);
		}

		// Save the updated permission
		return await repository.save(permission);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<Permission>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for roleId if provided
		if (query.roleId) {
			const roleIdValue: string = query.roleId as string;
			if (roleIdValue.includes(",")) {
				// Handle comma-separated values
				const roleIdValues: string[] = roleIdValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere("roles.id IN (:...roleIdValues)", {
					roleIdValues,
				});
			} else {
				queryBuilder.andWhere("roles.id = :roleId", {
					roleId: roleIdValue,
				});
			}
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<Permission>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"title",
			"key",
			"description",
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
				`LOWER(REGEXP_REPLACE(roles.title, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(permission.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		}
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<Permission>,
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
					"CAST(SUBSTRING(permission.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`permission.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<Permission>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default PermissionRepository;
