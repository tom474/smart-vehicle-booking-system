class ApiResponse<T> {
	public readonly statusCode: number;
	public readonly message: string;
	public readonly data: T;
	public readonly metadata: Record<string, unknown>;

	constructor(
		statusCode: number = 200,
		message: string = "Action completed successfully.",
		data: T,
		metadata: Record<string, unknown> = {},
	) {
		this.statusCode = statusCode;
		this.message = message;
		this.data = data;
		this.metadata = metadata;
	}
}

export default ApiResponse;
