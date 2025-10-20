import { Request, Response } from "express";
import {
	Controller,
	Get,
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
import ActivityLogService from "../services/activity-log.service";
import ActivityLogResponseDto from "../dtos/activity-log/activity-log-response.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/activity-logs")
class ActivityLogController {
	constructor(private readonly activityLogService: ActivityLogService) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.ACTIVITY_LOG_GET),
	)
	public async getActivityLogs(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch activity logs
		const result: ActivityLogResponseDto[] =
			await this.activityLogService.getActivityLogs(
				currentUser,
				pagination,
				query,
			);

		// Create API response
		const response: ApiResponse<ActivityLogResponseDto[]> = new ApiResponse<
			ActivityLogResponseDto[]
		>(200, "Activity logs retrieved successfully.", result, {
			pagination: {
				page: pagination.page,
				limit: pagination.limit,
			},
			query: {
				actionType: query.actionType,
				from: query.from,
				to: query.to,
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
		HasPermissionMiddleware(PermissionMap.ACTIVITY_LOG_GET),
	)
	public async getActivityLogById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch activity log by ID
		const result: ActivityLogResponseDto =
			await this.activityLogService.getActivityLogById(currentUser, id);

		// Create API response
		const response: ApiResponse<ActivityLogResponseDto> =
			new ApiResponse<ActivityLogResponseDto>(
				200,
				`Activity log with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default ActivityLogController;
