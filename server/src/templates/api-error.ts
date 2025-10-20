class ApiError extends Error {
	public readonly statusCode: number;
	public readonly details: unknown;

	constructor(
		message: string = "Internal Server Error",
		statusCode: number = 500,
		details: unknown = null,
	) {
		super(message);
		Object.setPrototypeOf(this, new.target.prototype);

		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.details = details;

		Error.captureStackTrace(this, this.constructor);
	}
}

export default ApiError;
