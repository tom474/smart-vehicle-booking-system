import { Exclude, Expose, Transform, Type } from "class-transformer";
import LocationResponseDto from "../location/location-response.dto";
import BasicDriverResponseDto from "../driver/basic-driver-response.dto";

@Exclude()
class DriverCurrentLocationDto {
	@Expose()
	@Type(() => BasicDriverResponseDto)
	driver!: BasicDriverResponseDto;

	@Expose()
	@Type(() => LocationResponseDto)
	@Transform(({ obj }) => obj.driverCurrentLocation ?? null)
	location?: LocationResponseDto | null;
}

export default DriverCurrentLocationDto;
