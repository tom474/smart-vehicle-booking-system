import { Exclude, Expose } from "class-transformer";

@Exclude()
class SettingResponseDto {
	@Expose()
	id!: string;

	@Expose()
	title!: string;

	@Expose()
	key!: string;

	@Expose()
	value!: string;

	@Expose()
	description?: string | null;
}

export default SettingResponseDto;
