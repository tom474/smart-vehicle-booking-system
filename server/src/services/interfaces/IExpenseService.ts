import ExpenseResponseDto from "../../dtos/expense/expense-response.dto";
import CreateExpenseDto from "../../dtos/expense/create-expense.dto";
import UpdateExpenseDto from "../../dtos/expense/update-expense.dto";
import RejectExpenseDto from "../../dtos/expense/reject-expense.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface IExpenseService {
	/**
	 * Retrieves a list of expenses based with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of expense DTOs.
	 */
	getExpenses(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<ExpenseResponseDto[]>;

	/**
	 * Retrieves an expense by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the expense to retrieve.
	 * @returns A promise that resolves to the expense DTO.
	 */
	getExpenseById(
		currentUser: CurrentUser,
		id: string,
	): Promise<ExpenseResponseDto>;

	/**
	 * Creates a new expense with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param data - The data for the new expense.
	 * @param receipt - An optional receipt file associated with the expense.
	 * @returns A promise that resolves to the created expense DTO.
	 */
	createExpense(
		currentUser: CurrentUser,
		data: CreateExpenseDto,
		receipt?: Express.Multer.File,
	): Promise<ExpenseResponseDto>;

	/**
	 * Updates an existing expense by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the expense to update.
	 * @param data - The data for updating the expense.
	 * @param receipt - An optional receipt file associated with the expense.
	 * @returns A promise that resolves to the updated expense DTO.
	 */
	updateExpense(
		currentUser: CurrentUser,
		id: string,
		data: UpdateExpenseDto,
		receipt?: Express.Multer.File,
	): Promise<ExpenseResponseDto>;

	/**
	 * Approves an expense by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the expense to approve.
	 * @returns A promise that resolves to the approved expense DTO.
	 */
	approveExpense(
		currentUser: CurrentUser,
		id: string,
	): Promise<ExpenseResponseDto>;

	/**
	 * Rejects an expense by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the expense to reject.
	 * @param data - The data for rejecting the expense, including reason.
	 * @returns A promise that resolves to the rejected expense DTO.
	 */
	rejectExpense(
		currentUser: CurrentUser,
		id: string,
		data: RejectExpenseDto,
	): Promise<ExpenseResponseDto>;

	/**
	 * Cancels an expense by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the expense to cancel.
	 * @returns A promise that resolves to the canceled expense DTO.
	 */
	cancelExpense(
		currentUser: CurrentUser,
		id: string,
	): Promise<ExpenseResponseDto>;

	/**
	 * Deletes an expense by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the expense to delete.
	 * @returns A promise that resolves when the expense is deleted.
	 */
	deleteExpense(currentUser: CurrentUser, id: string): Promise<void>;
}

export default IExpenseService;
