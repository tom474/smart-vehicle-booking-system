import {
	Body,
	Post,
	Res,
	Controller,
	UseBefore,
	Req,
	Param,
	QueryParams,
	Get,
	QueryParam,
	Put,
} from "routing-controllers";
import { Response, Request } from "express";
import { Service } from "typedi";
import IsAuthenticatedMiddleware from "../middlewares/is-authenticated.middleware";
import HasPermissionMiddleware from "../middlewares/has-permission.middleware";
import PermissionMap from "../constants/permission-map";
import ExecutiveVehicleActivityService from "../services/executive-vehicle-activity.service";
import CreateExecutiveVehicleActivityDto from "../dtos/executive-vehicle-activity/create-executive-vehicle-activity.dto";
import ApiResponse from "../templates/api-response";
import ApiError from "../templates/api-error";
import ExecutiveVehicleActivityDto from "../dtos/executive-vehicle-activity/executive-vehicle-activity.dto";
import Pagination from "../templates/pagination";
import UpdateExecutiveVehicleActivityDto from "../dtos/executive-vehicle-activity/update-executive-vehicle-activity.dto";
import CurrentUser from "../templates/current-user";

@Service()
@Controller("")
class ExecutiveVehicleActivityController {
	constructor(
		private readonly executiveVehicleActivityService: ExecutiveVehicleActivityService,
	) {}

	@Get("/logs/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.EXECUTIVE_VEHICLE_ACTIVITY_GET),
	)
	async getActivityLogsById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		try {
			const user: CurrentUser = req.cookies.currentUser;
			const result = await this.executiveVehicleActivityService.getById(
				user,
				id,
			);

			const response = new ApiResponse<ExecutiveVehicleActivityDto>(
				200,
				"Activity log retrieved successfully.",
				result,
			);

			return res.status(response.statusCode).json(response);
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to retrieve executive vehicle activity log.",
						500,
						error,
					);
		}
	}

	@Get("/executives/:id/logs")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.EXECUTIVE_VEHICLE_ACTIVITY_GET),
	)
	async getActivityLogsByExecutive(
		@Param("id") executiveId: string,
		@QueryParams() pagination: Pagination,
		@QueryParam("status", {
			required: false,
		})
		status: "pending" | "approved" | "rejected",
		@Req() req: Request,
		@Res() res: Response,
	) {
		try {
			const user: CurrentUser = req.cookies.currentUser;
			if (user.id !== executiveId) {
				throw new ApiError(
					"You are not authorized to get this executive's activity logs",
				);
			}
			const result =
				await this.executiveVehicleActivityService.executiveGetActivities(
					executiveId,
					pagination,
					status,
				);

			if (!result || result.length === 0) {
				const emptyResponse = new ApiResponse<
					ExecutiveVehicleActivityDto[]
				>(204, "No executive activity logs found.", []);
				return res.status(emptyResponse.statusCode).json(emptyResponse);
			}

			const response = new ApiResponse<ExecutiveVehicleActivityDto[]>(
				200,
				"Executive vehicle activity logs retrieved successfully.",
				result,
				{
					page: pagination.page,
					limit: pagination.limit,
				},
			);

			return res.status(response.statusCode).json(response);
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to retrieve executive vehicle activity logs.",
						500,
						error,
					);
		}
	}

	@Get("/drivers/:id/logs")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.EXECUTIVE_VEHICLE_ACTIVITY_GET),
	)
	async getActivityLogsByDriver(
		@Param("id") driverId: string,
		@QueryParams() pagination: Pagination,
		@QueryParam("status", {
			required: false,
		})
		status: "pending" | "approved" | "rejected",
		@Req() req: Request,
		@Res() res: Response,
	) {
		try {
			const user: CurrentUser = req.cookies.currentUser;
			if (user.id !== driverId) {
				throw new ApiError(
					"You are not authorized to get this executive's activity logs",
				);
			}
			const result =
				await this.executiveVehicleActivityService.driverGetActivities(
					driverId,
					pagination,
					status,
				);

			if (!result || result.length === 0) {
				const emptyResponse = new ApiResponse<
					ExecutiveVehicleActivityDto[]
				>(204, "No executive activity logs found.", []);
				return res.status(emptyResponse.statusCode).json(emptyResponse);
			}

			const response = new ApiResponse<ExecutiveVehicleActivityDto[]>(
				200,
				"Executive vehicle activity logs retrieved successfully.",
				result,
				{
					page: pagination.page,
					limit: pagination.limit,
				},
			);

			return res.status(response.statusCode).json(response);
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to retrieve executive vehicle activity logs.",
						500,
						error,
					);
		}
	}

	@Post("/executives/:id/logs")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(
			PermissionMap.EXECUTIVE_VEHICLE_ACTIVITY_CREATE,
		),
	)
	async createActivityLogByDriver(
		@Param("id") executiveId: string,
		@Body() request: CreateExecutiveVehicleActivityDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		try {
			const currentUser = req.cookies.currentUser;

			const result =
				await this.executiveVehicleActivityService.createByDriver(
					currentUser,
					executiveId,
					request,
				);

			const response = new ApiResponse<ExecutiveVehicleActivityDto>(
				201,
				"Executive vehicle activity log submitted successfully.",
				result,
			);

			return res.status(response.statusCode).json(response);
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to submit executive vehicle activity log.",
						500,
						error,
					);
		}
	}

	@Put("/logs/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(
			PermissionMap.EXECUTIVE_VEHICLE_ACTIVITY_UPDATE,
		),
	)
	async updateActivityLogByDriver(
		@Param("id") activityId: string,
		@Body() request: UpdateExecutiveVehicleActivityDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		try {
			const currentUser = req.cookies.currentUser;

			const result =
				await this.executiveVehicleActivityService.updateByDriver(
					currentUser,
					activityId,
					request,
				);

			const response = new ApiResponse<ExecutiveVehicleActivityDto>(
				200,
				"Executive vehicle activity log updated successfully.",
				result,
			);

			return res.status(response.statusCode).json(response);
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to update executive vehicle activity log.",
						500,
						error,
					);
		}
	}

	@Put("/logs/:id/confirm")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(
			PermissionMap.EXECUTIVE_VEHICLE_ACTIVITY_CONFIRM,
		),
	)
	async confirmActivityLogByExecutive(
		@Param("id") activityId: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		try {
			const user: CurrentUser = req.cookies.currentUser;
			const result =
				await this.executiveVehicleActivityService.updateConfirmationStatus(
					user,
					activityId,
					true,
				);

			const response = new ApiResponse<ExecutiveVehicleActivityDto>(
				200,
				"Activity log confirmed successfully.",
				result,
			);

			return res.status(response.statusCode).json(response);
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to confirm activity log.", 500, error);
		}
	}

	@Put("/logs/:id/reject")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(
			PermissionMap.EXECUTIVE_VEHICLE_ACTIVITY_REJECT,
		),
	)
	async rejectActivityLogByExecutive(
		@Param("id") activityId: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		try {
			const user: CurrentUser = req.cookies.currentUser;
			const result =
				await this.executiveVehicleActivityService.updateConfirmationStatus(
					user,
					activityId,
					false,
				);

			const response = new ApiResponse<ExecutiveVehicleActivityDto>(
				200,
				"Activity log rejected successfully.",
				result,
			);

			return res.status(response.statusCode).json(response);
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError("Failed to reject activity log.", 500, error);
		}
	}
}

export default ExecutiveVehicleActivityController;
