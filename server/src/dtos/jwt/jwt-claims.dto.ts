import { Exclude } from "class-transformer";
import JwtPayloadDto from "./jwt-payload.dto";

@Exclude()
class JwtClaimsDto extends JwtPayloadDto {
	iat!: number;

	exp!: number;

	getPayload(): JwtPayloadDto {
		return {
			id: this.id,
			email: this.email,
			role: this.role,
			status: this.status,
		};
	}
}

export default JwtClaimsDto;
