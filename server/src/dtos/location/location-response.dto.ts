import { Exclude, Expose } from "class-transformer";
import LocationType from "../../database/enums/LocationType";

@Exclude()
class LocationResponseDto {
	@Expose()
	id!: string;

	@Expose()
	type!: LocationType;

	@Expose()
	name!: string;

	@Expose()
	address!: string;

	@Expose()
	latitude!: number;

	@Expose()
	longitude!: number;
}

export default LocationResponseDto;
