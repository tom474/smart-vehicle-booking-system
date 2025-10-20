// src/services/blob-upload.service.ts
import { Service } from "typedi";
import { ContainerClient, BlockBlobClient } from "@azure/storage-blob";
import type { Express } from "express";
import ApiError from "../templates/api-error";

export type UploadResult = {
	blobName: string;
	urlWithSas: string;
	etag?: string;
	lastModified?: Date;
	contentType?: string;
};

@Service()
class BlobUploadService {
	private container: ContainerClient;

	private readonly maxBytes = 5 * 1024 * 1024; // 5MB
	private readonly allowedMimeTypes = new Set<string>([
		"image/png",
		"image/jpeg",
		"image/webp",
		"application/zip",
		"application/octet-stream",
	]);

	constructor() {
		const containerSasUrl = process.env.BLOB_CONTAINER_SAS_URL;
		if (!containerSasUrl)
			throw new ApiError("BLOB_CONTAINER_SAS_URL is not set.", 500);
		if (!containerSasUrl.includes("sv=")) {
			throw new ApiError(
				"BLOB_CONTAINER_SAS_URL must include a SAS token.",
				500,
			);
		}
		this.container = new ContainerClient(containerSasUrl);
	}

	private sanitizeKey(key: string): string {
		if (typeof key !== "string" || key.length === 0)
			throw new ApiError("Blob key is required.", 400);

		if (key.length > 1024) throw new ApiError("Blob key too long.", 400);

		// Avoid breaking the URL/querystring
		if (/[?#]/.test(key))
			throw new ApiError("Blob key cannot contain ? or #.", 400);

		// Keep nested paths if you use them, just drop a leading slash
		return key.replace(/^\/+/, "");
	}

	private block(key: string): BlockBlobClient {
		return this.container.getBlockBlobClient(this.sanitizeKey(key));
	}

	async uploadLargeFile(
		key: string,
		buffer: Buffer,
		contentType: string = "application/octet-stream",
		overwrite: boolean = true,
	): Promise<UploadResult> {
		if (!buffer?.length) throw new ApiError("Empty buffer.", 400);

		const maxLargeFileBytes = 100 * 1024 * 1024;
		if (buffer.length > maxLargeFileBytes) {
			throw new ApiError("File too large. Max 100MB for reports.", 413);
		}

		const client = this.block(key);

		if (!overwrite && (await client.exists())) {
			throw new ApiError(`Blob already exists: ${key}`, 409);
		}

		const resp = await client.uploadData(buffer, {
			blobHTTPHeaders: { blobContentType: contentType },
		});

		return {
			blobName: this.sanitizeKey(key),
			urlWithSas: client.url,
			etag: resp.etag,
			lastModified: resp.lastModified,
			contentType,
		};
	}

	async uploadBufferWithKey(
		key: string,
		buffer: Buffer,
		contentType?: string,
		overwrite: boolean = true,
	): Promise<UploadResult> {
		if (!buffer?.length) throw new ApiError("Empty buffer.", 400);
		const client = this.block(key);

		if (!overwrite && (await client.exists())) {
			throw new ApiError(`Blob already exists: ${key}`, 409);
		}

		const resp = await client.uploadData(buffer, {
			blobHTTPHeaders: contentType
				? { blobContentType: contentType }
				: undefined,
		});

		return {
			blobName: this.sanitizeKey(key),
			urlWithSas: client.url,
			etag: resp.etag,
			lastModified: resp.lastModified,
			contentType,
		};
	}

	async exists(key: string): Promise<boolean> {
		return this.block(key).exists();
	}

	async delete(key: string): Promise<void> {
		const client = this.block(key);
		if (!(await client.exists()))
			throw new ApiError(`Blob not found: ${key}`, 404);
		await client.delete();
	}

	getBlobUrl(key: string): string {
		return this.block(key).url; // includes SAS from container URL
	}

	public async upload(
		key: string,
		file: Express.Multer.File,
		opts: { overwrite?: boolean } = { overwrite: true },
	) {
		if (
			this.allowedMimeTypes.size &&
			!this.allowedMimeTypes.has(file.mimetype)
		) {
			throw new ApiError(`Unsupported file type: ${file.mimetype}`, 400);
		}

		if (this.maxBytes && file.size > this.maxBytes) {
			throw new ApiError(
				`File too large. Max ${this.maxBytes} bytes.`,
				413,
			);
		}

		const res = await this.uploadBufferWithKey(
			key,
			file.buffer,
			file.mimetype || "application/octet-stream",
			opts.overwrite ?? true,
		);

		return res.blobName;
	}
}

export default BlobUploadService;
