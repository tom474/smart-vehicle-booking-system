import { Exclude, Expose } from "class-transformer";
import JwtTokenDto from "../jwt/jwt-token.dto";
import DetailedUserResponseDto from "../user/detailed-user-response.dto";

@Exclude()
class UserLoginResponseDto {
	@Expose()
	user!: DetailedUserResponseDto;

	@Expose()
	token!: JwtTokenDto;
}

export default UserLoginResponseDto;
