import { Request, Response } from "express";
import {
	Get,
	QueryParams,
	Res,
	Param,
	Controller,
	Put,
	Body,
	UseBefore,
	Req,
	Post,
} from "routing-controllers";
import { Service } from "typedi";
import TripService from "../services/trip.service";
import TripTicketService from "../services/trip-ticket.service";
import IsAuthenticatedMiddleware from "../middlewares/is-authenticated.middleware";
import IsAnonymousMiddleware from "../middlewares/is-anonymous.middleware";
import HasPermissionMiddleware from "../middlewares/has-permission.middleware";
import PermissionMap from "../constants/permission-map";
import CreateOutsourcedVehicleDto from "../dtos/outsourced-vehicle/create-outsourced-vehicle.dto";
import DetailedTripResponseDto from "../dtos/trip/detailed-trip-response.dto";
import DetailedTripTicketResponseDto from "../dtos/trip-ticket/detailed-trip-ticket-response.dto";
import NoShowReasonDto from "../dtos/trip-ticket/no-show-reason.dto";
import DriverCurrentLocationDto from "../dtos/trip/driver-current-location.dto";
import CurrentUser from "../templates/current-user";
import UpdateDriverCurrentLocationDto from "../dtos/trip/update-driver-current-location.dto";
import SelectVehicleDto from "../dtos/vehicle/select-vehicle.dto";
import CreateCombinedTripDto from "../dtos/trip/create-combined-trip.dto";
import SelectBookingRequestDto from "../dtos/booking-request/select-booking-request.dto";
import DetailedVehicleResponseDto from "../dtos/vehicle/detailed-vehicle-response.dto";
import BookingRequestResponseDto from "../dtos/booking-request/booking-request-response.dto";
import ApiResponse from "../templates/api-response";
import Pagination from "../templates/pagination";

