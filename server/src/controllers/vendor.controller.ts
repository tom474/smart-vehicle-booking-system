import { Request, Response } from "express";
import {
	Body,
	Controller,
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
import VendorService from "../services/vendor.service";
import VendorResponseDto from "../dtos/vendor/vendor-response.dto";
import CreateVendorDto from "../dtos/vendor/create-vendor.dto";
import UpdateVendorDto from "../dtos/vendor/update-vendor.dto";
import CurrentUser from "../templates/current-user";
import Pagination from "../templates/pagination";
import ApiResponse from "../templates/api-response";

@Service()
@Controller("/vendors")
class VendorController {
	constructor(private readonly vendorService: VendorService) {}

	@Get("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VENDOR_GET),
	)
	public async getVendors(
		@QueryParams() pagination: Pagination,
		@QueryParams() query: Record<string, unknown>,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch vendors
		const result: VendorResponseDto[] = await this.vendorService.getVendors(
			currentUser,
			pagination,
			query,
		);

		// Create API response
		const response: ApiResponse<VendorResponseDto[]> = new ApiResponse<
			VendorResponseDto[]
		>(200, "Vendors retrieved successfully.", result, {
			pagination: {
				page: pagination.page,
				limit: pagination.limit,
			},
			query: {
				status: query.status,
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
		HasPermissionMiddleware(PermissionMap.VENDOR_GET),
	)
	public async getVendorById(
		@Param("id") id: string,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Fetch vendor by ID
		const result: VendorResponseDto =
			await this.vendorService.getVendorById(currentUser, id);

		// Create API response
		const response: ApiResponse<VendorResponseDto> =
			new ApiResponse<VendorResponseDto>(
				200,
				`Vendor with ID '${id}' retrieved successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Post("")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VENDOR_CREATE),
	)
	public async createVendor(
		@Body() data: CreateVendorDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Create a new vendor
		const result: VendorResponseDto = await this.vendorService.createVendor(
			currentUser,
			data,
		);

		// Create API response
		const response: ApiResponse<VendorResponseDto> =
			new ApiResponse<VendorResponseDto>(
				201,
				"Vendor created successfully.",
				result,
			);

		return res.status(response.statusCode).json(response);
	}

	@Put("/:id")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.VENDOR_UPDATE),
	)
	public async updateVendor(
		@Param("id") id: string,
		@Body() data: UpdateVendorDto,
		@Req() req: Request,
		@Res() res: Response,
	) {
		// Get the current user
		const currentUser: CurrentUser = req.cookies.currentUser;

		// Update vendor by ID
		const result: VendorResponseDto = await this.vendorService.updateVendor(
			currentUser,
			id,
			data,
		);

		// Create API response
		const response: ApiResponse<VendorResponseDto> =
			new ApiResponse<VendorResponseDto>(
				200,
				`Vendor with ID '${id}' updated successfully.`,
				result,
			);

		return res.status(response.statusCode).json(response);
	}
}

export default VendorController;
