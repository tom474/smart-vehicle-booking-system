import JwtTokenDto from "../../dtos/jwt/jwt-token.dto";
import DriverLoginDto from "../../dtos/authentication/driver-login.dto";
import AzureTokenDto from "../../dtos/authentication/azure-token.dto";
import UserLoginResponseDto from "../../dtos/authentication/user-login-response.dto";
import RefreshTokenDto from "../../dtos/jwt/refresh-token.dto";
import AnonymousAccessCodeDto from "../../dtos/authentication/anonymous-access-code.dto";
import JwtAnonymousTokenDto from "../../dtos/jwt/jwt-anonymous-token.dto";

interface IAuthenticationService {
	/**
	 * Logs in a driver using their credentials and returns a JWT token.
	 * @param data - The driver login data transfer object containing username and password.
	 * @returns A promise that resolves to a JWT token data transfer object.
	 */
	loginAsDriver(data: DriverLoginDto): Promise<JwtTokenDto>;

	/**
	 * Validates an Azure token and returns user login information along with a JWT token.
	 * @param data - The Azure token data transfer object containing the token to validate.
	 * @returns A promise that resolves to a user login response data transfer object.
	 */
	validateAzureToken(data: AzureTokenDto): Promise<UserLoginResponseDto>;

	/**
	 * Refreshes a JWT token using a refresh token.
	 * @param data - The refresh token data transfer object containing the refresh token.
	 * @returns A promise that resolves to a new JWT token data transfer object.
	 */
	refreshToken(data: RefreshTokenDto): Promise<JwtTokenDto>;

	/**
	 * Issues a JWT token for an anonymous user using an access code.
	 * @param data - The anonymous access code data transfer object containing the access code.
	 * @returns A promise that resolves to a JWT anonymous token data transfer object.
	 */
	issueTokenForAnonymous(
		data: AnonymousAccessCodeDto,
	): Promise<JwtAnonymousTokenDto>;
}

export default IAuthenticationService;
