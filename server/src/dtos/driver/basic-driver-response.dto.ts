import { Exclude, Expose, Transform } from "class-transformer";
import Container from "typedi";
import BlobUploadService from "../../services/upload.service";

@Exclude()
class BasicDriverResponseDto {
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
}

export default BasicDriverResponseDto;