@Service()
@Controller("/trips")
class TripController {
	constructor(
		private readonly tripService: TripService,
		private readonly tripTicketService: TripTicketService,
	) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_GET),
	)
	public async getTrips(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch trips
		const result: DetailedTripResponseDto[] =
			await this.tripService.getTrips(currentUser, pagination, query);

		// Create API response
		const response: ApiResponse<DetailedTripResponseDto[]> =
			new ApiResponse<DetailedTripResponseDto[]>(
				200,
				"Trips retrieved successfully.",
				result,
				{
					pagination: {
						page: pagination.page,
						limit: pagination.limit,
					},
					query: {
						status: query.status,
						minTotalCost: query.minTotalCost,
						maxTotalCost: query.maxTotalCost,
						departureTimeFrom: query.departureTimeFrom,
						departureTimeTo: query.departureTimeTo,
						arrivalTimeFrom: query.arrivalTimeFrom,
						arrivalTimeTo: query.arrivalTimeTo,
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
		HasPermissionMiddleware(PermissionMap.TRIP_GET),
	)
	public async getTripById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch trip by ID
		const result: DetailedTripResponseDto =
			await this.tripService.getTripById(currentUser, id);

		// Create API response
		const response: ApiResponse<DetailedTripResponseDto> =
			new ApiResponse<DetailedTripResponseDto>(
				200,
				`Trip with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Get("/:id/available-vehicles")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VEHICLE_GET_AVAILABLE),
	)
	public async getAvailableVehiclesForTrip(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch available vehicles for the trip
		const result = await this.tripService.getAvailableVehiclesForTrip(
			currentUser,
			id,
		);

		// Create API response
		const response: ApiResponse<DetailedVehicleResponseDto[]> =
			new ApiResponse<DetailedVehicleResponseDto[]>(
				200,
				`Available vehicles for trip with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/assign-vehicle")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_ASSIGN_VEHICLE),
	)
	public async assignVehicleToTrip(
		@Param("id") id: string,
		@Body() data: SelectVehicleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Assign vehicle to trip
		const result: DetailedTripResponseDto =
			await this.tripService.assignVehicleToTrip(currentUser, id, data);

		// Create API response
		const response: ApiResponse<DetailedTripResponseDto> =
			new ApiResponse<DetailedTripResponseDto>(
				200,
				`Vehicle with ID '${data.vehicleId}' assigned to trip with ID '${id}' successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/assign-outsourced-vehicle")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_ASSIGN_VEHICLE),
	)
	public async assignOutsourcedVehicle(
		@Param("id") id: string,
		@Body() outsourcedVehicleDto: CreateOutsourcedVehicleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Assign outsourced vehicle to trip
		const result: DetailedTripResponseDto =
			await this.tripService.assignOutSourcedVehicleToTrip(
				currentUser,
				id,
				outsourcedVehicleDto,
			);

		// Create API response
		const response: ApiResponse<DetailedTripResponseDto> =
			new ApiResponse<DetailedTripResponseDto>(
				200,
				"Outsourced vehicle assigned successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("/combine")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_COMBINE),
	)
	public async createCombinedTrip(
		@Body() data: CreateCombinedTripDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Combine trips
		const result: DetailedTripResponseDto =
			await this.tripService.createCombinedTrip(currentUser, data);

		// Create API response
		const response: ApiResponse<DetailedTripResponseDto> =
			new ApiResponse<DetailedTripResponseDto>(
				200,
				"Create combined trip successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("/:id/uncombine")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_UNCOMBINE),
	)
	public async uncombineTrip(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Uncombine trip
		await this.tripService.uncombineTrip(currentUser, id);

		// Create API response
		const response: ApiResponse<null> = new ApiResponse<null>(
			200,
			`Trip with ID '${id}' uncombined successfully.`,
			null,
		);

		return res.status(response.statusCode).json(response);
	}

	@Get("/:id/combinable-requests")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_COMBINE),
	)
	public async getCombinableBookingRequests(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Get combinable requests
		const result: BookingRequestResponseDto[] =
			await this.tripService.getCombinableBookingRequests(
				currentUser,
				id,
			);

		// Create API response
		const response: ApiResponse<BookingRequestResponseDto[]> =
			new ApiResponse<BookingRequestResponseDto[]>(
				200,
				`Combinable requests for trip with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/add-request")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_COMBINE),
	)
	public async addBookingRequestToTrip(
		@Param("id") id: string,
		@Body() data: SelectBookingRequestDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Add request to trip
		const result: DetailedTripResponseDto =
			await this.tripService.addBookingRequestToTrip(
				currentUser,
				id,
				data,
			);

		// Create API response
		const response: ApiResponse<DetailedTripResponseDto> =
			new ApiResponse<DetailedTripResponseDto>(
				200,
				`Booking request with ID '${data.bookingRequestId}' added to trip with ID '${id}' successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/remove-request")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_UNCOMBINE),
	)
	public async removeBookingRequestFromTrip(
		@Param("id") id: string,
		@Body() data: SelectBookingRequestDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Remove request from trip
		const result: DetailedTripResponseDto =
			await this.tripService.removeBookingRequestFromTrip(
				currentUser,
				id,
				data,
			);

		// Create API response
		const response: ApiResponse<DetailedTripResponseDto> =
			new ApiResponse<DetailedTripResponseDto>(
				200,
				`Booking request with ID '${data.bookingRequestId}' removed from trip with ID '${id}' successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/approve")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_APPROVE),
	)
	public async approveSchedulingTrip(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Approve scheduling trip
		const result: DetailedTripResponseDto =
			await this.tripService.approveSchedulingTrip(currentUser, id);

		// Create API response
		const response = new ApiResponse<DetailedTripResponseDto>(
			200,
			`Trip with ID '${id}' approved successfully.`,
			result,
		);

		return res.status(response.statusCode).json(response);
	}

	@Get("/:id/public")
	@UseBefore(IsAnonymousMiddleware)
	public async getTripByIdPublicAccess(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch trip by ID
		const result: DetailedTripResponseDto =
			await this.tripService.getTripById(currentUser, id);

		// Create API response
		const response: ApiResponse<DetailedTripResponseDto> =
			new ApiResponse<DetailedTripResponseDto>(
				200,
				"Trip retrieved successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/start")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_START),
	)
	public async confirmTripStart(
		@Param("id") id: string,
		@Req() request: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = request.cookies.currentUser;

		// Confirm trip start
		const result: DetailedTripResponseDto =
			await this.tripService.driverConfirmTripStart(currentUser, id);

		// Create API response
		const response: ApiResponse<DetailedTripResponseDto> =
			new ApiResponse<DetailedTripResponseDto>(
				200,
				"Trip started successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/end")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_END),
	)
	public async confirmTripEndByDriver(
		@Param("id") id: string,
		@Req() request: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = request.cookies.currentUser;

		// Confirm trip end
		const tripDetail: DetailedTripResponseDto =
			await this.tripService.driverConfirmEndTrip(currentUser, id);

		// Create API response
		const response: ApiResponse<DetailedTripResponseDto> =
			new ApiResponse<DetailedTripResponseDto>(
				200,
				"Trip ended successfully.",
				tripDetail,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/start/public")
	@UseBefore(IsAnonymousMiddleware)
	public async confirmTripStartByOutsourcedVehicle(
		@Param("id") id: string,
		@Req() request: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = request.cookies.currentUser;

		// Confirm trip start
		const tripDetail: DetailedTripResponseDto =
			await this.tripService.outsourcedConfirmTripStart(currentUser, id);

		// Create API response
		const response: ApiResponse<DetailedTripResponseDto> =
			new ApiResponse<DetailedTripResponseDto>(
				200,
				"Trip started successfully.",
				tripDetail,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/end/public")
	@UseBefore(IsAnonymousMiddleware)
	public async confirmTripEndByOutsourcedVehicle(
		@Param("id") id: string,
		@Req() request: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser = request.cookies.currentUser;

		// Confirm trip end
		const tripDetail: DetailedTripResponseDto =
			await this.tripService.outsourcedConfirmEndTrip(currentUser, id);

		// Create API response
		const response = new ApiResponse<DetailedTripResponseDto>(
			200,
			"Trip ended successfully.",
			tripDetail,
		);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:tripId/booking-request/:bookingRequestId/pickup")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_CONFIRM_PICK_UP),
	)
	public async confirmPickUp(
		@Param("tripId") tripId: string,
		@Param("bookingRequestId") bookingRequestId: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Confirm pick up
		const updatedTicket: DetailedTripTicketResponseDto[] =
			await this.tripTicketService.confirmPickUp(
				currentUser,
				bookingRequestId,
				tripId,
			);

		// Create API response
		const response = new ApiResponse<DetailedTripTicketResponseDto[]>(
			200,
			`Driver '${updatedTicket[0].driver?.name}' successfully confirmed pickup for booking request ${bookingRequestId}.`,
			updatedTicket,
		);

		return res.status(response.statusCode).json(response);
	}

	@Post("/:tripId/booking-request/:bookingRequestId/confirm-dropped_off")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_CONFIRM_DROP_OFF),
	)
	public async confirmDropOffByDriver(
		@Param("bookingRequestId") bookingRequestId: string,
		@Param("tripId") tripId: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		const user = req.cookies.currentUser;
		const result = await this.tripTicketService.confirmDroppedOff(
			user,
			bookingRequestId,
			tripId,
		);

		const response = new ApiResponse<DetailedTripTicketResponseDto[]>(
			200,
			"Drop-off confirmed successfully.",
			result,
		);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:tripId/booking-request/:bookingRequestId/absence")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_CONFIRM_ABSENCE_PASSENGERS),
	)
	public async confirmAbsenceForPassengers(
		@Param("tripId") tripId: string,
		@Param("bookingRequestId") bookingRequestId: string,
		@Body() reason: NoShowReasonDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		const driver = req.cookies.currentUser;

		const updatedTicket: DetailedTripTicketResponseDto[] =
			await this.tripTicketService.confirmPassengersNoShow(
				driver,
				bookingRequestId,
				tripId,
				reason,
			);

		const response = new ApiResponse<DetailedTripTicketResponseDto[]>(
			200,
			`Driver ${updatedTicket[0].driver?.name} successfully marked passengers as absence for booking request ${bookingRequestId}.`,
			updatedTicket,
		);

		return res.status(response.statusCode).json(response);
	}

	@Get("/:id/public-access")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_GET_PUBLIC_ACCESS_LINK),
	)
	public async getPublicAccessLink(
		@Param("id") tripId: string,
		@Res() res: Response,
	) {
		const publicAccessDto = await this.tripService.getPublicUrl(tripId);

		const response = new ApiResponse(
			200,
			"Public access URL retrieved successfully.",
			publicAccessDto,
		);

		return res.status(response.statusCode).json(response);
	}

	@Post("/:id/generate-public-access")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_GENERATE_PUBLIC_ACCESS_LINK),
	)
	public async generatePublicAccessLink(
		@Param("id") tripId: string,
		@Res() res: Response,
	) {
		// TODO: Validate current user is a coordinator
		const publicAccessDto =
			await this.tripService.generatePublicUrl(tripId);

		const response = new ApiResponse(
			200,
			"Public access URL generated successfully.",
			publicAccessDto,
		);

		return res.status(response.statusCode).json(response);
	}

	@Get("/:id/driver-location")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_GET_DRIVER_CURRENT_LOCATION),
	)
	public async getDriverCurrentLocation(
		@Param("id") tripId: string,
		@Res() res: Response,
	) {
		const driverLocation: DriverCurrentLocationDto =
			await this.tripService.getDriverCurrentLocation(tripId);

		const response = new ApiResponse(
			200,
			"Driver current location retrieved successfully.",
			driverLocation,
		);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/driver-location")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(
			PermissionMap.TRIP_UPDATE_DRIVER_CURRENT_LOCATION,
		),
	)
	public async updateDriverCurrentLocation(
		@Param("id") tripId: string,
		@Body() request: UpdateDriverCurrentLocationDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		const driver: CurrentUser = req.cookies.currentUser;
		const driverLocation: DriverCurrentLocationDto =
			await this.tripService.updateDriverCurrentLocation(
				driver,
				tripId,
				request,
			);

		const response = new ApiResponse(
			200,
			"Driver current location updated successfully.",
			driverLocation,
		);

		return res.status(response.statusCode).json(response);
	}
}

export default TripController;
