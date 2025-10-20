import { Exclude, Expose, Transform } from "class-transformer";
import Container from "typedi";
import BlobUploadService from "../../services/upload.service";

@Exclude()
class DetailedDriverResponseDto {
	@Expose()
	id!: string;

	@Expose()
	name!: string;

	@Expose()
	email?: string | null;

	@Expose()
	phoneNumber!: string;

	@Expose()
	username!: string;

	@Expose()
	@Transform(({ obj }) => {
		const raw = obj.profileImageUrl as string | null;
		if (!raw) return null;

		try {
			const blob = Container.get(BlobUploadService);
			return blob.getBlobUrl(raw);
		} catch {
			return raw;
		}
	})
	profileImageUrl?: string | null;

	@Expose()
	status!: string;

	@Expose()
	availability!: string;

	@Expose()
	ownershipType!: string;

	@Expose()
	@Transform(({ obj }) => obj.role.id)
	roleId!: string;

	@Expose()
	@Transform(({ obj }) => (obj.vehicle ? obj.vehicle.id : null))
	vehicleId?: string | null;

	@Expose()
	@Transform(({ obj }) => (obj.vendor ? obj.vendor.id : null))
	vendorId?: string | null;

	@Expose()
	@Transform(({ obj }) => obj.baseLocation.id)
	baseLocationId!: string;

	@Expose()
	@Transform(({ obj }) => obj.currentLocation.id)
	currentLocationId!: string;
}

export default DetailedDriverResponseDto;
