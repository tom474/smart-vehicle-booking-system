import { NextFunction, Request, Response } from "express";
import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";
import { Service } from "typedi";
import RoleMap from "../constants/role-map";
import JwtService from "../services/jwt.service";
import CurrentUser from "../templates/current-user";
import ApiError from "../templates/api-error";

@Service()
@Middleware({ type: "before" })
class IsAnonymousMiddleware implements ExpressMiddlewareInterface {
	constructor(private jwtService: JwtService) {}

	async use(req: Request, res: Response, next: NextFunction) {
		// Check for the authentication header
		const authenticationHeader: string | undefined =
			req.headers["authorization"];
		if (
			!authenticationHeader ||
			!authenticationHeader.startsWith("Bearer ")
		) {
			return next(new ApiError("Authentication token is missing.", 401));
		}

		// Extract the token from the header
		const token: string = authenticationHeader.substring(7);

		try {
			// Verify the token
			await this.jwtService.verifyToken(token);

			// Token is valid and anonymous
			const currentUser: CurrentUser = new CurrentUser(
				"none",
				RoleMap.ANONYMOUS,
			);
			req.cookies.currentUser = currentUser;

			next();
		} catch (error: unknown) {
			return next(
				error instanceof ApiError
					? error
					: new ApiError(
							"Failed to authenticate anonymous token.",
							403,
							error,
						),
			);
		}
	}
}

export default IsAnonymousMiddleware;
