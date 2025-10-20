import AppDataSource from "../config/database";
import ApiError from "../templates/api-error";
import logger from "../utils/logger";

const initializeDatabase = async (): Promise<void> => {
	try {
		await AppDataSource.initialize();
		logger.info("PostgreSQL database connection established successfully!");
	} catch (error: unknown) {
		throw error instanceof ApiError
			? error
			: new ApiError(
					"Error initializing the PostgreSQL database.",
					500,
					error,
				);
	}
};

export default initializeDatabase;
