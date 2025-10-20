import { Exclude, Expose } from "class-transformer";

@Exclude()
class SelectVehicleDto {
	@Expose()
	vehicleId!: string | null;
}

export default SelectVehicleDto;
