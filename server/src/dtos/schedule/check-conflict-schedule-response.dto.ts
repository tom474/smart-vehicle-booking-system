import { Exclude, Expose } from "class-transformer";

@Exclude()
class CheckConflictScheduleResponseDto {
	@Expose()
	isConflicted!: boolean;

	@Expose()
	conflictingScheduleIds!: string[];
}

export default CheckConflictScheduleResponseDto;
