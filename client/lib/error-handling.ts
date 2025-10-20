// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function apiErrHandler(err: any): string | undefined {
	console.log(err);

	const isApiError =
		typeof err === "object" &&
		err !== null &&
		// "method" in err &&
		// "url" in err &&
		"statusCode" in err && // err.statusCode >= 400 && err.statusCode < 400 &&
		"message" in err;

	if (isApiError) return err.message;
	return undefined;
}
