import { EntityManager } from "typeorm";

interface IIdCounterService {
	/**
	 * Generates a list of IDs for a given table.
	 * This method increments the current ID for the specified table and returns an array of new IDs
	 * @param tableName - The name of the table for which to generate IDs.
	 * @param count - The number of IDs to generate.
	 * @param manager - The EntityManager to use for the transaction.
	 */
	generateIds(
		tableName: string,
		count: number,
		manager: EntityManager,
	): Promise<string[]>;

	/**
	 * Generates a single ID for a given table.
	 * This method increments the current ID for the specified table and returns a new ID.
	 * @param tableName - The name of the table for which to generate an ID.
	 * @param manager - The EntityManager to use for the transaction.
	 */
	generateId(tableName: string, manager: EntityManager): Promise<string>;
}

export default IIdCounterService;
