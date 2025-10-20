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
import RoleService from "../services/role.service";
import RoleResponseDto from "../dtos/role/role-response.dto";
import CreateRoleDto from "../dtos/role/create-role.dto";
import UpdateRoleDto from "../dtos/role/update-role.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/roles")
class RoleController {
	constructor(private readonly roleService: RoleService) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.ROLE_GET),
	)
	public async getRoles(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch roles
		const result: RoleResponseDto[] = await this.roleService.getRoles(
			currentUser,
			pagination,
			query,
		);

		// Create API response
		const response: ApiResponse<RoleResponseDto[]> = new ApiResponse<
			RoleResponseDto[]
		>(200, "Roles retrieved successfully.", result, {
			pagination: {
				page: pagination.page,
				limit: pagination.limit,
			},
			query: {
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
		HasPermissionMiddleware(PermissionMap.ROLE_GET),
	)
	public async getRoleById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch role by ID
		const result: RoleResponseDto = await this.roleService.getRoleById(
			currentUser,
			id,
		);

		// Create API response
		const response: ApiResponse<RoleResponseDto> =
			new ApiResponse<RoleResponseDto>(
				200,
				`Role with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.ROLE_CREATE),
	)
	public async createRole(
		@Body() data: CreateRoleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Create a new role
		const result: RoleResponseDto = await this.roleService.createRole(
			currentUser,
			data,
		);

		// Create API response
		const response: ApiResponse<RoleResponseDto> =
			new ApiResponse<RoleResponseDto>(
				201,
				"Role created successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.ROLE_UPDATE),
	)
	public async updateRole(
		@Param("id") id: string,
		@Body() data: UpdateRoleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Update role by ID
		const result: RoleResponseDto = await this.roleService.updateRole(
			currentUser,
			id,
			data,
		);

		// Create API response
		const response: ApiResponse<RoleResponseDto> =
			new ApiResponse<RoleResponseDto>(
				200,
				`Role with ID '${id}' updated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default RoleController;
