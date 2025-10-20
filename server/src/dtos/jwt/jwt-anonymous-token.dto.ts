import { Exclude, Expose } from "class-transformer";

@Exclude()
class JwtAnonymousTokenDto {
	@Expose()
	accessToken!: string;

	constructor(accessToken: string) {
		this.accessToken = accessToken;
	}
}

export default JwtAnonymousTokenDto;
