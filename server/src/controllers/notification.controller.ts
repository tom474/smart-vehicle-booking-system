import { Request, Response } from "express";
import {
	Body,
	Controller,
	Get,
	Param,
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
import NotificationService from "../services/notification.service";
import NotificationResponseDto from "../dtos/notification/notification-response.dto";
import ApiResponse from "../templates/api-response";
import ApiError from "../templates/api-error";
import Pagination from "../templates/pagination";
import CurrentUser from "../templates/current-user";

@Service()
@Controller("/notifications")
class NotificationController {
	constructor(private readonly notificationService: NotificationService) {}

	@Get("/:userId")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.NOTIFICATION_GET),
	)
	async getNotificationsByUser(
		@Param("userId") userId: string,
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Res() res: Response,
		@Req() req: Request,
	) {
		try {
			const currentUser: CurrentUser = req.cookies.currentUser;
			const result: NotificationResponseDto[] =
				await this.notificationService.getByUser(
					userId,
					currentUser.role,
					pagination,
					query,
				);

			const response: ApiResponse<NotificationResponseDto[]> =
				new ApiResponse<NotificationResponseDto[]>(
					200,
					"Notifications retrieved successfully.",
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
				: new ApiError("Failed to get notifications.", 500, error);
		}
	}

	@Get("/:userId/unread")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.NOTIFICATION_GET),
	)
	async getUnreadNotificationCount(
		@Param("userId") userId: string,
		@Res() res: Response,
		@Req() req: Request,
	) {
		try {
			const currentUser: CurrentUser = req.cookies.currentUser;

			const result = await this.notificationService.getUnreadNotification(
				userId,
				currentUser.role,
			);

			const response = new ApiResponse(
				200,
				"Unread notification count retrieved successfully.",
				result,
			);

			return res.status(response.statusCode).json(response);
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to retrieve unread notification count.",
						500,
						error,
					);
		}
	}

	@Put("/:id/read")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.NOTIFICATION_MARK_AS_READ),
	)
	async markNotificationAsRead(
		@Param("id") id: string,
		@Res() res: Response,
	) {
		try {
			await this.notificationService.markAsRead(id);

			const response: ApiResponse<null> = new ApiResponse<null>(
				200,
				"Notification marked as read.",
				null,
			);

			return res.status(response.statusCode).json(response);
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to mark notification as read.",
						500,
						error,
					);
		}
	}

	@Put("/read")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.NOTIFICATION_MARK_AS_READ),
	)
	async markNotificationsAsRead(
		@Body() body: { notificationsId: string[] },
		@Res() res: Response,
	) {
		try {
			if (
				!body?.notificationsId ||
				!Array.isArray(body.notificationsId) ||
				body.notificationsId.length === 0
			) {
				throw new ApiError(
					"notificationsId must be a non-empty string array.",
					400,
				);
			}

			const result: NotificationResponseDto[] =
				await this.notificationService.markNotificationsAsRead(
					body.notificationsId,
				);

			const response: ApiResponse<NotificationResponseDto[]> =
				new ApiResponse<NotificationResponseDto[]>(
					200,
					"Notifications marked as read.",
					result,
				);

			return res.status(response.statusCode).json(response);
		} catch (error: unknown) {
			throw error instanceof ApiError
				? error
				: new ApiError(
						"Failed to mark notifications as read.",
						500,
						error,
					);
		}
	}
}

export default NotificationController;
