import { format } from "date-fns";
import { Car, Clock, MessageSquareMore, User } from "lucide-react";
import { getDriver } from "@/apis/driver";
import type { ScheduleData } from "@/apis/schedule";
import { getVehicle } from "@/apis/vehicle";
import { DataFetcher } from "@/components/data-fetcher";
import FieldSeparator from "@/components/form-field/field-separator";
import TextViewField from "@/components/ui/view-field";
import { Errorable } from "@/components/undefinable";
import { dateTimeFormat } from "@/lib/date-time-format";
import { apiURL } from "@/lib/utils";

interface Props {
	data: ScheduleData;
}

export const ViewSchedule = ({ data }: Props) => {
	return (
		<FieldSeparator>
			<TextViewField
				icon={MessageSquareMore}
				title="Title"
				value={data.title}
			/>

			<TextViewField
				variant="dropdown"
				icon={MessageSquareMore}
				title="Description"
				value={data.description}
			/>

			<TextViewField
				icon={Clock}
				title="From"
				value={format(data.startTime, dateTimeFormat)}
			/>

			<TextViewField
				icon={Clock}
				title="To"
				value={format(data.endTime, dateTimeFormat)}
			/>

			<TextViewField
				icon={User}
				title="Driver"
				value={
					data.driverId ? (
						<DataFetcher
							urlId={`${apiURL}/drivers/${data.driverId}`}
							loading={data.driverId}
							fetcher={getDriver(data.driverId)}
							onFetchFinished={(user) => user.name}
						/>
					) : (
						<Errorable shouldError variant="missing" />
					)
				}
			/>

			<TextViewField
				icon={User}
				title="Vehicle"
				value={
					data.vehicleId ? (
						<DataFetcher
							urlId={`${apiURL}/vehicles/${data.vehicleId}`}
							fetcher={getVehicle(data.vehicleId)}
							onFetchFinished={(driver) =>
								`${driver.model} - ${driver.licensePlate}`
							}
						/>
					) : (
						<Errorable shouldError variant="missing" />
					)
				}
			/>

			<TextViewField
				icon={Car}
				title="Trip"
				value={<Errorable value={data.tripId} variant="missing" />}
			/>
			<TextViewField
				icon={Car}
				title="Vehicle Service"
				value={
					<Errorable value={data.vehicleService} variant="missing" />
				}
			/>
			<TextViewField
				icon={Car}
				title="Leave Request"
				value={
					<Errorable value={data.leaveRequest} variant="missing" />
				}
			/>

			{data.updatedAt || data.createdAt ? (
				<TextViewField
					icon={Clock}
					title="Last modified"
					value={format(
						data.updatedAt || data.createdAt || new Date(),
						dateTimeFormat,
					)}
				/>
			) : (
				<Errorable shouldError />
			)}
		</FieldSeparator>
	);
};
