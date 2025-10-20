import { Response } from "express";
import { Body, Post, Res, Controller } from "routing-controllers";
import { Service } from "typedi";
import AuthenticationService from "../services/authentication.service";
import JwtTokenDto from "../dtos/jwt/jwt-token.dto";
import DriverLoginDto from "../dtos/authentication/driver-login.dto";
import AzureTokenDto from "../dtos/authentication/azure-token.dto";
import UserLoginResponseDto from "../dtos/authentication/user-login-response.dto";
import RefreshTokenDto from "../dtos/jwt/refresh-token.dto";
import AnonymousAccessCodeDto from "../dtos/authentication/anonymous-access-code.dto";
import JwtAnonymousTokenDto from "../dtos/jwt/jwt-anonymous-token.dto";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/auth")
class AuthenticationController {
	constructor(private authenticationService: AuthenticationService) {}

	@Post("/driver/login")
	public async loginAsDriver(
		@Body() data: DriverLoginDto,
		@Res() res: Response,
	) {
		// Login as driver and get JWT token
		const token: JwtTokenDto =
			await this.authenticationService.loginAsDriver(data);

		// Create API response
		const response: ApiResponse<JwtTokenDto> = new ApiResponse<JwtTokenDto>(
			200,
			"Driver logged in successfully.",
			token,
		);

		return res.status(response.statusCode).json(response);
	}

	@Post("/microsoft-token")
	public async validateAzureToken(
		@Body() data: AzureTokenDto,
		@Res() res: Response,
	) {
		// Validate Azure token
		const token: UserLoginResponseDto =
			await this.authenticationService.validateAzureToken(data);

		// Create API response
		const response: ApiResponse<UserLoginResponseDto> =
			new ApiResponse<UserLoginResponseDto>(
				200,
				"User logged in successfully.",
				token,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("/refresh")
	public async refreshToken(
		@Body() data: RefreshTokenDto,
		@Res() res: Response,
	) {
		// Refresh JWT token
		const token: JwtTokenDto =
			await this.authenticationService.refreshToken(data);

		// Create API response
		const response: ApiResponse<JwtTokenDto> = new ApiResponse<JwtTokenDto>(
			200,
			"Token refreshed successfully.",
			token,
		);

		return res.status(response.statusCode).json(response);
	}

	@Post("/anonymous-token")
	public async exchangeAnonymousToken(
		@Body() data: AnonymousAccessCodeDto,
		@Res() res: Response,
	) {
		// Issue JWT token for anonymous user
		const token: JwtAnonymousTokenDto =
			await this.authenticationService.issueTokenForAnonymous(data);

		// Create API response
		const response: ApiResponse<JwtAnonymousTokenDto> =
			new ApiResponse<JwtAnonymousTokenDto>(
				200,
				"Anonymous token issued successfully.",
				token,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default AuthenticationController;
