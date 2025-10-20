import { Request, Response } from "express";
import {
	BadRequestError,
	ExpressErrorMiddlewareInterface,
	Middleware,
} from "routing-controllers";
import { Service } from "typedi";
import { ValidationError } from "class-validator";
import ApiResponse from "../templates/api-response";
import ApiError from "../templates/api-error";
import logger from "../utils/logger";

interface ValidationBadRequestError extends BadRequestError {
	errors?: ValidationError[];
}

function isValidationError(error: unknown): error is ValidationBadRequestError {
	return (
		error instanceof BadRequestError &&
		"errors" in error &&
		Array.isArray((error as ValidationBadRequestError).errors)
	);
}

function extractErrors(
	errors: ValidationError[],
	parentProperty: string = "",
): Array<{
	property: string;
	constraints: Record<string, string>;
}> {
	return errors.flatMap((error: ValidationError) => {
		const propertyName = parentProperty
			? `${parentProperty}.${error.property}`
			: error.property;

		const result: Array<{
			property: string;
			constraints: Record<string, string>;
		}> = [];

		if (error.constraints) {
			result.push({
				property: propertyName,
				constraints: error.constraints,
			});
		}

		if (error.children?.length) {
			result.push(...extractErrors(error.children, propertyName));
		}

		return result;
	});
}

@Service()
@Middleware({ type: "after" })
class ErrorMiddleware implements ExpressErrorMiddlewareInterface {
	error(error: unknown, req: Request, res: Response): void {
		let statusCode: number = 500;
		let message: string = "Internal Server Error";
		let details: unknown = null;

		if (error instanceof ApiError) {
			// API error
			statusCode = error.statusCode;
			message = error.message;
			details = error.details;
		} else if (isValidationError(error)) {
			// Validation error from class-validator
			statusCode = 400;
			message = error.message;
			details = extractErrors(error.errors!);
		} else if (error instanceof Error) {
			// Generic error
			details = error;
		}

		logger.error({
			msg: message,
			method: req.method,
			url: req.originalUrl,
			statusCode,
			error: details,
		});

		const response: ApiResponse<null> = new ApiResponse(
			statusCode,
			message,
			null,
			{ details: details },
		);

		res.status(statusCode).json(response);
	}
}

export default ErrorMiddleware;
