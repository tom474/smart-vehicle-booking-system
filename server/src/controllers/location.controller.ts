import { Request, Response } from "express";
import {
	Body,
	Controller,
	Get,
	Post,
	Put,
	Param,
	Res,
	QueryParams,
	UseBefore,
	Req,
} from "routing-controllers";
import { Service } from "typedi";
import IsAuthenticatedMiddleware from "../middlewares/is-authenticated.middleware";
import HasPermissionMiddleware from "../middlewares/has-permission.middleware";
import PermissionMap from "../constants/permission-map";
import LocationService from "../services/location.service";
import LocationResponseDto from "../dtos/location/location-response.dto";
import CreateLocationDto from "../dtos/location/create-location.dto";
import UpdateLocationDto from "../dtos/location/update-location.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/locations")
class LocationController {
	constructor(private readonly locationService: LocationService) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.LOCATION_GET),
	)
	public async getLocations(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch locations
		const result: LocationResponseDto[] =
			await this.locationService.getLocations(
				currentUser,
				pagination,
				query,
			);

		// Create API response
		const response: ApiResponse<LocationResponseDto[]> = new ApiResponse<
			LocationResponseDto[]
		>(200, "Locations retrieved successfully.", result, {
			pagination: {
				page: pagination.page,
				limit: pagination.limit,
			},
			query: {
				type: query.type,
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
		HasPermissionMiddleware(PermissionMap.LOCATION_GET),
	)
	public async getLocationById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch location by ID
		const result: LocationResponseDto =
			await this.locationService.getLocationById(currentUser, id);

		//  Create API response
		const response: ApiResponse<LocationResponseDto> =
			new ApiResponse<LocationResponseDto>(
				200,
				`Location with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.LOCATION_CREATE),
	)
	public async createLocation(
		@Body() data: CreateLocationDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Create a new location
		const result: LocationResponseDto =
			await this.locationService.createLocation(currentUser, data);

		// Create API response
		const response: ApiResponse<LocationResponseDto> =
			new ApiResponse<LocationResponseDto>(
				201,
				"Location created successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.LOCATION_UPDATE),
	)
	public async updateLocation(
		@Param("id") id: string,
		@Body() data: UpdateLocationDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Update location by ID
		const result: LocationResponseDto =
			await this.locationService.updateLocation(currentUser, id, data);

		// Create API response
		const response: ApiResponse<LocationResponseDto> =
			new ApiResponse<LocationResponseDto>(
				200,
				`Location with ID '${id}' updated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default LocationController;
