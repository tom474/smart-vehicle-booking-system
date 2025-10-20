import { Exclude, Expose, Transform } from "class-transformer";
import { CLIENT_URL } from "../../config/env";

@Exclude()
class PublicTripAccessDto {
	@Expose()
	@Transform(
		({ obj }) =>
			`${CLIENT_URL}/public?tripId=${obj.trip.id}&code=${obj.code}`,
	)
	url!: string;
}

export default PublicTripAccessDto;
