import { Exclude, Expose, Transform } from "class-transformer";
import Color from "../../database/enums/Color";

@Exclude()
class DetailedVehicleResponseDto {
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

	@Expose()
	@Transform(({ obj }) => (obj.driver ? obj.driver.id : null))
	driverId?: string | null;

	@Expose()
	@Transform(({ obj }) => (obj.vendor ? obj.vendor.id : null))
	vendorId?: string | null;

	@Expose()
	@Transform(({ obj }) => (obj.executive ? obj.executive.id : null))
	executiveId?: string | null;

	@Expose()
	@Transform(({ obj }) => obj.baseLocation.id)
	baseLocationId!: string;

	@Expose()
	@Transform(({ obj }) => obj.currentLocation.id)
	currentLocationId!: string;
}

export default DetailedVehicleResponseDto;
