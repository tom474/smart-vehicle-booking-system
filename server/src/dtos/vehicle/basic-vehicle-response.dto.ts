import { Exclude, Expose } from "class-transformer";
import Color from "../../database/enums/Color";

@Exclude()
class BasicVehicleResponseDto {
	@Expose()
	id!: string;

	@Expose()
	licensePlate!: string;

	@Expose()
	model?: string | null;

	@Expose()
	color!: Color;

	@Expose()
	capacity!: number;

	@Expose()
	availability!: string;

	@Expose()
	ownershipType!: string;
}

export default BasicVehicleResponseDto;
