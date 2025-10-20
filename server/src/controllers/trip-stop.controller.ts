import { Request, Response } from "express";
import {
	Controller,
	Get,
	QueryParams,
	Param,
	Res,
	Put,
	UseBefore,
	Req,
} from "routing-controllers";
import { Service } from "typedi";
import IsAuthenticatedMiddleware from "../middlewares/is-authenticated.middleware";
import HasPermissionMiddleware from "../middlewares/has-permission.middleware";
import PermissionMap from "../constants/permission-map";
import TripStopService from "../services/trip-stop.service";
import TripStopResponseDto from "../dtos/trip-stop/trip-stop-response.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/trip-stops")
class TripStopController {
	constructor(private readonly tripStopService: TripStopService) {}

	@Get()
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_STOP_GET),
	)
	public async getTripStops(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Res() res: Response,
	) {
		// Fetch trip stops
		const result: TripStopResponseDto[] =
			await this.tripStopService.getTripStops(pagination, query);

		// Create API response
		const response: ApiResponse<TripStopResponseDto[]> = new ApiResponse<
			TripStopResponseDto[]
		>(200, "Trip stops retrieved successfully.", result, {
			pagination: {
				page: pagination.page,
				limit: pagination.limit,
			},
			query: {
				type: query.type,
				tripId: query.tripId,
				locationId: query.locationId,
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
		HasPermissionMiddleware(PermissionMap.TRIP_STOP_GET),
	)
	public async getTripStopById(
		@Param("id") id: string,
		@Res() res: Response,
	) {
		// Fetch trip stop by ID
		const result: TripStopResponseDto | null =
			await this.tripStopService.getTripStop(id);

		// Create API response
		const response: ApiResponse<TripStopResponseDto> =
			new ApiResponse<TripStopResponseDto>(
				200,
				`Trip stop with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/arrive")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_STOP_ARRIVE),
	)
	public async arriveTripStop(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Mark trip stop as arrived
		const result: TripStopResponseDto | null =
			await this.tripStopService.arriveTripStop(currentUser, id);

		// Create API response
		const response: ApiResponse<TripStopResponseDto> =
			new ApiResponse<TripStopResponseDto>(
				200,
				`Trip stop with ID '${id}' marked as arrived.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default TripStopController;
