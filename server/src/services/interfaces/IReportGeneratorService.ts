import type { Readable } from "stream";

/** Options for generating a ZIP that contains a CSV for each table. */
export interface GenerateAllZipOptions {
	/** Shared filters applied when building table queries (e.g., { status, roleId, search, from, to }). */
	query?: Record<string, unknown>;

	/** Base filename (".zip" will be appended if missing). Default: export-YYYY-MM-DD.zip */
	filename?: string;

	/** Limit which tables to include; omit to include all supported tables. */
	tables?: string[];

	/** CSV knobs applied to each table (defaults: includeBom=true, delimiter=","). */
	includeBom?: boolean;
	delimiter?: string;
	startTime?: Date;
	endTime?: Date;

	/**
	 * Per-table column exclusions:
	 *  { users: ["email", "profileImageUrl"], trips: ["internalNotes"] }
	 */
	exclude?: Record<string, string[]>;

	/** Optional abort signal to cancel long-running generation. */
	signal?: AbortSignal;
}

/** Streamed artifact metadata returned by the generator. */
export interface GeneratedArtifact {
	/** Readable stream of the ZIP content (controller should pipe this to the HTTP response). */
	stream: Readable;

	/** Final filename (with .zip). */
	filename: string;

	/** MIME type, e.g. "application/zip". */
	contentType: string;

	/** Optional metadata (filled if your implementation tracks it). */
	startedAt?: Date;
	finishedAt?: Date;
	tableCount?: number;
}

interface IReportGenerator {
	generateAllCsvZip(
		options?: GenerateAllZipOptions,
	): Promise<GeneratedArtifact>;
}

export default IReportGenerator;
