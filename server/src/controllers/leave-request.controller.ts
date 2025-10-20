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
import LeaveRequestService from "../services/leave-request.service";
import LeaveRequestResponseDto from "../dtos/leave-request/leave-request-response.dto";
import CreateLeaveRequestDto from "../dtos/leave-request/create-leave-request.dto";
import UpdateLeaveRequestDto from "../dtos/leave-request/update-leave-request.dto";
import RejectLeaveRequestDto from "../dtos/leave-request/reject-leave-request.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/leave-requests")
class LeaveRequestController {
	constructor(private readonly leaveRequestService: LeaveRequestService) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.LEAVE_REQUEST_GET),
	)
	public async getLeaveRequests(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch leave requests
		const result: LeaveRequestResponseDto[] =
			await this.leaveRequestService.getLeaveRequests(
				currentUser,
				pagination,
				query,
			);

		// Create API response
		const response: ApiResponse<LeaveRequestResponseDto[]> =
			new ApiResponse<LeaveRequestResponseDto[]>(
				200,
				"Leave requests retrieved successfully.",
				result,
				{
					pagination: {
						page: pagination.page,
						limit: pagination.limit,
					},
					query: {
						status: query.status,
						startTimeFrom: query.startTimeFrom,
						startTimeTo: query.startTimeTo,
						endTimeFrom: query.endTimeFrom,
						endTimeTo: query.endTimeTo,
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
		HasPermissionMiddleware(PermissionMap.LEAVE_REQUEST_GET),
	)
	public async getLeaveRequestById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch leave request by ID
		const result: LeaveRequestResponseDto =
			await this.leaveRequestService.getLeaveRequestById(currentUser, id);

		// Create API response
		const response: ApiResponse<LeaveRequestResponseDto> =
			new ApiResponse<LeaveRequestResponseDto>(
				200,
				`Leave request with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.LEAVE_REQUEST_CREATE),
	)
	public async createLeaveRequest(
		@Body() data: CreateLeaveRequestDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Create leave request
		const result: LeaveRequestResponseDto =
			await this.leaveRequestService.createLeaveRequest(
				currentUser,
				data,
			);

		// Create API response
		const response: ApiResponse<LeaveRequestResponseDto> =
			new ApiResponse<LeaveRequestResponseDto>(
				201,
				"Leave request created successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.LEAVE_REQUEST_UPDATE),
	)
	public async updateLeaveRequest(
		@Param("id") id: string,
		@Req() req: Request,
		@Body() data: UpdateLeaveRequestDto,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Update leave request by ID
		const result: LeaveRequestResponseDto =
			await this.leaveRequestService.updateLeaveRequest(
				currentUser,
				id,
				data,
			);

		// Create API response
		const response: ApiResponse<LeaveRequestResponseDto> =
			new ApiResponse<LeaveRequestResponseDto>(
				200,
				`Leave request with ID '${id}' updated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/approve")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.LEAVE_REQUEST_APPROVE),
	)
	public async approveLeaveRequest(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Approve leave request by ID
		const result: LeaveRequestResponseDto =
			await this.leaveRequestService.approveLeaveRequest(currentUser, id);

		// Create API response
		const response: ApiResponse<LeaveRequestResponseDto> =
			new ApiResponse<LeaveRequestResponseDto>(
				200,
				`Leave request with ID '${id}' approved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/reject")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.LEAVE_REQUEST_REJECT),
	)
	public async rejectLeaveRequest(
		@Param("id") id: string,
		@Body() data: RejectLeaveRequestDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Reject leave request by ID
		const result: LeaveRequestResponseDto =
			await this.leaveRequestService.rejectLeaveRequest(
				currentUser,
				id,
				data,
			);

		// Create API response
		const response: ApiResponse<LeaveRequestResponseDto> =
			new ApiResponse<LeaveRequestResponseDto>(
				200,
				`Leave request with ID '${id}' rejected successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/cancel")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.LEAVE_REQUEST_CANCEL),
	)
	public async cancelLeaveRequest(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Cancel leave request by ID
		const result: LeaveRequestResponseDto =
			await this.leaveRequestService.cancelLeaveRequest(currentUser, id);

		// Create API response
		const response: ApiResponse<LeaveRequestResponseDto> =
			new ApiResponse<LeaveRequestResponseDto>(
				200,
				`Leave request with ID '${id}' canceled successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Delete("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.LEAVE_REQUEST_DELETE),
	)
	public async deleteLeaveRequest(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Delete leave request by ID
		await this.leaveRequestService.deleteLeaveRequest(currentUser, id);

		// Create API response
		const response: ApiResponse<null> = new ApiResponse<null>(
			200,
			`Leave request with ID '${id}' deleted successfully.`,
			null,
		);

		return res.status(response.statusCode).json(response);
	}
}

export default LeaveRequestController;
