import { Service } from "typedi";
import { plainToInstance } from "class-transformer";
import axios from "axios";
import bcrypt from "bcrypt";
import AppDataSource from "../config/database";
import EntityMap from "../constants/entity-map";
import RoleMap from "../constants/role-map";
import Role from "../database/entities/Role";
import User from "../database/entities/User";
import Driver from "../database/entities/Driver";
import PublicTripAccess from "../database/entities/PublicTripAccess";
import UserStatus from "../database/enums/UserStatus";
import RoleRepository from "../repositories/role.repository";
import UserRepository from "../repositories/user.repository";
import DriverRepository from "../repositories/driver.repository";
import PublicTripAccessRepository from "../repositories/pulic-trip-access.repository";
import IAuthenticationService from "./interfaces/IAuthenticationService";
import IdCounterService from "./id-counter.service";
import UserService from "./user.service";
import JwtService from "./jwt.service";
import JwtTokenDto from "../dtos/jwt/jwt-token.dto";
import JwtPayloadDto from "../dtos/jwt/jwt-payload.dto";
import JwtClaimsDto from "../dtos/jwt/jwt-claims.dto";
import DriverLoginDto from "../dtos/authentication/driver-login.dto";
import AzureTokenDto from "../dtos/authentication/azure-token.dto";
import UserLoginResponseDto from "../dtos/authentication/user-login-response.dto";
import DetailedUserResponseDto from "../dtos/user/detailed-user-response.dto";
import RefreshTokenDto from "../dtos/jwt/refresh-token.dto";
import JwtAnonymousTokenDto from "../dtos/jwt/jwt-anonymous-token.dto";
import JwtAnonymousPayloadDto from "../dtos/jwt/jwt-anonymous-payload.dto";
import AnonymousAccessCodeDto from "../dtos/authentication/anonymous-access-code.dto";
import ApiError from "../templates/api-error";
import Trip from "../database/entities/Trip";

@Service()
class AuthenticationService implements IAuthenticationService {
	constructor(
		private readonly userRepository: UserRepository,
		private readonly driverRepository: DriverRepository,
		private readonly roleRepository: RoleRepository,
		private readonly jwtService: JwtService,
		private readonly userService: UserService,
		private readonly idCounterService: IdCounterService,
		private readonly publicTripAccessRepository: PublicTripAccessRepository,
	) {}

	public async loginAsDriver(data: DriverLoginDto): Promise<JwtTokenDto> {
		try {
			// Lookup driver by username
			const driver: Driver | null =
				await this.driverRepository.findOneByUsername(data.username);
			if (!driver) {
				throw new ApiError(
					`Driver with username '${data.username}' not found.`,
					404,
				);
			}

			// Validate password
			const isValidPassword: boolean = await bcrypt.compare(
				data.password,
				driver.hashedPassword,
			);
			if (!isValidPassword) {
				throw new ApiError("Password is incorrect.", 401);
			}

			// Issue JWT access and refresh tokens
			const token: JwtTokenDto = await this.jwtService.generateToken({
				id: driver.id,
				email: driver.email ?? "",
				role: driver.role.key,
				status: driver.status,
			});
			return token;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to login as driver.", 500, error);
		}
	}

	public async validateAzureToken(
		data: AzureTokenDto,
	): Promise<UserLoginResponseDto> {
		try {
			// Validate token with Microsoft Graph API
			const response = await axios.get(
				"https://graph.microsoft.com/v1.0/me",
				{
					headers: {
						Authorization: `Bearer ${data.accessToken}`,
					},
				},
			);
			const userInfo = response.data;

			// Check if user exists
			let user: User | null =
				await this.userRepository.findOneByMicrosoftIdAndEmail(
					userInfo.id,
					userInfo.mail,
				);

			if (!user) {
				// Create new user if they are not exist
				await AppDataSource.transaction(async (manager) => {
					// Get employee as default role
					const role: Role | null =
						await this.roleRepository.findOneByKey(
							RoleMap.EMPLOYEE,
							manager,
						);
					if (!role) {
						throw new ApiError(
							`Failed to fetch role with key '${RoleMap.EMPLOYEE}'`,
							500,
						);
					}

					// Create new user entity
					const userId: string =
						await this.idCounterService.generateId(
							EntityMap.USER,
							manager,
						);
					const newUser: User = new User(
						userId,
						userInfo.id,
						userInfo.displayName,
						userInfo.mail,
						role,
						userInfo.mobilePhone,
						null,
					);
					await this.userRepository.create(newUser, manager);

					// Fetch the created user
					user = await this.userRepository.findOne(userId, manager);
					if (!user) {
						throw new ApiError(
							`Failed to fetch created user with id '${newUser.id}'`,
							404,
						);
					}
				});
			}

			// Issue JWT access and refresh tokens
			const token: JwtTokenDto = await this.jwtService.generateToken({
				id: user!.id,
				email: user!.email,
				role: user!.role.key,
				status: user!.status,
			});

			// Transform the logged in user to DTO
			const userResponseDto: DetailedUserResponseDto = plainToInstance(
				DetailedUserResponseDto,
				user,
				{
					excludeExtraneousValues: true,
				},
			);

			return {
				user: userResponseDto,
				token: token,
			};
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to validate Azure token.", 500, error);
		}
	}

