import { Exclude, Expose, Transform } from "class-transformer";
import RoleMap from "../../constants/role-map";

@Exclude()
class RoleResponseDto {
	@Expose()
	id!: string;

	@Expose()
	title!: string;

	@Expose()
	key!: string;

	@Expose()
	description?: string | null;

	@Expose()
	@Transform(({ obj }) => obj.permissions.length)
	numberOfPermissions!: number;

	@Expose()
	@Transform(({ obj }) =>
		obj.key === RoleMap.DRIVER ? obj.drivers.length : obj.users.length,
	)
	numberOfUsers!: number;
}

export default RoleResponseDto;
