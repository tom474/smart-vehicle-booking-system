import { Exclude, Expose } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

@Exclude()
class SelectLocationDto {
	@Expose()
	@IsNotEmpty({ message: "Location ID is required." })
	@IsString({ message: "Location ID must be a string." })
	locationId!: string;
}

export default SelectLocationDto;
