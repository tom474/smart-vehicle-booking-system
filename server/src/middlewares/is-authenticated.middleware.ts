import { NextFunction, Request, Response } from "express";
import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";
import { Service } from "typedi";
import RoleMap from "../constants/role-map";
import User from "../database/entities/User";
import Driver from "../database/entities/Driver";
import UserStatus from "../database/enums/UserStatus";
import UserRepository from "../repositories/user.repository";
import DriverRepository from "../repositories/driver.repository";
import JwtService from "../services/jwt.service";
import JwtClaimsDto from "../dtos/jwt/jwt-claims.dto";
import JwtAnonymousPayloadDto from "../dtos/jwt/jwt-anonymous-payload.dto";
import CurrentUser from "../templates/current-user";
import ApiError from "../templates/api-error";

@Service()
@Middleware({ type: "before" })
class IsAuthenticatedMiddleware implements ExpressMiddlewareInterface {
	constructor(
		private userRepository: UserRepository,
		private driverRepository: DriverRepository,
		private jwtService: JwtService,
	) {}

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
			const result: JwtClaimsDto | JwtAnonymousPayloadDto =
				await this.jwtService.verifyToken(token);

			// Reject anonymous token based on its class
			if (result instanceof JwtAnonymousPayloadDto) {
				return next(
					new ApiError(
						"Anonymous is not allowed for this operation.",
						403,
					),
				);
			}

			// Check if the user exists in the database
			let user: User | Driver | null;
			if (result.role === RoleMap.DRIVER) {
				user = await this.driverRepository.findOneById(result.id);
				if (!user) {
					return next(
						new ApiError(
							`Driver with ID ${result.id} not found.`,
							404,
						),
					);
				}
			} else {
				user = await this.userRepository.findOne(result.id);
				if (!user) {
					return next(
						new ApiError(
							`User with ID ${result.id} not found.`,
							404,
						),
					);
				}
			}

			// Check if the user is suspended
			if (user.status === UserStatus.SUSPENDED) {
				return next(new ApiError("User is suspended.", 403));
			}

			// Save the current user in the request cookies
			const currentUser: CurrentUser = new CurrentUser(
				user.id,
				user.role.key,
			);
			req.cookies.currentUser = currentUser;

			next();
		} catch (error: unknown) {
			return next(
				error instanceof ApiError
					? error
					: new ApiError("Failed to authenticate user.", 403, error),
			);
		}
	}
}

export default IsAuthenticatedMiddleware;
