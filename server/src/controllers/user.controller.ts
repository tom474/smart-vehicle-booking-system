import { Request, Response } from "express";
import {
	Body,
	BodyParam,
	Controller,
	Get,
	Param,
	Post,
	Put,
	QueryParams,
	Req,
	Res,
	UploadedFile,
	UseBefore,
} from "routing-controllers";
import { Service } from "typedi";
import IsAuthenticatedMiddleware from "../middlewares/is-authenticated.middleware";
import HasPermissionMiddleware from "../middlewares/has-permission.middleware";
import PermissionMap from "../constants/permission-map";
import UserService from "../services/user.service";
import DetailedUserResponseDto from "../dtos/user/detailed-user-response.dto";
import CreateUserDto from "../dtos/user/create-user.dto";
import UpdateUserDto from "../dtos/user/update-user.dto";
import SelectRoleDto from "../dtos/role/select-role.dto";
import SelectVehicleDto from "../dtos/vehicle/select-vehicle.dto";
import CurrentUser from "../templates/current-user";
import ApiResponse from "../templates/api-response";
import Pagination from "../templates/pagination";

@Service()
@Controller("/users")
class UserController {
	constructor(private readonly userService: UserService) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.USER_GET),
	)
	public async getUsers(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch users
		const result: DetailedUserResponseDto[] =
			await this.userService.getUsers(currentUser, pagination, query);

		// Create API response
		const response: ApiResponse<DetailedUserResponseDto[]> =
			new ApiResponse<DetailedUserResponseDto[]>(
				200,
				"Users retrieved successfully.",
				result,
				{
					pagination: {
						page: pagination.page,
						limit: pagination.limit,
					},
					query: {
						status: query.status,
						roleId: query.roleId,
						searchField: query.searchField,
						searchValue: query.searchValue,
						orderField: query.orderField,
						orderDirection: query.orderDirection,
					},
				},
			);

		return res.status(response.statusCode).json(response);
	}

	@Get("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.USER_GET),
	)
	public async getUserById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch user by ID
		const result: DetailedUserResponseDto =
			await this.userService.getUserById(currentUser, id);

		// Create API response
		const response: ApiResponse<DetailedUserResponseDto> =
			new ApiResponse<DetailedUserResponseDto>(
				200,
				`User with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.USER_CREATE),
	)
	public async createUser(
		@BodyParam("data") data: CreateUserDto,
		@UploadedFile("avatar") avatar: Express.Multer.File,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Create a new user
		const result: DetailedUserResponseDto =
			await this.userService.createUser(currentUser, data, avatar);

		// Create API response
		const response: ApiResponse<DetailedUserResponseDto> =
			new ApiResponse<DetailedUserResponseDto>(
				201,
				"User created successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.USER_UPDATE),
	)
	public async updateUser(
		@Param("id") id: string,
		@BodyParam("data") data: UpdateUserDto,
		@UploadedFile("avatar") avatar: Express.Multer.File,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Update user by ID
		const result: DetailedUserResponseDto =
			await this.userService.updateUser(currentUser, id, data, avatar);

		// Create API response
		const response: ApiResponse<DetailedUserResponseDto> =
			new ApiResponse<DetailedUserResponseDto>(
				200,
				`User with ID '${id}' updated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/change-role")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.USER_CHANGE_ROLE),
	)
	public async changeUserRole(
		@Param("id") id: string,
		@Body() data: SelectRoleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Change user role by ID
		const result: DetailedUserResponseDto =
			await this.userService.changeUserRole(currentUser, id, data);

		// Create API response
		const response: ApiResponse<DetailedUserResponseDto> =
			new ApiResponse<DetailedUserResponseDto>(
				200,
				`User with ID '${id}' role changed successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/activate")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.USER_ACTIVATE),
	)
	public async activateUser(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Activate user by ID
		const result: DetailedUserResponseDto =
			await this.userService.activateUser(currentUser, id);

		// Create API response
		const response: ApiResponse<DetailedUserResponseDto> =
			new ApiResponse<DetailedUserResponseDto>(
				200,
				`User with ID '${id}' activated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/deactivate")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.USER_DEACTIVATE),
	)
	public async deactivateUser(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Deactivate user by ID
		const result: DetailedUserResponseDto =
			await this.userService.deactivateUser(currentUser, id);

		// Create API response
		const response: ApiResponse<DetailedUserResponseDto> =
			new ApiResponse<DetailedUserResponseDto>(
				200,
				`User with ID '${id}' deactivated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/suspend")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.USER_SUSPEND),
	)
	public async suspendUser(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Suspend user by ID
		const result: DetailedUserResponseDto =
			await this.userService.suspendUser(currentUser, id);

		// Create API response
		const response: ApiResponse<DetailedUserResponseDto> =
			new ApiResponse<DetailedUserResponseDto>(
				200,
				`User with ID '${id}' suspended successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/assign-dedicated-vehicle")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.USER_ASSIGN_DEDICATED_VEHICLE),
	)
	public async assignDedicatedVehicle(
		@Param("id") id: string,
		@Body() data: SelectVehicleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Assign dedicated vehicle
		const result: DetailedUserResponseDto =
			await this.userService.assignDedicatedVehicle(
				currentUser,
				id,
				data,
			);

		// Create API response
		const response: ApiResponse<DetailedUserResponseDto> =
			new ApiResponse<DetailedUserResponseDto>(
				200,
				`User with ID '${id}' assigned a dedicated vehicle with ID '${data.vehicleId}' successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default UserController;
