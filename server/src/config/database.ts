import "reflect-metadata";
import { DataSource } from "typeorm";
import {
	DB_HOST,
	DB_NAME,
	DB_PASSWORD,
	DB_PORT,
	DB_USERNAME,
	NODE_ENV,
} from "./env";
import AppEntities from "./entities";

const AppDataSource: DataSource = new DataSource({
	type: "postgres",
	host: DB_HOST,
	port: Number(DB_PORT),
	username: DB_USERNAME,
	password: DB_PASSWORD,
	database: DB_NAME,
	synchronize: true,
	ssl: NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
	logging: NODE_ENV === "development",
	entities: AppEntities,
	migrationsTableName: "migrations",
	migrations: [],
	subscribers: [],
});

export default AppDataSource;
