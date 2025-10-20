import { Exclude, Expose } from "class-transformer";
import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsArray,
	Length,
} from "class-validator";

@Exclude()
class CreateRoleDto {
	@Expose()
	@IsNotEmpty({ message: "Title is required." })
	@IsString({ message: "Title must be a string." })
	@Length(1, 255, { message: "Title must be between 1 and 255 characters." })
	title!: string;

	@Expose()
	@IsNotEmpty({ message: "Key is required." })
	@IsString({ message: "Key must be a string." })
	@Length(1, 255, { message: "Key must be between 1 and 255 characters." })
	key!: string;

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

export default CreateRoleDto;
