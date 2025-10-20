import { Request, Response } from "express";
import {
	Body,
	Post,
	Res,
	Controller,
	Get,
	QueryParams,
	Param,
	Put,
	Req,
	UseBefore,
	Delete,
} from "routing-controllers";
import { Service } from "typedi";
import IsAuthenticatedMiddleware from "../middlewares/is-authenticated.middleware";
import HasPermissionMiddleware from "../middlewares/has-permission.middleware";
import PermissionMap from "../constants/permission-map";
import BookingRequestService from "../services/booking-request.service";
import BookingRequestResponseDto from "../dtos/booking-request/booking-request-response.dto";
import CreateBookingRequestDto from "../dtos/booking-request/create-booking-request.dto";
import UpdateBookingRequestDto from "../dtos/booking-request/update-booking-request.dto";
import RejectBookingRequestDto from "../dtos/booking-request/reject-booking-request.dto";
import CancelBookingRequestDto from "../dtos/booking-request/cancel-booking-request.dto";
import DetailedVehicleResponseDto from "../dtos/vehicle/detailed-vehicle-response.dto";
import SelectVehicleDto from "../dtos/vehicle/select-vehicle.dto";
import CreateOutsourcedVehicleDto from "../dtos/outsourced-vehicle/create-outsourced-vehicle.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/booking-requests")
class BookingRequestController {
	constructor(
		private readonly bookingRequestService: BookingRequestService,
	) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.BOOKING_REQUEST_GET),
	)
	public async getBookingRequests(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	): Promise<Response> {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch booking requests
		const result: BookingRequestResponseDto[] =
			await this.bookingRequestService.getBookingRequests(
				currentUser,
				pagination,
				query,
			);

		// Create API response
		const response: ApiResponse<BookingRequestResponseDto[]> =
			new ApiResponse<BookingRequestResponseDto[]>(
				200,
				"Booking requests retrieved successfully.",
				result,
				{
					pagination: {
						page: pagination.page,
						limit: pagination.limit,
					},
					query: {
						priority: query.priority,
						type: query.type,
						status: query.status,
						minNumberOfPassengers: query.minNumberOfPassengers,
						maxNumberOfPassengers: query.maxNumberOfPassengers,
						departureTimeFrom: query.departureTimeFrom,
						departureTimeTo: query.departureTimeTo,
						arrivalTimeFrom: query.arrivalTimeFrom,
						arrivalTimeTo: query.arrivalTimeTo,
						isReserved: query.isReserved,
						tripId: query.tripId,
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
		HasPermissionMiddleware(PermissionMap.BOOKING_REQUEST_GET),
	)
	public async getBookingRequestById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	): Promise<Response> {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch booking request by ID
		const result: BookingRequestResponseDto =
			await this.bookingRequestService.getBookingRequestById(
				currentUser,
				id,
			);

		// Create API response
		const response: ApiResponse<BookingRequestResponseDto> =
			new ApiResponse<BookingRequestResponseDto>(
				200,
				`Booking request with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.BOOKING_REQUEST_CREATE),
	)
	public async createBookingRequest(
		@Body() data: CreateBookingRequestDto,
		@Req() req: Request,
		@Res() res: Response,
	): Promise<Response> {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Create booking request
		const result: BookingRequestResponseDto[] =
			await this.bookingRequestService.createBookingRequest(
				currentUser,
				data,
			);

		// Create API response
		const response: ApiResponse<BookingRequestResponseDto[]> =
			new ApiResponse<BookingRequestResponseDto[]>(
				201,
				"Booking request created successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.BOOKING_REQUEST_UPDATE),
	)
	public async updateBookingRequest(
		@Param("id") id: string,
		@Body() data: UpdateBookingRequestDto,
		@Req() req: Request,
		@Res() res: Response,
	): Promise<Response> {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Update booking request by ID
		const result: BookingRequestResponseDto =
			await this.bookingRequestService.updateBookingRequest(
				currentUser,
				id,
				data,
			);

		// Create API response
		const response: ApiResponse<BookingRequestResponseDto> =
			new ApiResponse<BookingRequestResponseDto>(
				200,
				`Booking request with ID '${id}' updated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/reject")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.BOOKING_REQUEST_REJECT),
	)
	public async rejectBookingRequest(
		@Param("id") id: string,
		@Body() data: RejectBookingRequestDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Reject booking request by ID
		const result: BookingRequestResponseDto =
			await this.bookingRequestService.rejectBookingRequest(
				currentUser,
				id,
				data,
			);

		// Create API response
		const response: ApiResponse<BookingRequestResponseDto> =
			new ApiResponse<BookingRequestResponseDto>(
				200,
				`Booking request with ID '${id}' rejected successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/cancel")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.BOOKING_REQUEST_CANCEL),
	)
	public async cancelBookingRequest(
		@Param("id") id: string,
		@Body() data: CancelBookingRequestDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Cancel booking request by ID
		const result: BookingRequestResponseDto =
			await this.bookingRequestService.cancelBookingRequest(
				currentUser,
				id,
				data,
			);

		const response: ApiResponse<BookingRequestResponseDto> =
			new ApiResponse<BookingRequestResponseDto>(
				200,
				`Booking request with ID '${id}' cancelled successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Get("/:id/available-vehicles")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VEHICLE_GET_AVAILABLE),
	)
	public async getAvailableVehiclesForBookingRequest(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch available vehicles for booking request
		const result: DetailedVehicleResponseDto[] =
			await this.bookingRequestService.getAvailableVehiclesForBookingRequest(
				currentUser,
				id,
			);

		// Create API response
		const response: ApiResponse<DetailedVehicleResponseDto[]> =
			new ApiResponse<DetailedVehicleResponseDto[]>(
				200,
				`Available vehicles for booking request with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/assign-vehicle")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.BOOKING_REQUEST_ASSIGN_VEHICLE),
	)
	public async assignVehicleToBookingRequest(
		@Param("id") id: string,
		@Body() data: SelectVehicleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Assign vehicle to booking request by ID
		const result: BookingRequestResponseDto =
			await this.bookingRequestService.assignVehicleToBookingRequest(
				currentUser,
				id,
				data,
			);

		// Create API response
		const response: ApiResponse<BookingRequestResponseDto> =
			new ApiResponse<BookingRequestResponseDto>(
				200,
				`Vehicle with ID '${data.vehicleId}' assigned to booking request with ID '${id}' successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/assign-outsourced-vehicle")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.BOOKING_REQUEST_ASSIGN_VEHICLE),
	)
	public async assignOutsourcedVehicleToBookingRequest(
		@Param("id") id: string,
		@Body() data: CreateOutsourcedVehicleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Assign outsourced vehicle to booking request by ID
		const result: BookingRequestResponseDto =
			await this.bookingRequestService.assignOutsourcedVehicleToBookingRequest(
				currentUser,
				id,
				data,
			);

		// Create API response
		const response: ApiResponse<BookingRequestResponseDto> =
			new ApiResponse<BookingRequestResponseDto>(
				200,
				`Outsourced vehicle assigned to booking request with ID '${id}' successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Delete("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.BOOKING_REQUEST_DELETE),
	)
	public async deleteBookingRequest(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	): Promise<Response> {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Delete booking request by ID
		await this.bookingRequestService.deleteBookingRequest(currentUser, id);

		const response: ApiResponse<null> = new ApiResponse<null>(
			200,
			`Booking request with ID '${id}' deleted successfully.`,
			null,
		);

		return res.status(response.statusCode).json(response);
	}
}

export default BookingRequestController;
