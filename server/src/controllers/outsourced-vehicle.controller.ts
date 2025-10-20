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
import OutsourcedVehicleService from "../services/outsourced-vehicle.service";
import OutsourcedVehicleResponseDto from "../dtos/outsourced-vehicle/outsourced-vehicle-response.dto";
import CreateOutsourcedVehicleDto from "../dtos/outsourced-vehicle/create-outsourced-vehicle.dto";
import UpdateOutsourcedVehicleDto from "../dtos/outsourced-vehicle/update-outsourced-vehicle.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/outsourced-vehicles")
class OutsourcedVehicleController {
	constructor(
		private readonly outsourcedVehicleService: OutsourcedVehicleService,
	) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.OUTSOURCED_VEHICLE_GET),
	)
	public async getOutsourcedVehicles(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.user;

		// Fetch outsourced vehicles
		const result: OutsourcedVehicleResponseDto[] =
			await this.outsourcedVehicleService.getOutsourcedVehicles(
				currentUser,
				pagination,
				query,
			);

		// Fetch API response
		const response: ApiResponse<OutsourcedVehicleResponseDto[]> =
			new ApiResponse<OutsourcedVehicleResponseDto[]>(
				200,
				"Outsourced vehicles retrieved successfully.",
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
		HasPermissionMiddleware(PermissionMap.OUTSOURCED_VEHICLE_GET),
	)
	public async getOutsourcedVehicleById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch outsourced vehicle by ID
		const result: OutsourcedVehicleResponseDto =
			await this.outsourcedVehicleService.getOutsourcedVehicleById(
				currentUser,
				id,
			);

		// Create API response
		const response: ApiResponse<OutsourcedVehicleResponseDto> =
			new ApiResponse<OutsourcedVehicleResponseDto>(
				200,
				`Outsourced vehicle with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.OUTSOURCED_VEHICLE_CREATE),
	)
	public async createVehicle(
		@Body() data: CreateOutsourcedVehicleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Create a new outsourced vehicle
		const result: OutsourcedVehicleResponseDto =
			await this.outsourcedVehicleService.createOutsourcedVehicle(
				currentUser,
				data,
			);

		// Create API response
		const response: ApiResponse<OutsourcedVehicleResponseDto> =
			new ApiResponse<OutsourcedVehicleResponseDto>(
				201,
				"Outsourced vehicle created successfully.",
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
		@Body() data: UpdateOutsourcedVehicleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Update outsourced vehicle by ID
		const result: OutsourcedVehicleResponseDto =
			await this.outsourcedVehicleService.updateOutsourcedVehicle(
				currentUser,
				id,
				data,
			);

		// Create API response
		const response: ApiResponse<OutsourcedVehicleResponseDto> =
			new ApiResponse<OutsourcedVehicleResponseDto>(
				200,
				`Outsourced vehicle with ID '${id}' updated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default OutsourcedVehicleController;
