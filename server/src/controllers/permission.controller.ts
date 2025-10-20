import { Response, Request } from "express";
import {
	Body,
	Controller,
	Get,
	Param,
	Post,
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
import PermissionService from "../services/permission.service";
import PermissionResponseDto from "../dtos/permission/permission-response.dto";
import CreatePermissionDto from "../dtos/permission/create-permission.dto";
import UpdatePermissionDto from "../dtos/permission/update-permission.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/permissions")
class PermissionController {
	constructor(private readonly permissionService: PermissionService) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.PERMISSION_GET),
	)
	public async getPermissions(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch permissions
		const result: PermissionResponseDto[] =
			await this.permissionService.getPermissions(
				currentUser,
				pagination,
				query,
			);

		// Create API response
		const response: ApiResponse<PermissionResponseDto[]> = new ApiResponse<
			PermissionResponseDto[]
		>(200, "Permissions retrieved successfully.", result, {
			pagination: {
				page: pagination.page,
				limit: pagination.limit,
			},
			query: {
				roleId: query.roleId,
				searchField: query.searchField,
				searchValue: query.searchValue,
				orderField: query.orderField,
				orderDirection: query.orderDirection,
			},
		});

		return res.status(response.statusCode).json(response);
	}

	@Get("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.PERMISSION_GET),
	)
	async getPermissionById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch permission by ID
		const result: PermissionResponseDto =
			await this.permissionService.getPermissionById(currentUser, id);

		// Create API response
		const response: ApiResponse<PermissionResponseDto> =
			new ApiResponse<PermissionResponseDto>(
				200,
				`Permission with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.PERMISSION_CREATE),
	)
	async createPermission(
		@Body() data: CreatePermissionDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Create a new permission
		const result: PermissionResponseDto =
			await this.permissionService.createPermission(currentUser, data);

		// Create API response
		const response: ApiResponse<PermissionResponseDto> =
			new ApiResponse<PermissionResponseDto>(
				201,
				"Permission created successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.PERMISSION_UPDATE),
	)
	async updatePermission(
		@Param("id") id: string,
		@Body() data: UpdatePermissionDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Update permission by ID
		const result: PermissionResponseDto =
			await this.permissionService.updatePermission(
				currentUser,
				id,
				data,
			);

		// Create API response
		const response: ApiResponse<PermissionResponseDto> =
			new ApiResponse<PermissionResponseDto>(
				200,
				`Permission with ID '${id}' updated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default PermissionController;
