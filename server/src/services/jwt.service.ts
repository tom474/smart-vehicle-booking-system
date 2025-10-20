import { Service } from "typedi";
import { instanceToPlain, plainToInstance } from "class-transformer";
import { JWT_SECRET } from "../config/env";
import jwt from "jsonwebtoken";
import RoleMap from "../constants/role-map";
import IJwtService from "./interfaces/IJwtService";
import JwtPayloadDto from "../dtos/jwt/jwt-payload.dto";
import JwtTokenDto from "../dtos/jwt/jwt-token.dto";
import JwtClaimsDto from "../dtos/jwt/jwt-claims.dto";
import JwtAnonymousPayloadDto from "../dtos/jwt/jwt-anonymous-payload.dto";
import JwtAnonymousTokenDto from "../dtos/jwt/jwt-anonymous-token.dto";
import RefreshTokenDto from "../dtos/jwt/refresh-token.dto";
import JwtToken from "../templates/jwt-token";
import ApiError from "../templates/api-error";

@Service()
class JwtService implements IJwtService {
	private getJwtSecret(): string {
		if (!JWT_SECRET) {
			throw new ApiError(
				"JWT_SECRET is not defined in environment variables.",
				500,
			);
		}
		return JWT_SECRET;
	}

	public async generateToken(payload: JwtPayloadDto): Promise<JwtTokenDto> {
		// Get the JWT secret
		const jwtSecret: string = this.getJwtSecret();

		// Sign access token
		const accessToken: string = await new Promise((resolve, reject) => {
			jwt.sign(
				payload,
				jwtSecret,
				{ expiresIn: "1h", algorithm: "HS256" },
				(error, token) => {
					if (error) {
						reject(
							new ApiError(
								"Failed to sign access token.",
								500,
								error,
							),
						);
					} else {
						resolve(token as string);
					}
				},
			);
		});

		// Sign refresh token
		const refreshToken: string = await new Promise((resolve, reject) => {
			jwt.sign(
				payload,
				jwtSecret,
				{ expiresIn: "30d", algorithm: "HS256" },
				(error, token) => {
					if (error) {
						reject(
							new ApiError(
								"Failed to sign refresh token.",
								500,
								error,
							),
						);
					} else {
						resolve(token as string);
					}
				},
			);
		});

		// Transform jwt token to DTO
		const jwtToken: JwtToken = new JwtToken(accessToken, refreshToken);
		const jwtTokenResponseDto: JwtTokenDto = plainToInstance(
			JwtTokenDto,
			jwtToken,
			{ excludeExtraneousValues: true },
		);

		return jwtTokenResponseDto;
	}

	public async generateAnonymousToken(
		payload: JwtAnonymousPayloadDto,
	): Promise<JwtAnonymousTokenDto> {
		// Get the JWT secret
		const jwtSecret: string = this.getJwtSecret();

		const plainPayload: Record<string, unknown> = instanceToPlain(payload);

		const token: string = await new Promise((resolve, reject) => {
			jwt.sign(
				plainPayload,
				jwtSecret,
				{ algorithm: "HS256", noTimestamp: true },
				(error, token) => {
					if (error)
						reject(
							new ApiError(
								"Failed to sign anonymous token.",
								500,
								error,
							),
						);
					else resolve(token!);
				},
			);
		});

		return new JwtAnonymousTokenDto(token);
	}

	public async verifyToken(
		token: string,
	): Promise<JwtClaimsDto | JwtAnonymousPayloadDto> {
		// Get the JWT secret
		const jwtSecret: string = this.getJwtSecret();

		return new Promise((resolve, reject) => {
			jwt.verify(
				token,
				jwtSecret,
				{ algorithms: ["HS256"] },
				(error, decoded) => {
					if (error) {
						return reject(
							new ApiError(
								"Invalid or expired token.",
								403,
								error,
							),
						);
					}

					// Ensure decoded is an object
					if (!decoded || typeof decoded !== "object") {
						return reject(new ApiError("Malformed token.", 400));
					}

					// Determine if it's an anonymous token or a regular token
					let claims: JwtClaimsDto | JwtAnonymousPayloadDto;
					if (decoded.role === RoleMap.ANONYMOUS) {
						claims = plainToInstance(
							JwtAnonymousPayloadDto,
							decoded,
						);
					} else {
						claims = plainToInstance(JwtClaimsDto, decoded);
					}

					return resolve(claims);
				},
			);
		});
	}

	public async refreshToken(data: RefreshTokenDto): Promise<JwtTokenDto> {
		// Verify the refresh token
		const verified: JwtClaimsDto | JwtAnonymousPayloadDto =
			await this.verifyToken(data.token);

		// Prevent refreshing anonymous tokens
		if (verified instanceof JwtAnonymousPayloadDto) {
			throw new ApiError("Anonymous tokens cannot be refreshed.", 403);
		}

		// Generate new tokens
		const payload: JwtPayloadDto = verified.getPayload();
		return await this.generateToken(payload);
	}
}

export default JwtService;
