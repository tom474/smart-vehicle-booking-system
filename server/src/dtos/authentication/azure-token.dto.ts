import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

@Exclude()
class AzureTokenDto {
	@Expose()
	@IsNotEmpty({ message: "Access token is required." })
	@IsString({ message: "Access token must be a string." })
	accessToken!: string;
}

export default AzureTokenDto;
