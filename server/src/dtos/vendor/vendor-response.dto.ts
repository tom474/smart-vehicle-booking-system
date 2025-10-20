import { Exclude, Expose, Transform } from "class-transformer";

@Exclude()
class VendorResponseDto {
	@Expose()
	id!: string;

	@Expose()
	name!: string;

	@Expose()
	address!: string;

	@Expose()
	contactPerson!: string;

	@Expose()
	email?: string | null;

	@Expose()
	phoneNumber!: string;

	@Expose()
	status!: string;

	@Expose()
	@Transform(({ obj }) => (obj.drivers ? obj.drivers.length : 0))
	numberOfDrivers!: number;

	@Expose()
	@Transform(({ obj }) => {
		let numberOfVehicles: number = 0;

		if (obj.vehicles) {
			numberOfVehicles += obj.vehicles.length;
		}

		if (obj.outsourcedVehicles) {
			numberOfVehicles += obj.outsourcedVehicles.length;
		}

		return numberOfVehicles;
	})
	numberOfVehicles!: number;
}

export default VendorResponseDto;
