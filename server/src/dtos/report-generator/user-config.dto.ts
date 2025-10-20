import { Exclude, Expose, Transform, Type } from "class-transformer";
import {
	IsArray,
	IsBoolean,
	IsIn,
	IsOptional,
	IsString,
	Length,
	Matches,
} from "class-validator";

@Exclude()
export default class UserConfigDto {
	@Expose()
	@IsOptional()
	@IsString()
	status?: string;

	@Expose()
	@IsOptional()
	@IsString()
	roleId?: string;

	@Expose()
	@IsOptional()
	@IsString()
	@Transform(({ value }) =>
		typeof value === "string" ? value.trim() : value,
	)
	search?: string;

	@Expose()
	@IsOptional()
	@IsString()
	@Matches(/^[a-zA-Z0-9._-]{1,128}$/, {
		message:
			"filename may include letters, numbers, dot, underscore, dash (max 128)",
	})
	filename?: string;

	@Expose()
	@IsOptional()
	@Type(() => Boolean)
	@IsBoolean()
	includeBom?: boolean = true;

	@Expose()
	@IsOptional()
	@IsString()
	@Length(1, 1, { message: "delimiter must be a single character" })
	delimiter?: string = ",";

	@Expose()
	@IsOptional()
	@IsIn(["attachment", "inline"])
	disposition?: "attachment" | "inline" = "attachment";

	@Expose()
	@IsOptional()
	@IsArray()
	@IsIn(
		[
			"id",
			"microsoftId",
			"name",
			"email",
			"phoneNumber",
			"profileImageUrl",
			"status",
			"roleTitle",
		],
		{ each: true, message: "exclude contains an unsupported column" },
	)
	exclude?: string[];
}
