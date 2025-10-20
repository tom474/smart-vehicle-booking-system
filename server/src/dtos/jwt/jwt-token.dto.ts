import { Exclude, Expose } from "class-transformer";

@Exclude()
class JwtTokenDto {
	@Expose()
	accessToken!: string;

	@Expose()
	refreshToken!: string;
}

export default JwtTokenDto;
