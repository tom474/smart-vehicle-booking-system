import { Response, Request } from "express";
import {
	Body,
	Controller,
	Get,
	Param,
	Put,
	QueryParams,
	Req,
	Res,
	UseBefore,
} from "routing-controllers";
import { Service } from "typedi";
import IsAuthenticatedMiddleware from "../middlewares/is-authenticated.middleware";
import HasPermissionMiddleware from "../middlewares/has-permission.middleware";
import PermissionMap from "../constants/permission-map";
import SettingService from "../services/setting.service";
import SettingResponseDto from "../dtos/setting/setting-response.dto";
import UpdateSettingDto from "../dtos/setting/update-setting.dto";
import CurrentUser from "../templates/current-user";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/settings")
class SettingController {
	constructor(private readonly settingService: SettingService) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.SETTING_GET),
	)
	public async getSettings(
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch settings
		const result: SettingResponseDto[] =
			await this.settingService.getSettings(currentUser, query);

		// Create API response
		const response: ApiResponse<SettingResponseDto[]> = new ApiResponse<
			SettingResponseDto[]
		>(200, "Settings retrieved successfully.", result, {
			query: {
				searchField: query.searchField,
				searchValue: query.searchValue,
				orderField: query.orderField,
				orderDirection: query.orderDirection,
			},
		});

		return res.status(response.statusCode).json(response);
	}

	@Get("/support-contacts")
	public async getSupportContactSettings(@Res() res: Response) {
		// Fetch support contact settings
		const result: SettingResponseDto[] =
			await this.settingService.getSupportContactSettings();

		// Create API response
		const response: ApiResponse<SettingResponseDto[]> = new ApiResponse<
			SettingResponseDto[]
		>(200, "Support contact settings retrieved successfully.", result);

		return res.status(response.statusCode).json(response);
	}

	@Get("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.SETTING_GET),
	)
	public async getSettingById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch setting by ID
		const result: SettingResponseDto =
			await this.settingService.getSettingById(currentUser, id);

		// Create API response
		const response: ApiResponse<SettingResponseDto> =
			new ApiResponse<SettingResponseDto>(
				200,
				`Setting with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.SETTING_UPDATE),
	)
	public async updateSetting(
		@Param("id") id: string,
		@Body() data: UpdateSettingDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Update setting by ID
		const result: SettingResponseDto =
			await this.settingService.updateSetting(currentUser, id, data);

		// Create API response
		const response: ApiResponse<SettingResponseDto> =
			new ApiResponse<SettingResponseDto>(
				200,
				`Setting with ID '${id}' updated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default SettingController;
