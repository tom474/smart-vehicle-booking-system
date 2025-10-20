import {
	Car,
	Clock,
	MessageSquareMore,
	Star,
	ThumbsUp,
	User,
} from "lucide-react";
import type { TripFeedbackData } from "@/apis/trip-feedback";
import FieldSeparator from "@/components/form-field/field-separator";
import TextViewField from "@/components/ui/view-field";
import { format } from "date-fns";
import { dateTimeFormat } from "@/lib/date-time-format";
import { Errorable } from "@/components/undefinable";
import { DataFetcher } from "@/components/data-fetcher";
import { getUser } from "@/apis/user";
import { getTrip } from "@/apis/trip";

interface Props {
	data: TripFeedbackData;
}

export const ViewTripFeedbacks = ({ data }: Props) => {
	return (
		<FieldSeparator>
			<TextViewField
				icon={ThumbsUp}
				title="Rating"
				value={
					<div className="flex items-center gap-2">
						{data.rating}
						<div className="flex">
							{[0, 1, 2, 3, 4].map((i) => (
								<Star
									key={i}
									className={`h-4 w-4 ${
										i < data.rating
											? "fill-yellow-400 text-yellow-400"
											: "text-muted-foreground"
									}`}
								/>
							))}
						</div>
					</div>
				}
			/>

			<TextViewField
				variant="dropdown"
				icon={MessageSquareMore}
				title="Comment"
				value={data.comment}
			/>

			<TextViewField
				icon={User}
				title="Reviewed by"
				value={
					<DataFetcher
						urlId={`/api/users/${data.userId}`}
						loading={data.userId}
						fetcher={getUser(data.userId)}
						onFetchFinished={(user) => user.name}
					/>
				}
			/>

			{data.updatedAt || data.createdAt ? (
				<TextViewField
					icon={Clock}
					title="At"
					value={format(
						data.updatedAt || data.createdAt || new Date(),
						dateTimeFormat,
					)}
				/>
			) : (
				<Errorable shouldError />
			)}

			<TextViewField icon={Car} title="Trip" value={data.tripId} />

			<TextViewField
				icon={User}
				title="By"
				value={
					<DataFetcher
						urlId={`/api/trips/${data.tripId}`}
						loading={data.tripId}
						fetcher={getTrip(data.tripId)}
						onFetchFinished={(user) => (
							<Errorable value={user.driver?.name} />
						)}
					/>
				}
			/>
		</FieldSeparator>
	);
};
