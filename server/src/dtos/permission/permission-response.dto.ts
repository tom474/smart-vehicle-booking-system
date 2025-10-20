import { Exclude, Expose } from "class-transformer";

@Exclude()
class PermissionResponseDto {
	@Expose()
	id!: string;

	@Expose()
	title!: string;

	@Expose()
	key!: string;

	@Expose()
	description?: string | null;
}

export default PermissionResponseDto;
