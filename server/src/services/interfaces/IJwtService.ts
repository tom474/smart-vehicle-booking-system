import JwtAnonymousPayloadDto from "../../dtos/jwt/jwt-anonymous-payload.dto";
import JwtAnonymousTokenDto from "../../dtos/jwt/jwt-anonymous-token.dto";
import JwtClaimsDto from "../../dtos/jwt/jwt-claims.dto";
import JwtPayloadDto from "../../dtos/jwt/jwt-payload.dto";
import JwtTokenDto from "../../dtos/jwt/jwt-token.dto";
import RefreshTokenDto from "../../dtos/jwt/refresh-token.dto";

interface IJwtService {
	/**
	 * Generates an access token and a refresh token
	 * @param payload JWT payload
	 * @returns An object containing the access token and refresh token
	 */
	generateToken(payload: JwtPayloadDto): Promise<JwtTokenDto>;

	/**
	 * Generates an anonymous access token
	 * @param payload JWT anonymous payload
	 * @returns An object containing the anonymous access token
	 */
	generateAnonymousToken(
		payload: JwtAnonymousPayloadDto,
	): Promise<JwtAnonymousTokenDto>;

	/**
	 * Verifies a JWT token (access or refresh) and returns the claims
	 * @param token JWT token to verify
	 * @returns The JWT claims if the token is valid
	 * @throws ApiError if the token is invalid or expired
	 */
	verifyToken(token: string): Promise<JwtClaimsDto | JwtAnonymousPayloadDto>;

	/**
	 * Refreshes an access token using a valid refresh token
	 * @param data Refresh token data transfer object
	 * @returns An object containing the new access token and refresh token
	 */
	refreshToken(data: RefreshTokenDto): Promise<JwtTokenDto>;
}

export default IJwtService;
