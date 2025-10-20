import { Exclude, Expose } from "class-transformer";
import {
	IsArray,
	IsNotEmpty,
	IsOptional,
	IsString,
	Length,
} from "class-validator";

@Exclude()
class UpdateRoleDto {
	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Role title cannot be empty." })
	@IsString({ message: "Role title must be a string." })
	@Length(1, 255, {
		message: "Role title must be between 1 and 255 characters.",
	})
	title?: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Description must be a string." })
	description?: string | null;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Permission IDs cannot be empty." })
	@IsArray({ message: "Permission IDs must be an array." })
	@IsString({ each: true, message: "Each permission ID must be a string." })
	permissionIds?: string[];
}

export default UpdateRoleDto;
