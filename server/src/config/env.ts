import dotenv from "dotenv";

if (process.env.NODE_ENV !== "production") {
	dotenv.config({ path: ".env" });
}

export const {
	NODE_ENV,
	PORT,
	DB_HOST,
	DB_PORT,
	DB_USERNAME,
	DB_PASSWORD,
	DB_NAME,
	JWT_SECRET,
	GOOGLE_MAPS_API_KEY,
	MICROSOFT_CLIENT_ID,
	MICROSOFT_CLIENT_SECRET,
	MICROSOFT_TENANT_ID,
	MICROSOFT_CALLBACK_URL,
	CLIENT_URL,
	BLOB_CONTAINER_SAS_URL,
} = process.env;
