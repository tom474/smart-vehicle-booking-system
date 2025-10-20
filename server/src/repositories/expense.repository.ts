import { Service } from "typedi";
import {
	DeleteResult,
	EntityManager,
	Repository,
	SelectQueryBuilder,
} from "typeorm";
import AppDataSource from "../config/database";
import Expense from "../database/entities/Expense";
import Pagination from "../templates/pagination";
import ApiError from "../templates/api-error";

@Service()
class ExpenseRepository {
	private readonly expenseRepository: Repository<Expense> =
		AppDataSource.getRepository(Expense);

	private getRepository(manager?: EntityManager): Repository<Expense> {
		return manager
			? manager.getRepository(Expense)
			: this.expenseRepository;
	}

	public async find(
		pagination?: Pagination,
		query?: Record<string, unknown>,
		manager?: EntityManager,
	): Promise<Expense[]> {
		// Get the repository
		const repository: Repository<Expense> = this.getRepository(manager);

		// Create query builder
		const queryBuilder: SelectQueryBuilder<Expense> = repository
			.createQueryBuilder("expense")
			.leftJoinAndSelect("expense.driver", "driver")
			.leftJoinAndSelect("expense.trip", "trip")
			.leftJoinAndSelect("expense.vehicleService", "vehicle_service");

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
				queryBuilder.orderBy("expense.updatedAt", "DESC");
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
	): Promise<Expense | null> {
		// Get the repository
		const repository: Repository<Expense> = this.getRepository(manager);

		// Find the expense by id
		const expense: Expense | null = await repository
			.createQueryBuilder("expense")
			.leftJoinAndSelect("expense.driver", "driver")
			.leftJoinAndSelect("expense.trip", "trip")
			.leftJoinAndSelect("expense.vehicleService", "vehicle_service")
			.where("expense.id = :id", { id })
			.getOne();

		return expense;
	}

	public async create(
		expense: Expense,
		manager?: EntityManager,
	): Promise<Expense> {
		// Get the repository
		const repository: Repository<Expense> = this.getRepository(manager);

		// Check if the expense's ID already exists
		const existingExpenseWithId: Expense | null = await repository
			.createQueryBuilder("expense")
			.where("expense.id = :id", { id: expense.id })
			.getOne();
		if (existingExpenseWithId) {
			throw new ApiError(
				`Expense with ID '${expense.id}' already exists.`,
				409,
			);
		}

		// Save the new expense
		return await repository.save(expense);
	}

	public async update(
		expense: Expense,
		manager?: EntityManager,
	): Promise<Expense> {
		// Get the repository
		const repository: Repository<Expense> = this.getRepository(manager);

		// Check if the expense exists
		const existingExpense: Expense | null = await repository
			.createQueryBuilder("expense")
			.where("expense.id = :id", { id: expense.id })
			.getOne();
		if (!existingExpense) {
			throw new ApiError(
				`Expense with ID '${expense.id}' not found.`,
				404,
			);
		}

		// Save the updated expense
		return await repository.save(expense);
	}

	public async delete(
		id: string,
		manager?: EntityManager,
	): Promise<DeleteResult> {
		// Get the repository
		const repository: Repository<Expense> = this.getRepository(manager);

		// Check if the expense exists
		const existingExpense: Expense | null = await repository
			.createQueryBuilder("expense")
			.where("expense.id = :id", { id })
			.getOne();
		if (!existingExpense) {
			throw new ApiError(`Expense with ID '${id}' not found.`, 404);
		}

		// Delete the expense
		return await repository.delete(id);
	}

	private async applyFilters(
		queryBuilder: SelectQueryBuilder<Expense>,
		query: Record<string, unknown>,
	): Promise<void> {
		// Apply filter for type if provided
		if (query.type) {
			const typeValue: string = query.type as string;
			if (typeValue.includes(",")) {
				const typeValues: string[] = typeValue
					.split(",")
					.map((val) => val.trim());
				queryBuilder.andWhere("expense.type IN (:...typeValues)", {
					typeValues,
				});
			} else {
				queryBuilder.andWhere("expense.type = :type", {
					type: typeValue,
				});
			}
		}

		// Apply filter for status if provided
		if (query.status) {
			const statusValue: string = query.status as string;
			if (statusValue.includes(",")) {
				const statusValues: string[] = statusValue
					.split(",")
					.map((value) => value.trim());
				queryBuilder.andWhere("expense.status IN (:...statusValues)", {
					statusValues,
				});
			} else {
				queryBuilder.andWhere("expense.status = :status", {
					status: statusValue,
				});
			}
		}

		// Apply filter for minAmount if provided
		if (query.minAmount) {
			queryBuilder.andWhere("expense.amount >= :minAmount", {
				minAmount: query.minAmount,
			});
		}

		// Apply filter for maxAmount if provided
		if (query.maxAmount) {
			queryBuilder.andWhere("expense.amount <= :maxAmount", {
				maxAmount: query.maxAmount,
			});
		}

		// Apply filter for createdAfter if provided
		if (query.createdAfter) {
			queryBuilder.andWhere("expense.createdAt >= :createdAfter", {
				createdAfter: query.createdAfter,
			});
		}

		// Apply filter for createdBefore if provided
		if (query.createdBefore) {
			queryBuilder.andWhere("expense.createdAt <= :createdBefore", {
				createdBefore: query.createdBefore,
			});
		}

		// Apply filter for driverId if provided
		if (query.driverId) {
			queryBuilder.andWhere("driver.id = :driverId", {
				driverId: query.driverId,
			});
		}
	}

	private async applySearch(
		queryBuilder: SelectQueryBuilder<Expense>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedSearchFields: string[] = [
			"id",
			"description",
			"driverName",
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
		if (searchField === "driverName") {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(driver.name, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		} else {
			queryBuilder.andWhere(
				`LOWER(REGEXP_REPLACE(expense.${searchField}, '[^a-zA-Z0-9]', '', 'g')) LIKE :searchPattern`,
				{
					searchPattern: `%${normalizedSearchValue}%`,
				},
			);
		}
	}

	private async applyOrderBy(
		queryBuilder: SelectQueryBuilder<Expense>,
		query: Record<string, unknown>,
	): Promise<void> {
		const allowedOrderFields: string[] = [
			"id",
			"description",
			"amount",
			"createdAt",
			"updatedAt",
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
					"CAST(SUBSTRING(expense.id, 5) AS INTEGER)",
					"numeric_id",
				)
				.orderBy("numeric_id", orderDirection as "ASC" | "DESC");
		} else {
			queryBuilder.orderBy(
				`expense.${orderField}`,
				orderDirection as "ASC" | "DESC",
			);
		}
	}

	private async applyPagination(
		queryBuilder: SelectQueryBuilder<Expense>,
		pagination: Pagination,
	): Promise<void> {
		// Calculate skip for pagination
		const skip: number = (pagination.page - 1) * pagination.limit;

		// Apply pagination to the query builder
		queryBuilder.skip(skip).take(pagination.limit);
	}
}

export default ExpenseRepository;
