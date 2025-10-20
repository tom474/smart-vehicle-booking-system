import { Request, Response } from "express";
import {
	Get,
	QueryParams,
	Res,
	Controller,
	Param,
	Req,
	UseBefore,
} from "routing-controllers";
import { Service } from "typedi";
import IsAuthenticatedMiddleware from "../middlewares/is-authenticated.middleware";
import HasPermissionMiddleware from "../middlewares/has-permission.middleware";
import PermissionMap from "../constants/permission-map";
import TripTicketService from "../services/trip-ticket.service";
import DetailedTripTicketResponseDto from "../dtos/trip-ticket/detailed-trip-ticket-response.dto";
import BasicUserResponseDto from "../dtos/user/basic-user-response.dto";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/trip-tickets")
class TripTicketController {
	constructor(private readonly tripTicketService: TripTicketService) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_TICKET_GET),
	)
	public async getTripTickets(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Res() res: Response,
	) {
		// Fetch trip tickets
		const result: DetailedTripTicketResponseDto[] =
			await this.tripTicketService.getTripTickets(pagination, query);

		// Create API response
		const response: ApiResponse<DetailedTripTicketResponseDto[]> =
			new ApiResponse<DetailedTripTicketResponseDto[]>(
				200,
				"Trip tickets retrieved successfully.",
				result,
				{
					pagination: {
						page: pagination.page,
						limit: pagination.limit,
					},
					query: {
						status: query.status,
						userId: query.userId,
						tripId: query.tripId,
						bookingRequestId: query.bookingRequestId,
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
		HasPermissionMiddleware(PermissionMap.TRIP_TICKET_GET),
	)
	public async getTicketById(@Param("id") id: string, @Res() res: Response) {
		// Fetch trip ticket by ID
		const result: DetailedTripTicketResponseDto =
			await this.tripTicketService.getTicketById(id);

		// Create API response
		const response: ApiResponse<DetailedTripTicketResponseDto> =
			new ApiResponse<DetailedTripTicketResponseDto>(
				200,
				`Trip ticket with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Get("/:id/information")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_TICKET_GET),
	)
	public async getPassengerInformation(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser = req.cookies.currentUser;

		// Fetch passenger information
		const result: BasicUserResponseDto =
			await this.tripTicketService.getPassengerInformation(
				currentUser,
				id,
			);

		const response: ApiResponse<BasicUserResponseDto> =
			new ApiResponse<BasicUserResponseDto>(
				200,
				`Passenger information for trip ticket with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default TripTicketController;
