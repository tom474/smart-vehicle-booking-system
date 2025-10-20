import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString, Length, Matches } from "class-validator";

@Exclude()
class ResetPasswordDto {
	@Expose()
	@IsNotEmpty({ message: "Password is required." })
	@IsString({ message: "Password must be a string." })
	@Length(8, undefined, {
		message: "Password must be at least 8 characters long.",
	})
	@Matches(
		/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
		{
			message:
				"Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@$!%*?&).",
		},
	)
	password!: string;
}

export default ResetPasswordDto;
