import { Service } from "typedi";
import { EntityManager } from "typeorm";
import IdPrefixMap from "../constants/id-prefix-map";
import IdCounter from "../database/entities/IdCounter";
import IdCounterRepository from "../repositories/id-counter.repository";
import IIdCounterService from "./interfaces/IIdCounterService";
import ApiError from "../templates/api-error";

@Service()
class IdCounterService implements IIdCounterService {
	constructor(private readonly idCounterRepository: IdCounterRepository) {}

	private getIdPrefix(tableName: string): string {
		try {
			const prefix: string = IdPrefixMap[tableName];
			if (!prefix) {
				throw new ApiError(
					`No prefix defined for table "${tableName}".`,
					400,
				);
			}
			return prefix;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to get ID prefix for table "${tableName}".`,
						500,
						error,
					);
		}
	}

	public async generateIds(
		tableName: string,
		count: number,
		manager: EntityManager,
	): Promise<string[]> {
		try {
			// Ensure the id counter exists for the specified table
			await this.idCounterRepository.ensureExists(
				tableName,
				this.getIdPrefix(tableName),
				manager,
			);

			// Find and lock the id counter for the specified table
			const idCounter: IdCounter | null =
				await this.idCounterRepository.findOneAndLock(
					tableName,
					manager,
				);
			if (!idCounter) {
				throw new ApiError(
					`Failed to find and lock ID counter for table "${tableName}".`,
					404,
				);
			}

			// Generate new IDs based on the current ID and the count requested
			const ids: string[] = [];
			for (let i = 1; i <= count; i++) {
				const newId = idCounter.currentId + i;
				ids.push(`${idCounter.prefix}-${newId}`);
			}

			// Update the current ID in the id counter
			idCounter.currentId += count;
			await this.idCounterRepository.update(idCounter, manager);

			return ids;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to generate IDs for ${tableName}`,
						500,
						error,
					);
		}
	}

	public async generateId(
		tableName: string,
		manager: EntityManager,
	): Promise<string> {
		try {
			// Generate a single ID by calling generateIds with count 1
			const id: string = (
				await this.generateIds(tableName, 1, manager)
			)[0];

			return id;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						`Failed to generate ID for ${tableName}`,
						500,
						error,
					);
		}
	}
}

export default IdCounterService;
