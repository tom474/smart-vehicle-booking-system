import { Exclude, Expose, Transform } from "class-transformer";
import { Container } from "typedi";
import BlobUploadService from "../../services/upload.service";

const isUrl = (str: string): boolean => {
	if (typeof str !== "string" || str.length === 0) return false;

	// Accept http/https/data URLs. You can extend this if needed.
	if (/^(https?:)?\/\//i.test(str) || str.startsWith("data:")) return true;

	try {
		// Robust URL check for absolute URLs
		new URL(str);
		return true;
	} catch {
		return false;
	}
};

@Exclude()
class DetailedUserResponseDto {
	@Expose()
	id!: string;

	@Expose()
	name!: string;

	@Expose()
	email!: string;

	@Expose()
	phoneNumber?: string | null;

	@Expose()
	@Transform(({ obj }) => {
		const raw = obj.profileImageUrl as string | null;
		if (!raw) return null;

		if (isUrl(raw)) return raw;

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
	@Transform(({ obj }) => obj.role.id)
	roleId!: string;

	@Expose()
	@Transform(({ obj }) =>
		obj.dedicatedVehicle ? obj.dedicatedVehicle.id : null,
	)
	dedicatedVehicleId?: string | null;
}

export default DetailedUserResponseDto;
