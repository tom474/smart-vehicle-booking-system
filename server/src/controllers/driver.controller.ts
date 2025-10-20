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
import DriverService from "../services/driver.service";
import DetailedDriverResponseDto from "../dtos/driver/detailed-driver-response.dto";
import CreateDriverDto from "../dtos/driver/create-driver.dto";
import UpdateDriverDto from "../dtos/driver/update-driver.dto";
import ResetPasswordDto from "../dtos/authentication/reset-password.dto";
import SelectLocationDto from "../dtos/location/select-location.dto";
import SelectVehicleDto from "../dtos/vehicle/select-vehicle.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/drivers")
class DriverController {
	constructor(private readonly driverService: DriverService) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.DRIVER_GET),
	)
	public async getDrivers(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch drivers
		const result: DetailedDriverResponseDto[] =
			await this.driverService.getDrivers(currentUser, pagination, query);

		// Create API response
		const response: ApiResponse<DetailedDriverResponseDto[]> =
			new ApiResponse<DetailedDriverResponseDto[]>(
				200,
				"Drivers retrieved successfully.",
				result,
				{
					pagination: {
						page: pagination.page,
						limit: pagination.limit,
					},
					query: {
						status: query.status,
						availability: query.availability,
						ownershipType: query.ownershipType,
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
		HasPermissionMiddleware(PermissionMap.DRIVER_GET),
	)
	public async getDriverById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch driver by ID
		const result: DetailedDriverResponseDto =
			await this.driverService.getDriverById(currentUser, id);

		// Create API response
		const response: ApiResponse<DetailedDriverResponseDto> =
			new ApiResponse<DetailedDriverResponseDto>(
				200,
				`Driver with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.DRIVER_CREATE),
	)
	public async createDriver(
		@BodyParam("data") data: CreateDriverDto,
		@UploadedFile("avatar") avatar: Express.Multer.File,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Create a new driver
		const result: DetailedDriverResponseDto =
			await this.driverService.createDriver(currentUser, data, avatar);

		// Create API response
		const response: ApiResponse<DetailedDriverResponseDto> =
			new ApiResponse<DetailedDriverResponseDto>(
				201,
				"Driver created successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.DRIVER_UPDATE),
	)
	public async updateDriver(
		@Param("id") id: string,
		@BodyParam("data") data: UpdateDriverDto,
		@UploadedFile("avatar") avatar: Express.Multer.File,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Update driver by ID
		const result: DetailedDriverResponseDto =
			await this.driverService.updateDriver(
				currentUser,
				id,
				data,
				avatar,
			);

		// Create API response
		const response: ApiResponse<DetailedDriverResponseDto> =
			new ApiResponse<DetailedDriverResponseDto>(
				200,
				`Driver with ID '${id}' updated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/reset-password")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.DRIVER_RESET_PASSWORD),
	)
	public async resetDriverPassword(
		@Param("id") id: string,
		@Body() data: ResetPasswordDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Reset driver password by ID
		const result: DetailedDriverResponseDto =
			await this.driverService.resetPassword(currentUser, id, data);

		// Create API response
		const response: ApiResponse<DetailedDriverResponseDto> =
			new ApiResponse<DetailedDriverResponseDto>(
				200,
				`Driver with ID '${id}' password reset successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/change-base-location")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.DRIVER_CHANGE_BASE_LOCATION),
	)
	public async changeDriverBaseLocation(
		@Param("id") id: string,
		@Body() data: SelectLocationDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Change driver base location by ID
		const result: DetailedDriverResponseDto =
			await this.driverService.changeBaseLocation(currentUser, id, data);

		// Create API response
		const response: ApiResponse<DetailedDriverResponseDto> =
			new ApiResponse<DetailedDriverResponseDto>(
				200,
				`Driver with ID '${id}' base location changed successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/activate")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.DRIVER_ACTIVATE),
	)
	public async activateDriver(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Activate driver by ID
		const result: DetailedDriverResponseDto =
			await this.driverService.activateDriver(currentUser, id);

		// Create API response
		const response: ApiResponse<DetailedDriverResponseDto> =
			new ApiResponse<DetailedDriverResponseDto>(
				200,
				`Driver with ID '${id}' activated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/deactivate")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.DRIVER_DEACTIVATE),
	)
	public async deactivateDriver(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Deactivate driver by ID
		const result: DetailedDriverResponseDto =
			await this.driverService.deactivateDriver(currentUser, id);

		// Create API response
		const response: ApiResponse<DetailedDriverResponseDto> =
			new ApiResponse<DetailedDriverResponseDto>(
				200,
				`Driver with ID '${id}' deactivated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/suspend")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.DRIVER_SUSPEND),
	)
	public async suspendDriver(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Suspend driver by ID
		const result: DetailedDriverResponseDto =
			await this.driverService.suspendDriver(currentUser, id);

		// Create API response
		const response: ApiResponse<DetailedDriverResponseDto> =
			new ApiResponse<DetailedDriverResponseDto>(
				200,
				`Driver with ID '${id}' suspended successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/assign-vehicle")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.DRIVER_ASSIGN_VEHICLE),
	)
	public async assignVehicleToDriver(
		@Param("id") id: string,
		@Body() data: SelectVehicleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Assign vehicle to driver by ID
		const result: DetailedDriverResponseDto =
			await this.driverService.assignVehicle(currentUser, id, data);

		// Create API response
		const response: ApiResponse<DetailedDriverResponseDto> =
			new ApiResponse<DetailedDriverResponseDto>(
				200,
				`Vehicle with ID '${data.vehicleId}' assigned to driver with ID '${id}' successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default DriverController;