	public async refreshToken(data: RefreshTokenDto): Promise<JwtTokenDto> {
		try {
			// Verify the provided refresh token
			const claims: JwtClaimsDto | JwtAnonymousPayloadDto =
				await this.jwtService.verifyToken(data.token);
			if (claims instanceof JwtAnonymousPayloadDto) {
				throw new ApiError(
					"Anonymous tokens cannot be refreshed.",
					403,
				);
			}

			// Extract payload from claims
			const payload: JwtPayloadDto = claims.getPayload();

			// Check if the token belongs to an existing user/driver
			const user: User | null = await this.userRepository.findOne(
				payload.id,
			);
			const driver: Driver | null = await this.driverRepository.findOne(
				payload.id,
			);
			if (!user && !driver) {
				throw new ApiError("Token does not belong to any user.", 403);
			}

			// Check account status
			const accountStatus: UserStatus = user
				? user.status
				: driver!.status;
			if (accountStatus === UserStatus.SUSPENDED) {
				throw new ApiError("User is suspended.", 403);
			}

			// Re-issue new access and refresh tokens
			const token: JwtTokenDto =
				await this.jwtService.generateToken(payload);
			return token;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to refresh token.", 500, error);
		}
	}

	public async issueTokenForAnonymous(
		data: AnonymousAccessCodeDto,
	): Promise<JwtAnonymousTokenDto> {
		try {
			// Lookup public trip access using the code
			const publicTripAccess: PublicTripAccess =
				await this.publicTripAccessRepository.findByCode(data.code);

			// Ensure the code is linked to a trip
			const trip = publicTripAccess.trip;
			if (!trip) {
				throw new ApiError(
					"Invalid public trip access code: Trip not found.",
					404,
				);
			}

			// Validate timing and handle expired access
			await this.validateTripAccessTiming(trip);

			// Generate anonymous payload with trip times
			const payload = new JwtAnonymousPayloadDto();

			// Issue JWT access token
			const token: JwtAnonymousTokenDto =
				await this.jwtService.generateAnonymousToken(payload);
			return token;
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to issue token for anonymous access.",
						500,
						error,
					);
		}
	}

	private async validateTripAccessTiming(trip: Trip): Promise<void> {
		// Get current date (start of day) and trip dates
		const now = new Date();
		const currentDate = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
		);

		const departureDate = new Date(trip.departureTime);
		const departureDateOnly = new Date(
			departureDate.getFullYear(),
			departureDate.getMonth(),
			departureDate.getDate(),
		);

		const arrivalDate = new Date(trip.arrivalTime);
		const arrivalDateOnly = new Date(
			arrivalDate.getFullYear(),
			arrivalDate.getMonth(),
			arrivalDate.getDate(),
		);

		const validStartDate = new Date(departureDateOnly);
		validStartDate.setDate(validStartDate.getDate() - 2);

		const validEndDate = new Date(arrivalDateOnly);
		validEndDate.setDate(validEndDate.getDate() + 1);

		// Check if current date is too early
		if (currentDate < validStartDate) {
			throw new ApiError(
				`This link is not yet valid. It will be valid 2 days before the trip's departure date.`,
				403,
			);
		}

		// Check if current date is too late (more than 1 day after arrival)
		if (currentDate > validEndDate) {
			throw new ApiError(`This link is no longer valid.`, 410);
		}
	}
}

export default AuthenticationService;
