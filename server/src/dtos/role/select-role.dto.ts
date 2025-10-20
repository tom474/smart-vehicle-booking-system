import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

@Exclude()
class SelectRoleDto {
	@Expose()
	@IsNotEmpty({ message: "Role ID is required." })
	@IsString({ message: "Role ID must be a string." })
	roleId!: string;
}

export default SelectRoleDto;
