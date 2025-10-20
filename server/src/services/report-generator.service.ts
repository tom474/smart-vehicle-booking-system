// src/services/report-generator.service.ts
import archiver from "archiver";
import { Service } from "typedi";
import { pipeline } from "stream/promises";
import { format as csvFormat } from "@fast-csv/format";
import { PassThrough } from "stream";
import type { SelectQueryBuilder, ObjectLiteral } from "typeorm";

import AppDataSource from "../config/database";
import User from "../database/entities/User";
import Driver from "../database/entities/Driver";
import Vehicle from "../database/entities/Vehicle";
import Trip from "../database/entities/Trip";
import TripTicket from "../database/entities/TripTicket";
import TripStop from "../database/entities/TripStop";
import Location from "../database/entities/Location";

import IReportGeneratorService, {
	GenerateAllZipOptions,
	GeneratedArtifact,
} from "./interfaces/IReportGeneratorService";
import Vendor from "../database/entities/Vendor";
import BookingRequest from "../database/entities/BookingRequest";
import TripFeedback from "../database/entities/TripFeedback";
import LocationType from "../database/enums/LocationType";
import Permission from "../database/entities/Permission";
import Role from "../database/entities/Role";
import OutsourcedVehicle from "../database/entities/OutsourcedVehicle";
import LeaveRequest from "../database/entities/LeaveRequest";
import Expense from "../database/entities/Expense";
import VehicleService from "../database/entities/VehicleService";
import Setting from "../database/entities/Setting";
import ExecutiveVehicleActivity from "../database/entities/ExecutiveVehicleActivity";
import ActivityLog from "../database/entities/ActivityLog";
import BlobUploadService from "./upload.service";

// --- helpers ---
const sanitize = (v: unknown) =>
	typeof v === "string" && /^[=+\-@]/.test(v) ? "'" + v : v;

