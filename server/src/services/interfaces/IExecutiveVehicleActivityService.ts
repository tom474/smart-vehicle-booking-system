import CreateExecutiveVehicleActivityDto from "../../dtos/executive-vehicle-activity/create-executive-vehicle-activity.dto";
import ExecutiveVehicleActivityDto from "../../dtos/executive-vehicle-activity/executive-vehicle-activity.dto";
import UpdateExecutiveVehicleActivityDto from "../../dtos/executive-vehicle-activity/update-executive-vehicle-activity.dto";
import CurrentUser from "../../templates/current-user";
import Pagination from "../../templates/pagination";

interface IExecutiveVehicleActivityService {
	createByDriver(
		currentUser: CurrentUser,
		executiveId: string,
		request: CreateExecutiveVehicleActivityDto,
	): Promise<ExecutiveVehicleActivityDto>;

	getById(
		user: CurrentUser,
		activityId: string,
	): Promise<ExecutiveVehicleActivityDto>;

	updateByDriver(
		currentUser: CurrentUser,
		activityId: string,
		request: UpdateExecutiveVehicleActivityDto,
	): Promise<ExecutiveVehicleActivityDto>;

	driverGetActivities(
		executiveId: string,
		pagination: Pagination,
		status?: "pending" | "approved" | "rejected",
	): Promise<ExecutiveVehicleActivityDto[]>;

	executiveGetActivities(
		executiveId: string,
		pagination: Pagination,
		status?: "pending" | "approved" | "rejected",
	): Promise<ExecutiveVehicleActivityDto[]>;

	updateConfirmationStatus(
		executive: CurrentUser,
		activityId: string,
		isConfirmed: boolean,
	): Promise<ExecutiveVehicleActivityDto>;
}

export default IExecutiveVehicleActivityService;
