import { Service } from "typedi";
import { EntityManager, Repository, SelectQueryBuilder } from "typeorm";
import AppDataSource from "../config/database";
import Setting from "../database/entities/Setting";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class SettingRepository {
	private readonly settingRepository: Repository<Setting> =
		AppDataSource.getRepository(Setting);

	private getRepository(manager?: EntityManager): Repository<Setting> {
		return manager
			? manager.getRepository(Setting)
			: this.settingRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<Setting[]> {
		// Get the repository
		const repository: Repository<Setting> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Setting> =
			repository.createQueryBuilder("setting");

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
						"CAST(SUBSTRING(setting.id, 5) AS INTEGER)",
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
	): Promise<Setting | null> {
		// Get the repository
		const repository: Repository<Setting> = this.getRepository(manager);

		// Find setting by ID
		const setting: Setting | null = await repository
			.createQueryBuilder("setting")
			.where("setting.id = :id", { id })
			.getOne();

		return setting;
	}

	public async findOneByKey(
		key: string,
		manager?: EntityManager,
	): Promise<Setting | null> {
		// Get the repository
		const repository: Repository<Setting> = this.getRepository(manager);

		// Find setting by key
		const setting: Setting | null = await repository
			.createQueryBuilder("setting")
			.where("setting.key = :key", { key })
			.getOne();

		return setting;
	}

	public async create(
		setting: Setting,
		manager?: EntityManager,
	): Promise<Setting> {
		// Get the repository
		const repository: Repository<Setting> = this.getRepository(manager);

		// Check if the setting's ID already exists
		const existingSettingWithId = await repository
			.createQueryBuilder("setting")
			.where("setting.id = :id", { id: setting.id })
			.getOne();
		if (existingSettingWithId) {
			throw new ApiError(
				`Setting with ID '${setting.id}' already exists.`,
				409,
			);
		}

		// Check if the setting's title already exists
		const existingSettingWithTitle = await repository
			.createQueryBuilder("setting")
			.where("setting.title = :title", { title: setting.title })
			.getOne();
		if (existingSettingWithTitle) {
			throw new ApiError(
				`Setting with title '${setting.title}' already exists.`,
				409,
			);
		}

		// Check if the setting's key already exists
		const existingSettingWithKey = await repository
			.createQueryBuilder("setting")
			.where("setting.key = :key", { key: setting.key })
			.getOne();
		if (existingSettingWithKey) {
			throw new ApiError(
				`Setting with key '${setting.key}' already exists.`,
				409,
			);
		}

		// Save the new setting
		return await repository.save(setting);
	}

	public async update(
		setting: Setting,
		manager?: EntityManager,
	): Promise<Setting> {
		// Get the repository
		const repository: Repository<Setting> = this.getRepository(manager);

		// Check if the setting exists
		const existingSetting: Setting | null = await repository
			.createQueryBuilder("setting")
			.where("setting.id = :id", { id: setting.id })
			.getOne();
		if (!existingSetting) {
			throw new ApiError(
				`Setting with ID '${setting.id}' not found.`,
				404,
			);
		}

		// Check if other settings with the same title exist
		const existingSettingWithTitle: Setting | null = await repository
			.createQueryBuilder("setting")
			.where("setting.id != :id", { id: setting.id })
			.andWhere("setting.title = :title", { title: setting.title })
			.getOne();
		if (existingSettingWithTitle) {
			throw new ApiError(
				`Setting with title '${setting.title}' already exists.`,
				409,
			);
		}

		// Save the updated setting
		return await repository.save(setting);
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<Setting>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"title",
			"key",
			"value",
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
			`LOWER(REGEXP_REPLACE(setting.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
			{
				searchPattern: `%${normalizedSearchValue}%`,
			},
		);
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<Setting>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"title",
			"key",
			"value",
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
				`setting.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<Setting>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default SettingRepository;