const fmtDateTime = (v: unknown): string => {
	if (!v) return "";
	const d = new Date(v as any);
	if (Number.isNaN(d.getTime())) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(
		d.getHours(),
	)}:${pad(d.getMinutes())}`;
};

type TableBuilder = {
	name: string;
	build: () => Promise<{
		dbStream: NodeJS.ReadableStream;
		headers: string[];
		transform: (row: any) => Record<string, unknown>;
	}>;
};

@Service()
class ReportGenerator implements IReportGeneratorService {
	constructor(private readonly blobUploadService: BlobUploadService) {}

	private applyTimeRangeFilter<T extends ObjectLiteral>(
		qb: SelectQueryBuilder<T>,
		alias: string,
		column: string,
		startTime?: Date,
		endTime?: Date,
	): void {
		if (startTime) {
			qb.andWhere(`${alias}.${column} >= :startTime`, { startTime });
		}

		if (endTime) {
			qb.andWhere(`${alias}.${column} <= :endTime`, { endTime });
		}
	}

	public async generateAllCsvZip(
		options?: GenerateAllZipOptions,
	): Promise<GeneratedArtifact> {
		const {
			query = {},
			filename,
			tables,
			includeBom = true,
			delimiter = ",",
			startTime,
			endTime,
			// default excludes: hide sensitive/verbose columns
			exclude = {
				users: ["profileImageUrl"],
				drivers: ["hashedPassword"],
				vehicles: ["currentLocation"],
				tripsDriver: [],
				tripsOutsourced: [],
				vendors: [],
			} as Record<string, string[]>,
			signal,
		} = options ?? {};

		const base = `smart-booking-vehicle-export`;
		const finalFilename = `${filename ? filename : base}.zip`;
		const contentType = "application/zip";

		const out = new PassThrough();

		// ZIP → out
		const archive = archiver("zip", { zlib: { level: 9 } });
		archive.on("warning", (err: any) => {
			if (err?.code !== "ENOENT") out.destroy(err);
		});
		archive.on("error", (err) => out.destroy(err));
		archive.pipe(out);

		// Abort support
		const abort = () => {
			try {
				archive.abort();
			} catch {}
			try {
				out.end();
			} catch {}
		};
		out.on("close", abort);
		if (signal) {
			if (signal.aborted) abort();
			else {
				const onAbort = () => abort();
				signal.addEventListener("abort", onAbort, { once: true });
				out.once("close", () =>
					signal.removeEventListener?.("abort", onAbort),
				);
			}
		}

		const sharedQuery = query as Record<string, unknown>;
		const builders: TableBuilder[] = [];

		// USERS (aliased)
		builders.push(
			this.makeTableBuilder(
				{
					name: "users",
					qb: () =>
						AppDataSource.getRepository(User)
							.createQueryBuilder("u")
							.leftJoin("u.role", "r")
							.select([])
							.addSelect("u.id", "id")
							.addSelect("u.microsoftId", "microsoftId")
							.addSelect("u.name", "name")
							.addSelect("u.email", "email")
							.addSelect("u.phoneNumber", "phoneNumber")
							.addSelect("u.profileImageUrl", "profileImageUrl")
							.addSelect("u.status", "status")
							.addSelect("r.title", "roleTitle")
							.orderBy("u.name", "ASC"),
					headers: [
						"id",
						"microsoftId",
						"name",
						"email",
						"phoneNumber",
						"profileImageUrl",
						"status",
						"roleTitle",
					],
					excludeForTable: exclude.users,
					shape: (row) => ({
						id: row.id,
						microsoftId: row.microsoftId,
						name: row.name,
						email: row.email,
						phoneNumber: row.phoneNumber,
						profileImageUrl: row.profileImageUrl,
						status: row.status,
						roleTitle: row.roleTitle,
					}),
					applyFilters: (_qb, _q) => {},
				},
				sharedQuery,
			),
		);

		// DRIVERS (aliased) — baseLocation name only; NO currentLocation
		builders.push(
			this.makeTableBuilder(
				{
					name: "drivers",
					qb: () =>
						AppDataSource.getRepository(Driver)
							.createQueryBuilder("d")
							.leftJoin("d.role", "r")
							.leftJoin("d.baseLocation", "bl")
							.select([])
							.addSelect("d.id", "id")
							.addSelect("d.name", "name")
							.addSelect("d.email", "email")
							.addSelect("d.phoneNumber", "phoneNumber")
							.addSelect("d.username", "username")
							.addSelect("d.hashedPassword", "hashedPassword")
							.addSelect("d.profileImageUrl", "profileImageUrl")
							.addSelect("d.status", "status")
							.addSelect("d.availability", "availability")
							.addSelect("d.ownershipType", "ownershipType")
							.addSelect("r.title", "roleTitle")
							.addSelect("bl.name", "baseLocation")
							.orderBy("d.name", "ASC"),
					headers: [
						"id",
						"name",
						"email",
						"phoneNumber",
						"username",
						"hashedPassword", // excluded by default via exclude.drivers
						"profileImageUrl",
						"status",
						"availability",
						"ownershipType",
						"roleTitle",
						"baseLocation",
					],
					excludeForTable: exclude.drivers,
					shape: (row) => ({
						id: row.id,
						name: row.name,
						email: row.email,
						phoneNumber: row.phoneNumber,
						username: row.username,
						hashedPassword: row.hashedPassword,
						profileImageUrl: row.profileImageUrl,
						status: row.status,
						availability: row.availability,
						ownershipType: row.ownershipType,
						roleTitle: row.roleTitle,
						baseLocation: row.baseLocation,
					}),
					applyFilters: (_qb, _q) => {},
				},
				sharedQuery,
			),
		);

		// VEHICLES (aliased) — driverName, vendorName, location names
		builders.push(
			this.makeTableBuilder(
				{
					name: "vehicles",
					qb: () =>
						AppDataSource.getRepository(Vehicle)
							.createQueryBuilder("v")
							.leftJoin("v.driver", "d")
							.leftJoin("v.vendor", "vn")
							.leftJoin("v.baseLocation", "bl")
							.leftJoin("v.currentLocation", "cl")
							.select([])
							.addSelect("v.id", "id")
							.addSelect("v.licensePlate", "licensePlate")
							.addSelect("v.model", "model")
							.addSelect("v.color", "color")
							.addSelect("v.capacity", "capacity")
							.addSelect("v.availability", "availability")
							.addSelect("v.ownershipType", "ownershipType")
							.addSelect("d.name", "driverName")
							.addSelect("vn.name", "vendorName")
							.addSelect("bl.name", "baseLocation")
							.addSelect("cl.name", "currentLocation")
							.orderBy("v.licensePlate", "ASC"),
					headers: [
						"id",
						"licensePlate",
						"model",
						"color",
						"capacity",
						"availability",
						"ownershipType",
						"driverName",
						"vendorName",
						"baseLocation",
						"currentLocation",
					],
					excludeForTable: exclude.vehicles,
					shape: (row) => ({
						id: row.id,
						licensePlate: row.licensePlate,
						model: row.model,
						color: row.color,
						capacity: row.capacity,
						availability: row.availability,
						ownershipType: row.ownershipType,
						driverName: row.driverName,
						vendorName: row.vendorName,
						baseLocation: row.baseLocation,
						currentLocation: row.currentLocation,
					}),
					applyFilters: (_qb, _q) => {},
				},
				sharedQuery,
			),
		);

		// TRIPS — DRIVER CSV (not outsourced): driver + vehicle license plate
		builders.push(
			this.makeTableBuilder(
				{
					name: "trips_driver",
					qb: () =>
						AppDataSource.getRepository(Trip)
							.createQueryBuilder("t")
							.leftJoin("t.driver", "td")
							.leftJoin("t.vehicle", "tv")
							.select([])
							.addSelect("t.id", "id")
							.addSelect("t.status", "status")
							.addSelect("t.totalCost", "totalCost")
							.addSelect("t.departureTime", "departureTime")
							.addSelect("t.arrivalTime", "arrivalTime")
							.addSelect(
								"t.actualDepartureTime",
								"actualDepartureTime",
							)
							.addSelect(
								"t.actualArrivalTime",
								"actualArrivalTime",
							)
							.addSelect("t.createdAt", "createdAt")
							.addSelect("td.name", "driverName")
							.addSelect("tv.licensePlate", "vehicle") // license plate
							.addSelect(
								(sub) =>
									sub
										.select("COUNT(tt.id)", "tickets")
										.from(TripTicket, "tt")
										.where("tt.trip_id = t.id"),
								"tickets",
							)
							.addSelect(
								(sub) =>
									sub
										.select("COUNT(ts.id)", "stops")
										.from(TripStop, "ts")
										.where("ts.trip_id = t.id"),
								"stops",
							)
							.where("t.outsourced_vehicle_id IS NULL")
							.andWhere("t.driver_id IS NOT NULL")
							.andWhere("t.vehicle_id IS NOT NULL")
							.orderBy("t.departureTime", "DESC"),
					headers: [
						"id",
						"status",
						"totalCost",
						"departureTime",
						"arrivalTime",
						"actualDepartureTime",
						"actualArrivalTime",
						"driverName",
						"vehicle", // license plate
						"tickets",
						"stops",
						"createdAt",
					],
					excludeForTable: exclude.tripsDriver ?? [],
					shape: (row) => ({
						id: row.id,
						status: row.status,
						totalCost: row.totalCost,
						departureTime: fmtDateTime(row.departureTime),
						arrivalTime: fmtDateTime(row.arrivalTime),
						actualDepartureTime: fmtDateTime(
							row.actualDepartureTime,
						),
						actualArrivalTime: fmtDateTime(row.actualArrivalTime),
						driverName: row.driverName || "",
						vehicle: row.vehicle || "",
						tickets: Number(row.tickets ?? 0),
						stops: Number(row.stops ?? 0),
						createdAt: fmtDateTime(row.createdAt),
					}),
					applyFilters: (qb, _q) => {
						this.applyTimeRangeFilter(
							qb,
							"t",
							"departureTime",
							startTime,
							endTime,
						);
					},
				},
				sharedQuery,
			),
		);

		// TRIPS — OUTSOURCED CSV: outsourced driver + outsourced vehicle license plate
		builders.push(
			this.makeTableBuilder(
				{
					name: "trips_outsourced",
					qb: () =>
						AppDataSource.getRepository(Trip)
							.createQueryBuilder("t")
							.leftJoin("t.outsourcedVehicle", "ov")
							.select([])
							.addSelect("t.id", "id")
							.addSelect("t.status", "status")
							.addSelect("t.totalCost", "totalCost")
							.addSelect("t.departureTime", "departureTime")
							.addSelect("t.arrivalTime", "arrivalTime")
							.addSelect(
								"t.actualDepartureTime",
								"actualDepartureTime",
							)
							.addSelect(
								"t.actualArrivalTime",
								"actualArrivalTime",
							)
							.addSelect("t.createdAt", "createdAt")
							.addSelect("ov.driverName", "outsourcedDriverName")
							.addSelect("ov.licensePlate", "outsourcedVehicle")
							.addSelect(
								(sub) =>
									sub
										.select("COUNT(tt.id)", "tickets")
										.from(TripTicket, "tt")
										.where("tt.trip_id = t.id"),
								"tickets",
							)
							.addSelect(
								(sub) =>
									sub
										.select("COUNT(ts.id)", "stops")
										.from(TripStop, "ts")
										.where("ts.trip_id = t.id"),
								"stops",
							)
							.where("t.outsourced_vehicle_id IS NOT NULL")
							.orderBy("t.departureTime", "DESC"),
					headers: [
						"id",
						"status",
						"totalCost",
						"departureTime",
						"arrivalTime",
						"actualDepartureTime",
						"actualArrivalTime",
						"outsourcedDriverName",
						"outsourcedVehicle",
						"tickets",
						"stops",
						"createdAt",
					],
					excludeForTable: exclude.tripsOutsourced ?? [],
					shape: (row) => ({
						id: row.id,
						status: row.status,
						totalCost: row.totalCost,
						departureTime: fmtDateTime(row.departureTime),
						arrivalTime: fmtDateTime(row.arrivalTime),
						actualDepartureTime: fmtDateTime(
							row.actualDepartureTime,
						),
						actualArrivalTime: fmtDateTime(row.actualArrivalTime),
						outsourcedDriverName: row.outsourcedDriverName || "",
						outsourcedVehicle: row.outsourcedVehicle || "",
						tickets: Number(row.tickets ?? 0),
						stops: Number(row.stops ?? 0),
						createdAt: fmtDateTime(row.createdAt),
					}),
					applyFilters: (qb, _q) => {
						this.applyTimeRangeFilter(
							qb,
							"t",
							"departureTime",
							startTime,
							endTime,
						);
					},
				},
				sharedQuery,
			),
		);

		// VENDORS — show counts: driver (number of drivers) and vehicle (number of vehicles)
		builders.push(
			this.makeTableBuilder(
				{
					name: "vendors",
					qb: () =>
						AppDataSource.getRepository(Vendor)
							.createQueryBuilder("v")
							.select([])
							.addSelect("v.id", "id")
							.addSelect("v.name", "name")
							.addSelect("v.address", "address")
							.addSelect("v.contactPerson", "contactPerson")
							.addSelect("v.email", "email")
							.addSelect("v.phoneNumber", "phoneNumber")
							.addSelect("v.status", "status")
							// counts with singular labels as requested
							.addSelect(
								(sub) =>
									sub
										.select("COUNT(d.id)", "driver")
										.from(Driver, "d")
										.where("d.vendor_id = v.id"),
								"driver",
							)
							.addSelect(
								(sub) =>
									sub
										.select("COUNT(veh.id)", "vehicle")
										.from(Vehicle, "veh")
										.where("veh.vendor_id = v.id"),
								"vehicle",
							)
							.orderBy("v.name", "ASC"),
					headers: [
						"id",
						"name",
						"address",
						"contactPerson",
						"email",
						"phoneNumber",
						"status",
						"driver", // 👈 singular per your spec
						"vehicle", // 👈 singular per your spec
					],
					excludeForTable: exclude.vendors ?? [],
					shape: (row) => ({
						id: row.id,
						name: row.name,
						address: row.address,
						contactPerson: row.contactPerson,
						email: row.email,
						phoneNumber: row.phoneNumber,
						status: row.status,
						driver: Number(row.driver ?? 0),
						vehicle: Number(row.vehicle ?? 0),
					}),
					applyFilters: (_qb, _q) => {},
				},
				sharedQuery,
			),
		);

		// BOOKING REQUESTS — requester name, location names, formatted times, passenger count
		builders.push(
			this.makeTableBuilder(
				{
					name: "booking_requests",
					qb: () =>
						AppDataSource.getRepository(BookingRequest)
							.createQueryBuilder("br")
							.leftJoin("br.requester", "req")
							.leftJoin("br.departureLocation", "dl")
							.leftJoin("br.arrivalLocation", "al")
							.select([])
							.addSelect("br.id", "id")
							.addSelect("br.priority", "priority")
							.addSelect("br.type", "type")
							.addSelect("br.status", "status")
							.addSelect(
								"br.numberOfPassengers",
								"numberOfPassengers",
							)
							.addSelect("req.name", "requesterName")
							.addSelect("br.contactName", "contactName")
							.addSelect(
								"br.contactPhoneNumber",
								"contactPhoneNumber",
							)
							.addSelect("br.departureTime", "departureTime")
							.addSelect("br.arrivalTime", "arrivalTime")
							.addSelect("dl.name", "departureLocation")
							.addSelect("al.name", "arrivalLocation")
							.addSelect("br.tripPurpose", "tripPurpose")
							.addSelect("br.note", "note")
							.addSelect("br.cancelReason", "cancelReason")
							.addSelect("br.createdAt", "createdAt")
							// actual passenger count from join table
							.addSelect(
								(sub) =>
									sub
										.select(
											"COUNT(bp.passenger_id)",
											"passengers",
										)
										.from(
											"booking_requests_passengers",
											"bp",
										)
										.where("bp.booking_request_id = br.id"),
								"passengers",
							)
							.orderBy("br.createdAt", "DESC"),
					headers: [
						"id",
						"priority",
						"type",
						"status",
						"numberOfPassengers",
						"passengers", // actual count from the join table
						"requesterName",
						"contactName",
						"contactPhoneNumber",
						"departureTime",
						"arrivalTime",
						"departureLocation",
						"arrivalLocation",
						"tripPurpose",
						"note",
						"cancelReason",
						"createdAt",
					],
					excludeForTable: exclude.bookingRequests ?? [],
					shape: (row) => ({
						id: row.id,
						priority: row.priority,
						type: row.type,
						status: row.status,
						numberOfPassengers: row.numberOfPassengers,
						passengers: Number(row.passengers ?? 0),
						requesterName: row.requesterName || "",
						contactName: row.contactName || "",
						contactPhoneNumber: row.contactPhoneNumber || "",
						departureTime: fmtDateTime(row.departureTime),
						arrivalTime: fmtDateTime(row.arrivalTime),
						departureLocation: row.departureLocation || "",
						arrivalLocation: row.arrivalLocation || "",
						tripPurpose: row.tripPurpose ?? "",
						note: row.note ?? "",
						cancelReason: row.cancelReason ?? "",
						createdAt: fmtDateTime(row.createdAt),
					}),
					applyFilters: (qb, _q) => {
						this.applyTimeRangeFilter(
							qb,
							"br",
							"createdAt",
							startTime,
							endTime,
						);
					},
				},
				sharedQuery,
			),
		);

		// ROLES — with counts: users, drivers, permissions
		builders.push(
			this.makeTableBuilder(
				{
					name: "roles",
					qb: () =>
						AppDataSource.getRepository(Role)
							.createQueryBuilder("r")
							.select([])
							.addSelect("r.id", "id")
							.addSelect("r.title", "title")
							.addSelect("r.key", "key")
							.addSelect("r.description", "description")
							// count users assigned to this role
							.addSelect(
								(sub) =>
									sub
										.select("COUNT(u.id)", "users")
										.from(User, "u")
										.where("u.role_id = r.id"),
								"users",
							)
							// count drivers assigned to this role
							.addSelect(
								(sub) =>
									sub
										.select("COUNT(d.id)", "drivers")
										.from(Driver, "d")
										.where("d.role_id = r.id"),
								"drivers",
							)
							// count permissions attached to this role (via join table)
							.addSelect(
								(sub) =>
									sub
										.select(
											"COUNT(rp.permission_id)",
											"permissions",
										)
										.from("roles_permissions", "rp")
										.where("rp.role_id = r.id"),
								"permissions",
							)
							.orderBy("r.title", "ASC"),
					headers: [
						"id",
						"title",
						"key",
						"description",
						"permissions",
					],
					excludeForTable: exclude.roles ?? [],
					shape: (row) => ({
						id: row.id,
						title: row.title,
						key: row.key,
						description: row.description ?? "",
						permissions: Number(row.permissions ?? 0),
					}),
					applyFilters: (_qb, _q) => {},
				},
				sharedQuery,
			),
		);

		// PERMISSIONS — with count of roles using each permission
		builders.push(
			this.makeTableBuilder(
				{
					name: "permissions",
					qb: () =>
						AppDataSource.getRepository(Permission)
							.createQueryBuilder("p")
							.select([])
							.addSelect("p.id", "id")
							.addSelect("p.title", "title")
							.addSelect("p.key", "key")
							.addSelect("p.description", "description")
							// count roles that have this permission
							.addSelect(
								(sub) =>
									sub
										.select("COUNT(rp.role_id)", "roles")
										.from("roles_permissions", "rp")
										.where("rp.permission_id = p.id"),
								"roles",
							)
							.orderBy("p.title", "ASC"),
					headers: ["id", "title", "key", "description"],
					excludeForTable: exclude.permissions ?? [],
					shape: (row) => ({
						id: row.id,
						title: row.title,
						key: row.key,
						description: row.description ?? "",
					}),
					applyFilters: (_qb, _q) => {},
				},
				sharedQuery,
			),
		);

		// OUTSOURCED VEHICLES — basic vehicle data
		builders.push(
			this.makeTableBuilder(
				{
					name: "outsourced_vehicles",
					qb: () =>
						AppDataSource.getRepository(OutsourcedVehicle)
							.createQueryBuilder("ov")
							.select([])
							.addSelect("ov.id", "id")
							.addSelect("ov.driverName", "driverName")
							.addSelect("ov.phoneNumber", "phoneNumber")
							.addSelect("ov.licensePlate", "licensePlate")
							.addSelect("ov.model", "model")
							.addSelect("ov.color", "color")
							.addSelect("ov.capacity", "capacity")
							.orderBy("ov.driverName", "ASC"),
					headers: [
						"id",
						"driverName",
						"phoneNumber",
						"licensePlate",
						"model",
						"color",
						"capacity",
					],
					excludeForTable: exclude.outsourcedVehicles ?? [],
					shape: (row) => ({
						id: row.id,
						driverName: row.driverName,
						phoneNumber: row.phoneNumber,
						licensePlate: row.licensePlate,
						model: row.model,
						color: row.color,
						capacity: row.capacity,
					}),
					applyFilters: (_qb, _q) => {},
				},
				sharedQuery,
			),
		);

		// LOCATIONS — only fixed ones
		builders.push(
			this.makeTableBuilder(
				{
					name: "locations_fixed",
					qb: () =>
						AppDataSource.getRepository(Location)
							.createQueryBuilder("loc")
							.select([])
							.addSelect("loc.id", "id")
							.addSelect("loc.type", "type")
							.addSelect("loc.name", "name")
							.addSelect("loc.address", "address")
							.addSelect("loc.latitude", "latitude")
							.addSelect("loc.longitude", "longitude")
							// include only fixed locations
							.where("loc.type = :fixedType", {
								fixedType: LocationType.FIXED,
							})
							.orderBy("loc.name", "ASC"),
					headers: [
						"id",
						"type",
						"name",
						"address",
						"latitude",
						"longitude",
					],
					excludeForTable: exclude.locationsFixed ?? [],
					shape: (row) => ({
						id: row.id,
						type: row.type, // will be "FIXED" (or enum value) in CSV
						name: row.name,
						address: row.address,
						latitude: row.latitude,
						longitude: row.longitude,
					}),
					applyFilters: (_qb, _q) => {},
				},
				sharedQuery,
			),
		);

		// TRIP FEEDBACKS — trip id + user name
		builders.push(
			this.makeTableBuilder(
				{
					name: "trip_feedbacks",
					qb: () =>
						AppDataSource.getRepository(TripFeedback)
							.createQueryBuilder("tf")
							.leftJoin("tf.user", "u")
							.leftJoin("tf.trip", "t")
							.select([])
							.addSelect("tf.id", "id")
							.addSelect("t.id", "tripId")
							.addSelect("u.name", "userName")
							.addSelect("tf.rating", "rating")
							.addSelect("tf.comment", "comment")
							.addSelect("tf.createdAt", "createdAt")
							.orderBy("tf.createdAt", "DESC"),
					headers: [
						"id",
						"tripId",
						"userName",
						"rating",
						"comment",
						"createdAt",
					],
					excludeForTable: exclude.tripFeedbacks ?? [],
					shape: (row) => ({
						id: row.id,
						tripId: row.tripId,
						userName: row.userName || "",
						rating: row.rating,
						comment: row.comment ?? "",
						createdAt: fmtDateTime(row.createdAt),
					}),
					applyFilters: (_qb, _q) => {},
				},
				sharedQuery,
			),
		);

		// TRIP TICKETS — booking request id + user name (+ times/locations/status)
		builders.push(
			this.makeTableBuilder(
				{
					name: "trip_tickets",
					qb: () =>
						AppDataSource.getRepository(TripTicket)
							.createQueryBuilder("tt")
							.leftJoin("tt.user", "u")
							.leftJoin("tt.trip", "t")
							.leftJoin("tt.bookingRequest", "br")
							.leftJoin("tt.departureLocation", "dl")
							.leftJoin("tt.arrivalLocation", "al")
							.select([])
							.addSelect("tt.id", "id")
							.addSelect("br.id", "bookingRequestId")
							.addSelect("t.id", "tripId")
							.addSelect("u.name", "userName")
							.addSelect("tt.departureTime", "departureTime")
							.addSelect("tt.arrivalTime", "arrivalTime")
							.addSelect("dl.name", "departureLocation")
							.addSelect("al.name", "arrivalLocation")
							.addSelect("tt.ticketStatus", "ticketStatus")
							.addSelect("tt.noShowReason", "noShowReason")
							.orderBy("tt.departureTime", "DESC"),
					headers: [
						"id",
						"bookingRequestId",
						"tripId",
						"user",
						"departureTime",
						"arrivalTime",
						"departureLocation",
						"arrivalLocation",
						"ticketStatus",
						"noShowReason",
					],
					excludeForTable: exclude.tripTickets ?? [],
					shape: (row) => ({
						id: row.id,
						bookingRequestId: row.bookingRequestId,
						tripId: row.tripId,
						user: row.userName || "",
						departureTime: fmtDateTime(row.departureTime),
						arrivalTime: fmtDateTime(row.arrivalTime),
						departureLocation: row.departureLocation || "",
						arrivalLocation: row.arrivalLocation || "",
						ticketStatus: row.ticketStatus,
						noShowReason: row.noShowReason ?? "",
					}),
					applyFilters: (qb, _q) => {
						this.applyTimeRangeFilter(
							qb,
							"tt",
							"departureTime",
							startTime,
							endTime,
						);
					},
				},
				sharedQuery,
			),
		);

		// LEAVE REQUESTS — driver name + formatted times
		builders.push(
			this.makeTableBuilder(
				{
					name: "leave_requests",
					qb: () =>
						AppDataSource.getRepository(LeaveRequest)
							.createQueryBuilder("lr")
							.leftJoin("lr.driver", "d")
							.select([])
							.addSelect("lr.id", "id")
							.addSelect("d.name", "driverName")
							.addSelect("lr.reason", "reason")
							.addSelect("lr.notes", "notes")
							.addSelect("lr.startTime", "startTime")
							.addSelect("lr.endTime", "endTime")
							.addSelect("lr.status", "status")
							.addSelect("lr.createdAt", "createdAt")
							.orderBy("lr.startTime", "DESC"),
					headers: [
						"id",
						"driverName",
						"reason",
						"notes",
						"startTime",
						"endTime",
						"status",
						"createdAt",
					],
					excludeForTable: exclude.leaveRequests ?? [],
					shape: (row) => ({
						id: row.id,
						driverName: row.driverName || "",
						reason: row.reason ?? "",
						notes: row.notes ?? "",
						startTime: fmtDateTime(row.startTime),
						endTime: fmtDateTime(row.endTime),
						status: row.status,
						createdAt: fmtDateTime(row.createdAt),
					}),
					applyFilters: (qb, _q) => {
						this.applyTimeRangeFilter(
							qb,
							"lr",
							"createdAt",
							startTime,
							endTime,
						);
					},
				},
				sharedQuery,
			),
		);

		// VEHICLE SERVICES — driver name + vehicle plate + expenses count + formatted times
		builders.push(
			this.makeTableBuilder(
				{
					name: "vehicle_services",
					qb: () =>
						AppDataSource.getRepository(VehicleService)
							.createQueryBuilder("vs")
							.leftJoin("vs.driver", "d")
							.leftJoin("vs.vehicle", "v")
							.select([])
							.addSelect("vs.id", "id")
							.addSelect("d.name", "driverName")
							.addSelect("v.licensePlate", "vehicle")
							.addSelect("vs.serviceType", "serviceType")
							.addSelect("vs.reason", "reason")
							.addSelect("vs.description", "description")
							.addSelect("vs.startTime", "startTime")
							.addSelect("vs.endTime", "endTime")
							.addSelect("vs.status", "status")
							.addSelect("vs.createdAt", "createdAt")
							// count expenses tied to this service
							.addSelect(
								(sub) =>
									sub
										.select("COUNT(e.id)", "expenses")
										.from(Expense, "e")
										.where("e.vehicle_service_id = vs.id"),
								"expenses",
							)
							.orderBy("vs.startTime", "DESC"),
					headers: [
						"id",
						"driverName",
						"vehicle", // license plate
						"serviceType",
						"reason",
						"description",
						"startTime",
						"endTime",
						"status",
						"expenses", // number of expenses for this service
						"createdAt",
					],
					excludeForTable: exclude.vehicleServices ?? [],
					shape: (row) => ({
						id: row.id,
						driverName: row.driverName || "",
						vehicle: row.vehicle || "",
						serviceType: row.serviceType,
						reason: row.reason ?? "",
						description: row.description ?? "",
						startTime: fmtDateTime(row.startTime),
						endTime: fmtDateTime(row.endTime),
						status: row.status,
						expenses: Number(row.expenses ?? 0),
						createdAt: fmtDateTime(row.createdAt),
					}),
					applyFilters: (qb, _q) => {
						this.applyTimeRangeFilter(
							qb,
							"vs",
							"createdAt",
							startTime,
							endTime,
						);
					},
				},
				sharedQuery,
			),
		);

		// SETTINGS — simple key-value store
		builders.push(
			this.makeTableBuilder(
				{
					name: "settings",
					qb: () =>
						AppDataSource.getRepository(Setting)
							.createQueryBuilder("s")
							.select([])
							.addSelect("s.id", "id")
							.addSelect("s.title", "title")
							.addSelect("s.key", "key")
							.addSelect("s.value", "value")
							.addSelect("s.description", "description")
							.orderBy("s.title", "ASC"),
					headers: ["id", "title", "key", "value", "description"],
					excludeForTable: exclude.settings ?? [],
					shape: (row) => ({
						id: row.id,
						title: row.title,
						key: row.key,
						value: row.value,
						description: row.description ?? "",
					}),
					applyFilters: (_qb, _q) => {},
				},
				sharedQuery,
			),
		);

		// EXECUTIVE VEHICLE ACTIVITIES — exec name + vehicle plate + worked minutes + times
		builders.push(
			this.makeTableBuilder(
				{
					name: "executive_vehicle_activities",
					qb: () =>
						AppDataSource.getRepository(ExecutiveVehicleActivity)
							.createQueryBuilder("eva")
							.leftJoin("eva.executive", "u")
							.leftJoin("eva.vehicle", "v")
							.select([])
							.addSelect("eva.id", "id")
							.addSelect("u.name", "executiveName")
							.addSelect("v.licensePlate", "vehicle") // license plate
							.addSelect("eva.startTime", "startTime")
							.addSelect("eva.endTime", "endTime")
							.addSelect("eva.workedMinutes", "workedMinutes")
							.addSelect("eva.status", "status")
							.addSelect("eva.notes", "notes")
							.addSelect("eva.createdAt", "createdAt")
							.addSelect("eva.updatedAt", "updatedAt")
							.orderBy("eva.startTime", "DESC"),
					headers: [
						"id",
						"executiveName",
						"vehicle",
						"startTime",
						"endTime",
						"workedMinutes",
						"status",
						"notes",
						"createdAt",
						"updatedAt",
					],
					excludeForTable: exclude.executiveVehicleActivities ?? [],
					shape: (row) => ({
						id: row.id,
						executiveName: row.executiveName || "",
						vehicle: row.vehicle || "",
						startTime: fmtDateTime(row.startTime),
						endTime: fmtDateTime(row.endTime),
						workedMinutes: Number(row.workedMinutes ?? 0),
						status: row.status,
						notes: row.notes ?? "",
						createdAt: fmtDateTime(row.createdAt),
						updatedAt: fmtDateTime(row.updatedAt),
					}),
					applyFilters: (_qb, _q) => {},
				},
				sharedQuery,
			),
		);

		// ACTIVITY LOGS — core audit info + JSON metadata (stringified)
		builders.push(
			this.makeTableBuilder(
				{
					name: "activity_logs",
					qb: () =>
						AppDataSource.getRepository(ActivityLog)
							.createQueryBuilder("al")
							.select([])
							.addSelect("al.id", "id")
							.addSelect("al.actorRole", "actorRole")
							.addSelect("al.actorId", "actorId")
							.addSelect("al.entityId", "entityId")
							.addSelect("al.entityName", "entityName")
							.addSelect("al.actionType", "actionType")
							.addSelect("al.actionDetails", "actionDetails")
							.addSelect("al.metadata", "metadata")
							.addSelect("al.timestamp", "timestamp")
							.orderBy("al.timestamp", "DESC"),
					headers: [
						"id",
						"actorRole",
						"actorId",
						"entityId",
						"entityName",
						"actionType",
						"actionDetails",
						"metadata",
						"timestamp",
					],
					excludeForTable: exclude.activityLogs ?? [],
					shape: (row) => ({
						id: row.id,
						actorRole: row.actorRole,
						actorId: row.actorId,
						entityId: row.entityId,
						entityName: row.entityName,
						actionType: row.actionType,
						actionDetails: row.actionDetails,
						metadata:
							row.metadata != null
								? (() => {
										try {
											return JSON.stringify(row.metadata);
										} catch {
											return "";
										}
									})()
								: "",
						timestamp: fmtDateTime(row.timestamp),
					}),
					applyFilters: (_qb, _q) => {},
				},
				sharedQuery,
			),
		);

		// EXPENSES — driver name, trip id, vehicle service id, formatted times
		builders.push(
			this.makeTableBuilder(
				{
					name: "expenses",
					qb: () =>
						AppDataSource.getRepository(Expense)
							.createQueryBuilder("e")
							.leftJoin("e.driver", "d")
							.leftJoin("e.trip", "t")
							.leftJoin("e.vehicleService", "vs")
							.select([])
							.addSelect("e.id", "id")
							.addSelect("e.type", "type")
							.addSelect("e.description", "description")
							.addSelect("e.amount", "amount")
							.addSelect("e.status", "status")
							.addSelect("d.name", "driverName")
							.addSelect("t.id", "tripId")
							.addSelect("vs.id", "vehicleServiceId")
							.addSelect("e.receiptImageUrl", "receiptImageUrl")
							.addSelect("e.createdAt", "createdAt")
							.orderBy("e.createdAt", "DESC"),
					headers: [
						"id",
						"type",
						"description",
						"amount",
						"status",
						"driverName",
						"tripId",
						"vehicleServiceId",
						"receiptImageUrl",
						"createdAt",
					],
					excludeForTable: exclude.expenses ?? [],
					shape: (row) => ({
						id: row.id,
						type: row.type,
						description: row.description ?? "",
						amount: row.amount, // keep as number/decimal string from DB
						status: row.status,
						driverName: row.driverName || "",
						tripId: row.tripId || "",
						vehicleServiceId: row.vehicleServiceId || "",
						receiptImageUrl: row.receiptImageUrl ?? "",
						createdAt: fmtDateTime(row.createdAt),
					}),
					applyFilters: (qb, _q) => {
						this.applyTimeRangeFilter(
							qb,
							"e",
							"createdAt",
							startTime,
							endTime,
						);
					},
				},
				sharedQuery,
			),
		);

		const wanted =
			Array.isArray(tables) && tables.length
				? builders.filter((b) => tables.includes(b.name))
				: builders;

		// Produce ZIP in the background; return the stream immediately
		(async () => {
			try {
				for (const b of wanted) {
					const { dbStream, headers, transform } = await b.build();

					const csv = csvFormat({
						headers,
						writeBOM: includeBom,
						delimiter,
						writeHeaders: true as any,
					});
					csv.transform(transform);

					const entry = new PassThrough();
					archive.append(entry, {
						name: `${b.name}.csv`,
						date: new Date(),
					});

					await pipeline(dbStream, csv, entry);
				}

				await archive.finalize();
			} catch (err) {
				out.destroy(err as Error);
			}
		})();

		return { stream: out, filename: finalFilename, contentType };
	}

	public async generateAndUploadZip(
		options?: GenerateAllZipOptions,
	): Promise<{ downloadUrl: string; filename: string }> {
		const { stream, filename } = await this.generateAllCsvZip(options);

		// Convert stream to buffer
		const chunks: Buffer[] = [];

		return new Promise((resolve, reject) => {
			stream.on("data", (chunk) => chunks.push(chunk));
			stream.on("error", reject);
			stream.on("end", async () => {
				try {
					const buffer = Buffer.concat(chunks);

					// Create unique blob key with timestamp
					const blobKey = `reports/exports/${filename}`;

					// Upload to Azure Blob using the large file method
					const result = await this.blobUploadService.uploadLargeFile(
						blobKey,
						buffer,
						"application/zip",
						true,
					);

					resolve({
						downloadUrl: result.urlWithSas,
						filename: filename,
					});
				} catch (error) {
					reject(error);
				}
			});
		});
	}

	private makeTableBuilder<T extends ObjectLiteral>(
		args: {
			name: string;
			qb: () => SelectQueryBuilder<T>;
			headers: string[];
			shape: (row: any) => Record<string, unknown>;
			excludeForTable?: string[];
			applyFilters?: (
				qb: SelectQueryBuilder<T>,
				query: Record<string, unknown>,
			) => void;
		},
		sharedQuery?: Record<string, unknown>,
	): TableBuilder {
		const {
			name,
			qb: qbFactory,
			headers: allHeaders,
			shape,
			excludeForTable = [],
			applyFilters,
		} = args;

		return {
			name,
			build: async () => {
				const qb = qbFactory();
				if (applyFilters) {
					applyFilters(qb, sharedQuery ?? {});
				}

				// NOTE: for Postgres, ensure `pg-query-stream` is installed
				const dbStream = await (qb as any).stream();

				const headers = allHeaders.filter(
					(k) => !excludeForTable.includes(k),
				);

				const transform = (row: any) => {
					const shaped = shape(row);
					const out: Record<string, unknown> = {};
					for (const k of headers) out[k] = sanitize(shaped[k]);
					return out;
				};

				return { dbStream, headers, transform };
			},
		};
	}
}

export default ReportGenerator;
