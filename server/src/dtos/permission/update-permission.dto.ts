import { Exclude, Expose } from "class-transformer";
import {
	IsArray,
	IsNotEmpty,
	IsOptional,
	IsString,
	Length,
} from "class-validator";

@Exclude()
class UpdatePermissionDto {
	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Title cannot be empty." })
	@IsString({ message: "Title must be a string." })
	@Length(1, 255, { message: "Title must be between 1 and 255 characters." })
	title?: string;

	@Expose()
	@IsOptional()
	@IsString({ message: "Description must be a string." })
	description?: string | null;

	@Expose()
	@IsOptional()
	@IsNotEmpty({ message: "Role IDs cannot be empty." })
	@IsArray({ message: "Role IDs must be an array." })
	@IsString({ each: true, message: "Each role ID must be a string." })
	roleIds?: string[];
}

export default UpdatePermissionDto;
