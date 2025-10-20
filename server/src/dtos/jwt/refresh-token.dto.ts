import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

@Exclude()
class RefreshTokenDto {
	@Expose()
	@IsNotEmpty({ message: "Refresh token is required." })
	@IsString({ message: "Refresh token must be a string." })
	token!: string;
}

export default RefreshTokenDto;
