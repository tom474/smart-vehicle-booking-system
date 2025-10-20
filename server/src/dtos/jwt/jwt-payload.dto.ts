import { Exclude, Expose } from "class-transformer";
import UserStatus from "../../database/enums/UserStatus";

@Exclude()
class JwtPayloadDto {
	@Expose()
	id!: string;

	@Expose()
	email!: string;

	@Expose()
	role!: string;

	@Expose()
	status!: UserStatus;
}

export default JwtPayloadDto;
