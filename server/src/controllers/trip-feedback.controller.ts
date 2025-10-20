import { Request, Response } from "express";
import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	QueryParams,
	Req,
	Res,
	UseBefore,
} from "routing-controllers";
import { Service } from "typedi";
import IsAuthenticatedMiddleware from "../middlewares/is-authenticated.middleware";
import HasPermissionMiddleware from "../middlewares/has-permission.middleware";
import PermissionMap from "../constants/permission-map";
import TripFeedbackService from "../services/trip-feedback.service";
import TripFeedbackResponseDto from "../dtos/trip-feedback/trip-feedback-response.dto";
import CreateTripFeedbackDto from "../dtos/trip-feedback/create-trip-feedback.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("")
class TripFeedbackController {
	constructor(private readonly tripFeedbackService: TripFeedbackService) {}

	@Get("/trip-feedbacks")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_FEEDBACK_GET),
	)
	public async getFeedbacks(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Fetch trip feedbacks
		const result: TripFeedbackResponseDto[] =
			await this.tripFeedbackService.getTripFeedbacks(pagination, query);

		// Create API response
		const response: ApiResponse<TripFeedbackResponseDto[]> =
			new ApiResponse<TripFeedbackResponseDto[]>(
				200,
				"Trip feedbacks retrieved successfully.",
				result,
				{
					pagination: {
						page: pagination.page,
						limit: pagination.limit,
					},
					query: {
						rating: query.rating,
						userId: query.userId,
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

	@Get("/trip-feedbacks/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_FEEDBACK_GET),
	)
	public async getFeedbackById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch trip feedback by ID
		const result: TripFeedbackResponseDto =
			await this.tripFeedbackService.getTripFeedbackById(currentUser, id);

		// Create API response
		const response: ApiResponse<TripFeedbackResponseDto> =
			new ApiResponse<TripFeedbackResponseDto>(
				200,
				`Trip feedback with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("/trip-feedbacks")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_FEEDBACK_CREATE),
	)
	public async createFeedback(
		@Body() request: CreateTripFeedbackDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Create trip feedback
		const result: TripFeedbackResponseDto =
			await this.tripFeedbackService.createTripFeedback(
				currentUser,
				request,
			);

		// Create API response
		const response: ApiResponse<TripFeedbackResponseDto> =
			new ApiResponse<TripFeedbackResponseDto>(
				201,
				"Trip feedback created successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Get("/trips/:id/user-feedback")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.TRIP_FEEDBACK_GET),
	)
	public async getOwnFeedback(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch trip feedback by trip ID and current user ID
		const result: TripFeedbackResponseDto =
			await this.tripFeedbackService.getOwnTripFeedbacks(currentUser, id);

		// Create API response
		const response: ApiResponse<TripFeedbackResponseDto> =
			new ApiResponse<TripFeedbackResponseDto>(
				200,
				`Trip feedback for trip with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default TripFeedbackController;
