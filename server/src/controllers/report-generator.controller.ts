import { Request, Response } from "express";
import {
	Controller,
	Get,
	QueryParam,
	Req,
	Res,
	UseBefore,
} from "routing-controllers";
import { Service } from "typedi";
import IsAuthenticatedMiddleware from "../middlewares/is-authenticated.middleware";
import HasPermissionMiddleware from "../middlewares/has-permission.middleware";
import ReportGenerator from "../services/report-generator.service";
import PermissionMap from "../constants/permission-map";
import ApiError from "../templates/api-error";

@Service()
@Controller("/exports")
class ReportController {
	constructor(private readonly report: ReportGenerator) {}

	@Get("/all")
	@UseBefore(
		IsAuthenticatedMiddleware,
		HasPermissionMiddleware(PermissionMap.REPORT_GENERATE),
	)
	async downloadAllZip(
		@Req() req: Request,
		@Res() res: Response,
		@QueryParam("fileName") fileName?: string,
		@QueryParam("startTime") startTime?: Date,
		@QueryParam("endTime") endTime?: Date,
	) {
		// Validate startTime is before endTime
		if (startTime && endTime && startTime >= endTime) {
			throw new ApiError("Start time must be before end time.", 400, {
				startTime,
				endTime,
			});
		}

		const { downloadUrl, filename } =
			await this.report.generateAndUploadZip({
				filename: fileName,
				startTime: startTime,
				endTime: endTime,
			});

		return res.json({
			success: true,
			downloadUrl,
			filename,
			message: "Report generated and uploaded successfully",
		});
	}
}

export default ReportController;
