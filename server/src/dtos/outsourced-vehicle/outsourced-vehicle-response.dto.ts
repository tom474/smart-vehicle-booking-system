import { Exclude, Expose, Transform } from "class-transformer";
import Color from "../../database/enums/Color";

@Exclude()
class OutsourcedVehicleResponseDto {
	@Expose()
	id!: string;

	@Expose()
	driverName!: string;

	@Expose()
	phoneNumber!: string;

	@Expose()
	licensePlate!: string;

	@Expose()
	model?: string | null;

	@Expose()
	color!: Color;

	@Expose()
	capacity!: number;

	@Expose()
	@Transform(({ obj }) => (obj.vendor ? obj.vendor.id : null))
	vendorId?: string | null;
}

export default OutsourcedVehicleResponseDto;
