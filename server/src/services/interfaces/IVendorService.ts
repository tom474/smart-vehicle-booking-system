import VendorResponseDto from "../../dtos/vendor/vendor-response.dto";
import CreateVendorDto from "../../dtos/vendor/create-vendor.dto";
import UpdateVendorDto from "../../dtos/vendor/update-vendor.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface IVendorService {
	/**
	 * Retrieves a list of vendors with pagination and query parameters.
	 * @param currentUser - The current user making the request.
	 * @param pagination - Pagination parameters.
	 * @param query - Query parameters for filtering, searching, and ordering.
	 * @returns A promise that resolves to an array of vendor response DTOs.
	 */
	getVendors(
		currentUser: CurrentUser,
		pagination: Pagination,
		query: Record<string, unknown>,
	): Promise<VendorResponseDto[]>;

	/**
	 * Retrieves a vendor by its ID.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the vendor to retrieve.
	 * @returns A promise that resolves to the vendor response DTO.
	 */
	getVendorById(
		currentUser: CurrentUser,
		id: string,
	): Promise<VendorResponseDto>;

	/**
	 * Creates a new vendor with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param data - The data for creating a new vendor.
	 * @returns A promise that resolves to the created vendor response DTO.
	 */
	createVendor(
		currentUser: CurrentUser,
		data: CreateVendorDto,
	): Promise<VendorResponseDto>;

	/**
	 * Updates an existing vendor by its ID with the provided data.
	 * @param currentUser - The current user making the request.
	 * @param id - The ID of the vendor to update.
	 * @param data - The data for updating the vendor.
	 * @returns A promise that resolves to the updated vendor response DTO.
	 */
	updateVendor(
		currentUser: CurrentUser,
		id: string,
		data: UpdateVendorDto,
	): Promise<VendorResponseDto>;
}

export default IVendorService;
