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
import ScheduleService from "../services/schedule.service";
import ScheduleResponseDto from "../dtos/schedule/schedule-response.dto";
import CreateScheduleDto from "../dtos/schedule/create-schedule.dto";
import UpdateScheduleDto from "../dtos/schedule/update-schedule.dto";
import CheckConflictScheduleDto from "../dtos/schedule/check-conflict-schedule.dto";
import CheckConflictScheduleResponseDto from "../dtos/schedule/check-conflict-schedule-response.dto";
import CurrentUser from "../templates/current-user";
import ApiResponse from "../templates/api-response";
import Pagination from "../templates/pagination";

@Service()
@Controller("/schedules")
class ScheduleController {
	constructor(private readonly scheduleService: ScheduleService) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.SCHEDULE_GET),
	)
	public async getSchedules(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch schedules
		const result: ScheduleResponseDto[] =
			await this.scheduleService.getSchedules(
				currentUser,
				pagination,
				query,
			);

		// Create API response
		const response: ApiResponse<ScheduleResponseDto[]> = new ApiResponse<
			ScheduleResponseDto[]
		>(200, "Schedules retrieved successfully.", result, {
			pagination: {
				page: pagination.page,
				limit: pagination.limit,
			},
			query: {
				startTimeFrom: query.startTimeFrom,
				startTimeTo: query.startTimeTo,
				endTimeFrom: query.endTimeFrom,
				endTimeTo: query.endTimeTo,
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
		HasPermissionMiddleware(PermissionMap.SCHEDULE_GET),
	)
	public async getScheduleById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch the schedule by ID
		const result: ScheduleResponseDto =
			await this.scheduleService.getScheduleById(currentUser, id);

		// Create API response
		const response: ApiResponse<ScheduleResponseDto> =
			new ApiResponse<ScheduleResponseDto>(
				200,
				`Schedule with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.SCHEDULE_CREATE),
	)
	public async createSchedule(
		@Body() data: CreateScheduleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Create a new schedule
		const result: ScheduleResponseDto =
			await this.scheduleService.createSchedule(currentUser, data);

		// Create API response
		const response: ApiResponse<ScheduleResponseDto> =
			new ApiResponse<ScheduleResponseDto>(
				201,
				"Schedule created successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.SCHEDULE_UPDATE),
	)
	public async updateSchedule(
		@Param("id") id: string,
		@Body() data: UpdateScheduleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Update the schedule by ID
		const result: ScheduleResponseDto =
			await this.scheduleService.updateSchedule(currentUser, id, data);

		// Create API response
		const response: ApiResponse<ScheduleResponseDto> =
			new ApiResponse<ScheduleResponseDto>(
				200,
				`Schedule with ID '${id}' updated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Delete("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.SCHEDULE_DELETE),
	)
	public async deleteSchedule(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Delete the schedule by ID
		await this.scheduleService.deleteSchedule(currentUser, id);

		// Create API response
		const response: ApiResponse<null> = new ApiResponse<null>(
			200,
			`Schedule with ID '${id}' deleted successfully.`,
			null,
		);

		return res.status(response.statusCode).json(response);
	}

	@Post("/check-conflicts")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.SCHEDULE_CHECK_CONFLICT),
	)
	public async checkConflictSchedule(
		@Body() data: CheckConflictScheduleDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Check for schedule conflicts
		const result: CheckConflictScheduleResponseDto =
			await this.scheduleService.checkConflictSchedule(currentUser, data);

		// Create API response
		const response: ApiResponse<CheckConflictScheduleResponseDto> =
			new ApiResponse<CheckConflictScheduleResponseDto>(
				200,
				"Schedule conflicts checked successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default ScheduleController;
