import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

@Exclude()
class DriverLoginDto {
	@Expose()
	@IsNotEmpty({ message: "Username is required." })
	@IsString({ message: "Username must be a string." })
	username!: string;

	@Expose()
	@IsNotEmpty({ message: "Password is required." })
	@IsString({ message: "Password must be a string." })
	password!: string;
}

export default DriverLoginDto;
