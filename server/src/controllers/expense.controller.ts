import { Request, Response } from "express";
import {
	Body,
	BodyParam,
	Controller,
	Delete,
	Get,
	Param,
	Post,
	Put,
	QueryParams,
	Req,
	Res,
	UploadedFile,
	UseBefore,
} from "routing-controllers";
import { Service } from "typedi";
import IsAuthenticatedMiddleware from "../middlewares/is-authenticated.middleware";
import HasPermissionMiddleware from "../middlewares/has-permission.middleware";
import PermissionMap from "../constants/permission-map";
import ExpenseService from "../services/expense.service";
import ExpenseResponseDto from "../dtos/expense/expense-response.dto";
import CreateExpenseDto from "../dtos/expense/create-expense.dto";
import UpdateExpenseDto from "../dtos/expense/update-expense.dto";
import RejectExpenseDto from "../dtos/expense/reject-expense.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/expenses")
class ExpenseController {
	constructor(private readonly expenseService: ExpenseService) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.EXPENSE_GET),
	)
	public async getExpenses(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch expenses
		const result: ExpenseResponseDto[] =
			await this.expenseService.getExpenses(
				currentUser,
				pagination,
				query,
			);

		// Create API response
		const response: ApiResponse<ExpenseResponseDto[]> = new ApiResponse<
			ExpenseResponseDto[]
		>(200, "Expenses retrieved successfully.", result, {
			pagination: {
				page: pagination.page,
				limit: pagination.limit,
			},
			query: {
				type: query.type,
				status: query.status,
				minAmount: query.minAmount,
				maxAmount: query.maxAmount,
				createdAfter: query.createdAfter,
				createdBefore: query.createdBefore,
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
		HasPermissionMiddleware(PermissionMap.EXPENSE_GET),
	)
	public async getExpenseById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch expense by ID
		const result: ExpenseResponseDto =
			await this.expenseService.getExpenseById(currentUser, id);

		const response: ApiResponse<ExpenseResponseDto> =
			new ApiResponse<ExpenseResponseDto>(
				200,
				`Expense with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.EXPENSE_CREATE),
	)
	public async createExpense(
		@BodyParam("data") data: CreateExpenseDto,
		@UploadedFile("receipt") receipt: Express.Multer.File,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Create expense
		const result: ExpenseResponseDto =
			await this.expenseService.createExpense(currentUser, data, receipt);

		// Create API response
		const response: ApiResponse<ExpenseResponseDto> =
			new ApiResponse<ExpenseResponseDto>(
				201,
				"Expense created successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.EXPENSE_UPDATE),
	)
	public async updateExpense(
		@Param("id") id: string,
		@BodyParam("data") data: UpdateExpenseDto,
		@UploadedFile("receipt") receipt: Express.Multer.File,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Update expense by ID
		const result: ExpenseResponseDto =
			await this.expenseService.updateExpense(
				currentUser,
				id,
				data,
				receipt,
			);

		// Create API response
		const response: ApiResponse<ExpenseResponseDto> =
			new ApiResponse<ExpenseResponseDto>(
				200,
				`Expense with ID '${id}' updated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/approve")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.EXPENSE_APPROVE),
	)
	public async approveExpense(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Approve expense by ID
		const result: ExpenseResponseDto =
			await this.expenseService.approveExpense(currentUser, id);

		// Create API response
		const response: ApiResponse<ExpenseResponseDto> =
			new ApiResponse<ExpenseResponseDto>(
				200,
				`Expense with ID '${id}' approved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/reject")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.EXPENSE_REJECT),
	)
	public async rejectExpense(
		@Param("id") id: string,
		@Body() data: RejectExpenseDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Reject expense by ID
		const result: ExpenseResponseDto =
			await this.expenseService.rejectExpense(currentUser, id, data);

		// Create API response
		const response: ApiResponse<ExpenseResponseDto> =
			new ApiResponse<ExpenseResponseDto>(
				200,
				`Expense with ID '${id}' rejected successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id/cancel")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.EXPENSE_CANCEL),
	)
	public async cancelExpense(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Cancel expense by ID
		const result: ExpenseResponseDto =
			await this.expenseService.cancelExpense(currentUser, id);

		// Create API response
		const response: ApiResponse<ExpenseResponseDto> =
			new ApiResponse<ExpenseResponseDto>(
				200,
				`Expense with ID '${id}' canceled successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Delete("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.EXPENSE_DELETE),
	)
	public async deleteExpense(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Delete expense by ID
		await this.expenseService.deleteExpense(currentUser, id);

		// Create API response
		const response: ApiResponse<null> = new ApiResponse<null>(
			200,
			`Expense with ID '${id}' deleted successfully.`,
			null,
		);

		return res.status(response.statusCode).json(response);
	}
}

export default ExpenseController;
