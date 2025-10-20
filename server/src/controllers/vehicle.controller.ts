import { Request, Response } from "express";
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
import VehicleService from "../services/vehicle.service";
import DetailedVehicleResponseDto from "../dtos/vehicle/detailed-vehicle-response.dto";
import CreateVehicleDto from "../dtos/vehicle/create-vehicle.dto";
import UpdateVehicleDto from "../dtos/vehicle/update-vehicle.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/vehicles")
class VehicleController {
	constructor(private readonly vehicleService: VehicleService) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VEHICLE_GET),
	)
	public async getVehicles(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch vehicles
		const result: DetailedVehicleResponseDto[] =
			await this.vehicleService.getVehicles(
				currentUser,
				pagination,
				query,
			);

		// Create API response
		const response: ApiResponse<DetailedVehicleResponseDto[]> =
			new ApiResponse<DetailedVehicleResponseDto[]>(
				200,
				"Vehicles retrieved successfully.",
				result,
				{
					pagination: {
						page: pagination.page,
						limit: pagination.limit,
					},
					query: {
						color: query.color,
						minCapacity: query.minCapacity,
						maxCapacity: query.maxCapacity,
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

	@Get("/available")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VEHICLE_GET_AVAILABLE),
	)
	public async getAvailableVehicles(
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Extract and validate query parameters
		const startTime = new Date(query.startTime as string);
		const endTime = new Date(query.endTime as string);
		const minCapacity = Number(query.minCapacity as string);

		// Fetch available vehicles
		const result: DetailedVehicleResponseDto[] =
			await this.vehicleService.getAvailableVehicles(
				currentUser,
				startTime,
				endTime,
				minCapacity,
			);

		// Create API response
		const response: ApiResponse<DetailedVehicleResponseDto[]> =
			new ApiResponse<DetailedVehicleResponseDto[]>(
				200,
				"Available vehicles retrieved successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Get("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VEHICLE_GET),
	)
	public async getVehicleById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch vehicle by ID
		const result: DetailedVehicleResponseDto =
			await this.vehicleService.getVehicleById(currentUser, id);

		// Create API response
		const response: ApiResponse<DetailedVehicleResponseDto> =
			new ApiResponse<DetailedVehicleResponseDto>(
				200,
				`Vehicle with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VEHICLE_CREATE),
	)
	public async createVehicle(
		@Body() data: CreateVehicleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Create a new vehicle
		const result: DetailedVehicleResponseDto =
			await this.vehicleService.createVehicle(currentUser, data);

		// Create API response
		const response: ApiResponse<DetailedVehicleResponseDto> =
			new ApiResponse<DetailedVehicleResponseDto>(
				201,
				"Vehicle created successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VEHICLE_UPDATE),
	)
	public async updateVehicle(
		@Param("id") id: string,
		@Body() data: UpdateVehicleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Update vehicle by ID
		const result: DetailedVehicleResponseDto =
			await this.vehicleService.updateVehicle(currentUser, id, data);

		// Create API response
		const response: ApiResponse<DetailedVehicleResponseDto> =
			new ApiResponse<DetailedVehicleResponseDto>(
				200,
				`Vehicle with ID '${id}' updated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default VehicleController;
