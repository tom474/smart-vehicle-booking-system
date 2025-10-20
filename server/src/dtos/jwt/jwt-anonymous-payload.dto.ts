import { Exclude, Expose } from "class-transformer";
import RoleMap from "../../constants/role-map";

@Exclude()
class JwtAnonymousPayloadDto {
	@Expose()
	role!: string;

	constructor() {
		this.role = RoleMap.ANONYMOUS;
	}
}

export default JwtAnonymousPayloadDto;
