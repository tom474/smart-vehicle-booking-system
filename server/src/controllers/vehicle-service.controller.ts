import { Request, Response } from "express";
import {
	Body,
	Controller,
	Delete,
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
import VehicleServiceService from "../services/vehicle-service.service";
import VehicleServiceResponseDto from "../dtos/vehicle-service/vehicle-service-response.dto";
import CreateVehicleServiceDto from "../dtos/vehicle-service/create-vehicle-service.dto";
import UpdateVehicleServiceDto from "../dtos/vehicle-service/update-vehicle-service.dto";
import RejectVehicleServiceDto from "../dtos/vehicle-service/reject-vehicle-service.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/vehicle-services")
class VehicleServiceController {
	constructor(
		private readonly vehicleServiceService: VehicleServiceService,
	) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VEHICLE_SERVICE_GET),
	)
	public async getVehicleServices(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch vehicle services
		const result: VehicleServiceResponseDto[] =
			await this.vehicleServiceService.getVehicleServices(
				currentUser,
				pagination,
				query,
			);

		// Create API response
		const response: ApiResponse<VehicleServiceResponseDto[]> =
			new ApiResponse<VehicleServiceResponseDto[]>(
				200,
				"Vehicle services retrieved successfully.",
				result,
				{
					pagination: {
						page: pagination.page,
						limit: pagination.limit,
					},
					query: {
						serviceType: query.serviceType,
						status: query.status,
						startTimeFrom: query.startTimeFrom,
						startTimeTo: query.startTimeTo,
						endTimeFrom: query.endTimeFrom,
						endTimeTo: query.endTimeTo,
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
		HasPermissionMiddleware(PermissionMap.VEHICLE_SERVICE_GET),
	)
	public async getVehicleServiceById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch vehicle service by ID
		const result: VehicleServiceResponseDto =
			await this.vehicleServiceService.getVehicleServiceById(
				currentUser,
				id,
			);

		// Create API response
		const response: ApiResponse<VehicleServiceResponseDto> =
			new ApiResponse<VehicleServiceResponseDto>(
				200,
				`Vehicle service with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VEHICLE_SERVICE_CREATE),
	)
	public async createVehicleService(
		@Body() data: CreateVehicleServiceDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Create vehicle service
		const result: VehicleServiceResponseDto =
			await this.vehicleServiceService.createVehicleService(
				currentUser,
				data,
			);

		// Create API response
		const response: ApiResponse<VehicleServiceResponseDto> =
			new ApiResponse<VehicleServiceResponseDto>(
				201,
				"Vehicle service created successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VEHICLE_SERVICE_UPDATE),
	)
	public async updateVehicleService(
		@Param("id") id: string,
		@Body() data: UpdateVehicleServiceDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Update vehicle service by ID
		const result: VehicleServiceResponseDto =
			await this.vehicleServiceService.updateVehicleService(
				currentUser,
				id,
				data,
			);

		// Create API response
		const response: ApiResponse<VehicleServiceResponseDto> =
			new ApiResponse<VehicleServiceResponseDto>(
				200,
				`Vehicle service with ID '${id}' updated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/approve")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VEHICLE_SERVICE_APPROVE),
	)
	public async approveVehicleService(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Approve vehicle service by ID
		const result: VehicleServiceResponseDto =
			await this.vehicleServiceService.approveVehicleService(
				currentUser,
				id,
			);

		// Create API response
		const response: ApiResponse<VehicleServiceResponseDto> =
			new ApiResponse<VehicleServiceResponseDto>(
				200,
				`Vehicle service with ID '${id}' approved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/reject")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VEHICLE_SERVICE_REJECT),
	)
	public async rejectVehicleService(
		@Param("id") id: string,
		@Body() data: RejectVehicleServiceDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Reject vehicle service by ID
		const result: VehicleServiceResponseDto =
			await this.vehicleServiceService.rejectVehicleService(
				currentUser,
				id,
				data,
			);

		// Create API response
		const response: ApiResponse<VehicleServiceResponseDto> =
			new ApiResponse<VehicleServiceResponseDto>(
				200,
				`Vehicle service with ID '${id}' rejected successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/cancel")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VEHICLE_SERVICE_CANCEL),
	)
	public async cancelVehicleService(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Cancel vehicle service by ID
		const result: VehicleServiceResponseDto =
			await this.vehicleServiceService.cancelVehicleService(
				currentUser,
				id,
			);

		// Create API response
		const response: ApiResponse<VehicleServiceResponseDto> =
			new ApiResponse<VehicleServiceResponseDto>(
				200,
				`Vehicle service with ID '${id}' canceled successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Delete("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VEHICLE_SERVICE_DELETE),
	)
	public async deleteVehicleService(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Delete vehicle service by ID
		await this.vehicleServiceService.deleteVehicleService(currentUser, id);

		// Create API response
		const response: ApiResponse<null> = new ApiResponse<null>(
			200,
			`Vehicle service with ID '${id}' deleted successfully.`,
			null,
		);

		return res.status(response.statusCode).json(response);
	}
}

export default VehicleServiceController;
