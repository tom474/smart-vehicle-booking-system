import { Service } from "typedi";
import ApiError from "../templates/api-error";
import ITripOptimizerService from "./interfaces/ITripOptimizerService";
import BookingRequestRepository from "../repositories/booking-request.repository";
import VehicleRepository from "../repositories/vehicle.repository";
import Vehicle from "../database/entities/Vehicle";
import Schedule from "../database/entities/Schedule";
import TripOptimizerRequestDto, {
	TripOptimizerBookingRequest,
	TripOptimizerUnavailability,
	TripOptimizerVehicle,
} from "../dtos/trip-optimizer/trip-optimizer-request.dto";
import BookingRequest from "../database/entities/BookingRequest";
import OneWayBookingRequest from "../database/entities/OneWayBookingRequest";
import RoundTripBookingRequest from "../database/entities/RoundTripBookingRequest";
import axios from "axios";
import { plainToInstance } from "class-transformer";
import TripOptimizerResultDto from "../dtos/trip-optimizer/trip-optimizer-result.dto";
import TripRepository from "../repositories/trip.repository";
import Trip from "../database/entities/Trip";
import AppDataSource from "../config/database";
import { EntityManager } from "typeorm";
import TripTicketRepository from "../repositories/trip-ticket.repository";
import TripStopRepository from "../repositories/trip-stop.repository";
import ScheduleRepository from "../repositories/schedule.repository";
import TripService from "./trip.service";
import UserStatus from "../database/enums/UserStatus";
import Driver from "../database/entities/Driver";
import DriverRepository from "../repositories/driver.repository";
import VehicleAvailability from "../database/enums/VehicleAvailability";
import TripTicket from "../database/entities/TripTicket";
import RequestStatus from "../database/enums/RequestStatus";
import TripStatus from "../database/enums/TripStatus";
import TripStopType from "../database/enums/TripStopType";
import IdCounterService from "./id-counter.service";
import Priority from "../database/enums/Priority";
import NotificationBody from "../dtos/notification/notification-body.dto";
import NotificationService from "./notification.service";
import logger from "../utils/logger";
import EntityMap from "../constants/entity-map";

type OptimizeJobStatus = "pending" | "completed" | "failed";

@Service()
class TripOptimizerService implements ITripOptimizerService {
	// Asia/Ho_Chi_Minh (UTC+7)
	private readonly TZ_OFFSET_MS = 7 * 60 * 60 * 1000;
	private readonly MS_PER_DAY = 24 * 60 * 60 * 1000;
	private readonly TRIP_OPTIMIZER_URL =
		process.env.TRIP_OPTIMIZER_URL || "http://localhost:8000";
	private readonly TRIP_OPTIMIZER_API_KEY =
		process.env.TRIP_OPTIMIZER_API_KEY || "TRIP_OPTIMIZER_API_KEY";

	constructor(
		private readonly bookingRequestRepository: BookingRequestRepository,
		private readonly vehicleRepository: VehicleRepository,
		private readonly tripRepository: TripRepository,
		private readonly tripTicketRepository: TripTicketRepository,
		private readonly tripStopRepository: TripStopRepository,
		private readonly scheduleRepository: ScheduleRepository,
		private readonly driverRepository: DriverRepository,
		private readonly idCounterService: IdCounterService,
		private readonly tripService: TripService,
		private readonly notificationService: NotificationService,
	) {}

	private sleep(ms: number) {
		return new Promise((r) => setTimeout(r, ms));
	}

	public async optimizeTripsWithORTools(): Promise<void> {
		try {
			logger.info("Starting trip optimization with OR-Tools");

			// Fetch all available data
			const vehicles: Vehicle[] =
				await this.vehicleRepository.findVehiclesForTripOptimizer();
			const bookingRequests: OneWayBookingRequest[] =
				await this.bookingRequestRepository.findBookingForTripOptimizer();

			logger.info(
				`Found ${vehicles.length} vehicles and ${bookingRequests.length} booking requests`,
			);

			// Group booking requests by date
			const requestsByDate =
				this.groupBookingRequestsByDate(bookingRequests);

			// Process each date group
			const allOptimizationResults: TripOptimizerResultDto[] = [];
			const allRelatedTrips: Trip[] = [];

			for (const [dateKey, requests] of requestsByDate) {
				logger.info(
					`Processing ${requests.length} requests for ${dateKey}`,
				);

				// Get vehicles available for this specific date
				const availableVehicles = this.getVehiclesAvailableForDate(
					vehicles,
					new Date(dateKey),
				);

				if (availableVehicles.length === 0) {
					logger.warn(
						`No vehicles available for ${dateKey}, skipping`,
					);
					continue;
				}

				// Submit optimization job for this date
				const dayResults = await this.submitOptimizationJob(
					requests,
					availableVehicles,
				);

				if (dayResults && dayResults.length > 0) {
					allOptimizationResults.push(...dayResults);
				}

				// Collect related trips for cleanup
				const dayRelatedTrips =
					await this.tripRepository.findTripsByBookingRequestIds(
						requests.map((request) => request.id),
					);
				allRelatedTrips.push(...dayRelatedTrips);
			}

			// Apply all results in a single transaction
			await this.applyOptimizationResults(
				allOptimizationResults,
				allRelatedTrips,
			);

			logger.info("Trip optimization completed successfully");
		} catch (err: unknown) {
			logger.error("Trip optimization failed", { error: err });
		}
	}

	private groupBookingRequestsByDate(
		bookingRequests: OneWayBookingRequest[],
	): Map<string, OneWayBookingRequest[]> {
		const requestsByDate = new Map<string, OneWayBookingRequest[]>();

		for (const request of bookingRequests) {
			const departureDate = new Date(request.departureTime);
			const dateKey = this.formatDateKey(departureDate);

			if (!requestsByDate.has(dateKey)) {
				requestsByDate.set(dateKey, []);
			}
			requestsByDate.get(dateKey)!.push(request);
		}

		return requestsByDate;
	}

	private formatDateKey(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	private getVehiclesAvailableForDate(
		vehicles: Vehicle[],
		targetDate: Date,
	): Vehicle[] {
		const targetDateIndex = this.toDayIndexVN(targetDate);

		return vehicles.filter((vehicle) => {
			if (!vehicle.driver?.schedules?.length) {
				return true;
			}

			// Check if vehicle has any conflicting schedules on target date
			for (const schedule of vehicle.driver.schedules) {
				const scheduleStartIndex = this.toDayIndexVN(
					schedule.startTime,
				);
				const scheduleEndIndex = this.toDayIndexVN(schedule.endTime);

				if (
					targetDateIndex >= scheduleStartIndex &&
					targetDateIndex <= scheduleEndIndex
				) {
					return false;
				}
			}

			return true;
		});
	}

	private async submitOptimizationJob(
		bookingRequests: OneWayBookingRequest[],
		vehicles: Vehicle[],
	): Promise<TripOptimizerResultDto[] | null> {
		try {
			const optimizedVehicles = this.filterVehiclesForDay(
				bookingRequests,
				vehicles,
			);
			const MAX_REQUESTS_PER_JOB = 4;

			logger.info(
				`Processing ${bookingRequests.length} requests with ${optimizedVehicles.length} vehicles`,
			);

			// If requests don't exceed the limit, process normally
			if (bookingRequests.length <= MAX_REQUESTS_PER_JOB) {
				return await this.processSingleJob(
					bookingRequests,
					optimizedVehicles,
				);
			}

			// Split into batches if requests exceed the limit
			const allResults: TripOptimizerResultDto[] = [];
			const totalBatches = Math.ceil(
				bookingRequests.length / MAX_REQUESTS_PER_JOB,
			);

			// Distribute requests as evenly as possible
			const batchSizes = this.calculateEvenBatchSizes(
				bookingRequests.length,
				MAX_REQUESTS_PER_JOB,
			);

			let requestIndex = 0;

			for (let i = 0; i < totalBatches; i++) {
				const batchSize = batchSizes[i];

				// Get requests for this batch
				const batchRequests = bookingRequests.slice(
					requestIndex,
					requestIndex + batchSize,
				);
				requestIndex += batchSize;

				// Calculate vehicle allocation for this batch
				const batchVehicles = this.allocateVehiclesForBatch(
					optimizedVehicles,
					i,
					totalBatches,
					batchRequests.length,
				);

				logger.info(
					`Batch ${i + 1}/${totalBatches}: ${batchRequests.length} requests, ${batchVehicles.length} vehicles`,
				);

				// Process this batch
				if (batchVehicles.length > 0) {
					const batchResults = await this.processSingleJob(
						batchRequests,
						batchVehicles,
					);
					if (batchResults && batchResults.length > 0) {
						allResults.push(...batchResults);
					}
				} else {
					logger.warn(
						`No vehicles available for batch ${i + 1}, skipping`,
					);
				}
			}

			logger.info(
				`All batches completed with ${allResults.length} total trips`,
			);
			return allResults;
		} catch (error) {
			logger.error("Error in optimization job", { error });
			return null;
		}
	}

	private calculateEvenBatchSizes(
		totalRequests: number,
		maxRequestsPerBatch: number,
	): number[] {
		const totalBatches = Math.ceil(totalRequests / maxRequestsPerBatch);
		const baseSize = Math.floor(totalRequests / totalBatches);
		const remainder = totalRequests % totalBatches;

		const batchSizes: number[] = [];

		// Distribute requests evenly
		for (let i = 0; i < totalBatches; i++) {
			// First 'remainder' batches get one extra request
			const batchSize = i < remainder ? baseSize + 1 : baseSize;
			batchSizes.push(batchSize);
		}

		logger.debug(`Calculated batch sizes: ${batchSizes.join(", ")}`);
		return batchSizes;
	}

	private allocateVehiclesForBatch(
		allVehicles: Vehicle[],
		batchIndex: number,
		totalBatches: number,
		requestCount: number,
	): Vehicle[] {
		// Calculate vehicle allocation range for this batch
		const vehiclesPerBatch = Math.floor(allVehicles.length / totalBatches);
		const extraVehicles = allVehicles.length % totalBatches;

		// Calculate start index for this batch
		let startIndex = 0;
		for (let i = 0; i < batchIndex; i++) {
			const prevBatchVehicles =
				vehiclesPerBatch + (i < extraVehicles ? 1 : 0);
			startIndex += prevBatchVehicles;
		}

		// Calculate how many vehicles this batch should get
		const batchVehicleCount =
			vehiclesPerBatch + (batchIndex < extraVehicles ? 1 : 0);
		const endIndex = startIndex + batchVehicleCount;

		let batchVehicles = allVehicles.slice(startIndex, endIndex);

		// Ensure proper vehicle limits
		const minVehicles = Math.min(requestCount + 1, allVehicles.length);
		const maxVehicles = Math.min(requestCount + 2, allVehicles.length);

		// If we have too few vehicles, try to get more from remaining pool
		if (batchVehicles.length < minVehicles) {
			const needed = minVehicles - batchVehicles.length;
			const remainingVehicles = [
				...allVehicles.slice(0, startIndex),
				...allVehicles.slice(endIndex),
			];

			const additionalVehicles = remainingVehicles.slice(0, needed);
			batchVehicles = [...batchVehicles, ...additionalVehicles];

			logger.debug(
				`Batch ${batchIndex + 1} boosted from ${batchVehicleCount} to ${batchVehicles.length} vehicles`,
			);
		}

		// If we have too many vehicles, trim to maximum
		if (batchVehicles.length > maxVehicles) {
			batchVehicles = batchVehicles.slice(0, maxVehicles);
			logger.debug(
				`Batch ${batchIndex + 1} trimmed to ${batchVehicles.length} vehicles`,
			);
		}

		return batchVehicles;
	}

	private async processSingleJob(
		requests: OneWayBookingRequest[],
		vehicles: Vehicle[],
	): Promise<TripOptimizerResultDto[] | null> {
		try {
			const tripOptimizeVehicles: TripOptimizerVehicle[] =
				this.toTripOptimizerVehicle(vehicles);
			const tripOptimizeBookingRequests: TripOptimizerBookingRequest[] =
				this.toTripOptimizerBookingRequest(requests);

			const tripOptimizerRequest: TripOptimizerRequestDto =
				new TripOptimizerRequestDto({
					requests: tripOptimizeBookingRequests,
					vehicles: tripOptimizeVehicles,
				});

			logger.info(
				`Submitting ${requests.length} requests with ${vehicles.length} vehicles to OR-Tools`,
			);

			// Submit job
			const optimizeJobResponse = await axios.post(
				`${this.TRIP_OPTIMIZER_URL}/optimizer/api/v1/optimize`,
				tripOptimizerRequest,
				{
					headers: {
						"Content-Type": "application/json",
						"X-API-Key": this.TRIP_OPTIMIZER_API_KEY,
					},
					timeout: 10_000,
				},
			);

			const jobId: string | undefined = optimizeJobResponse.data?.job_id;
			if (!jobId) {
				logger.warn("No job ID returned from optimizer");
				return null;
			}

			// Poll for completion
			const result = await this.pollOptimizationJob(jobId);
			if (!result) {
				logger.warn(`Job ${jobId} failed or timed out`);
				return null;
			}

			// Parse results
			const trips: TripOptimizerResultDto[] = plainToInstance(
				TripOptimizerResultDto,
				result.scheduled_trips as unknown[],
				{
					excludeExtraneousValues: true,
				},
			);

			logger.info(`Job ${jobId} completed with ${trips.length} trips`);
			return trips;
		} catch (error) {
			logger.error("Error in single job processing", { error });
			return null;
		}
	}

	private filterVehiclesForDay(
		bookingRequests: OneWayBookingRequest[],
		vehicles: Vehicle[],
	): Vehicle[] {
		const requestCount = bookingRequests.length;
		const vehicleCount = vehicles.length;
		const maxVehicles = requestCount + 1; // Maximum vehicles = requests + 1

		logger.debug(
			`Filtering ${vehicleCount} vehicles for ${requestCount} requests (max: ${maxVehicles})`,
		);

		// If vehicles are already at or below the limit, return as is
		if (vehicleCount <= maxVehicles) {
			logger.debug(
				`Vehicle count (${vehicleCount}) is within limit, no filtering needed`,
			);
			return vehicles;
		}

		// We need to reduce vehicles from ${vehicleCount} to ${maxVehicles}
		const vehiclesToRemove = vehicleCount - maxVehicles;

		// Identify vehicles that can't handle ANY booking request (priority for removal)
		const unsuitableVehicles = vehicles.filter((vehicle) => {
			return !bookingRequests.some(
				(request) => vehicle.capacity >= request.numberOfPassengers,
			);
		});

		const suitableVehicles = vehicles.filter((vehicle) => {
			return bookingRequests.some(
				(request) => vehicle.capacity >= request.numberOfPassengers,
			);
		});

		logger.debug(
			`Found ${unsuitableVehicles.length} unsuitable vehicles, ${suitableVehicles.length} suitable vehicles`,
		);

		// Remove unsuitable vehicles first (up to the limit we need to remove)
		const vehiclesToRemoveFromUnsuitable = Math.min(
			unsuitableVehicles.length,
			vehiclesToRemove,
		);
		const remainingToRemove =
			vehiclesToRemove - vehiclesToRemoveFromUnsuitable;

		let finalVehicles: Vehicle[] = [...suitableVehicles];

		// If we still need to remove more vehicles, remove from suitable ones
		if (
			remainingToRemove > 0 &&
			suitableVehicles.length > remainingToRemove
		) {
			const targetKeepCount = suitableVehicles.length - remainingToRemove;
			finalVehicles = this.randomSelection(
				suitableVehicles,
				targetKeepCount,
			);
		}

		logger.debug(
			`Final selection: ${finalVehicles.length} vehicles (removed ${vehiclesToRemoveFromUnsuitable} unsuitable, ${remainingToRemove} others)`,
		);

		return finalVehicles;
	}

	private randomSelection<T>(array: T[], count: number): T[] {
		if (count >= array.length) {
			return [...array];
		}

		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}

		return shuffled.slice(0, count);
	}

	private async pollOptimizationJob(jobId: string) {
		const pollIntervalMs = 300;
		const maxWaitMs = 300_000; // 5 minutes
		const deadline = Date.now() + maxWaitMs;

		let status: OptimizeJobStatus = "pending";

		do {
			await this.sleep(pollIntervalMs);

			try {
				const statusRes = await axios.get<{
					job_id: string;
					status: OptimizeJobStatus;
				}>(
					`${this.TRIP_OPTIMIZER_URL}/optimizer/api/v1/optimize/${jobId}/status`,
					{
						headers: { "X-API-Key": this.TRIP_OPTIMIZER_API_KEY },
						timeout: 5_000,
					},
				);

				status = statusRes.data?.status;

				if (status === "failed") {
					return null;
				}

				if (Date.now() > deadline) {
					logger.warn(
						`Job ${jobId} timed out after ${maxWaitMs / 1000} seconds`,
					);
					return null;
				}
			} catch (error) {
				logger.error(`Error polling job ${jobId}`, { error });
				return null;
			}
		} while (status !== "completed");

		// Fetch result
		try {
			const resultRes = await axios.get(
				`${this.TRIP_OPTIMIZER_URL}/optimizer/api/v1/optimize/${jobId}/result`,
				{
					headers: { "X-API-Key": this.TRIP_OPTIMIZER_API_KEY },
					timeout: 10_000,
				},
			);

			return resultRes.data;
		} catch (error) {
			logger.error(`Error fetching result for job ${jobId}`, { error });
			return null;
		}
	}

	private async applyOptimizationResults(
		allResults: TripOptimizerResultDto[],
		allRelatedTrips: Trip[],
	): Promise<void> {
		await AppDataSource.transaction(async (manager: EntityManager) => {
			try {
				// Delete all related trips first
				logger.info(
					`Deleting ${allRelatedTrips.length} existing trips`,
				);
				for (const trip of allRelatedTrips) {
					await this.deleteTrip(trip, manager);
				}

				// Create all optimized trips
				logger.info(`Creating ${allResults.length} optimized trips`);
				for (const result of allResults) {
					await this.tripService.createTripByOptimizerResult(
						result,
						manager,
					);
				}

				logger.info("Optimization results applied successfully");
			} catch (error) {
				logger.error("Error applying optimization results", { error });
				throw error; // This will trigger transaction rollback
			}
		});
	}

	private async deleteTrip(trip: Trip, manager: EntityManager) {
		for (const ticket of trip.tickets) {
			await this.tripTicketRepository.delete(ticket.id, manager);
		}

		for (const stop of trip.stops) {
			await this.tripStopRepository.delete(stop.id, manager);
		}

		if (trip.schedule) {
			await this.scheduleRepository.delete(trip.schedule.id);
		}

		await this.tripRepository.delete(trip.id, manager);
	}

	private toTripOptimizerBookingRequest(
		bookingRequests: BookingRequest[],
	): TripOptimizerBookingRequest[] {
		const dto: TripOptimizerBookingRequest[] = [];

		for (const request of bookingRequests) {
			if (request instanceof OneWayBookingRequest) {
				dto.push({
					id: request.id,
					pickup_location: {
						id: request.departureLocation.id,
						latitude: request.departureLocation.latitude,
						longitude: request.departureLocation.longitude,
					},
					dropoff_location: {
						id: request.arrivalLocation.id,
						latitude: request.arrivalLocation.latitude,
						longitude: request.arrivalLocation.longitude,
					},
					dropoff_time: request.arrivalTime,
					capacity_demand: request.numberOfPassengers,
				} as TripOptimizerBookingRequest);
			}
		}

		return dto;
	}

	private toTripOptimizerVehicle(
		vehicles: Vehicle[],
	): TripOptimizerVehicle[] {
		return vehicles.map<TripOptimizerVehicle>((vehicle) => {
			const result: TripOptimizerVehicle = {
				id: vehicle.id,
				capacity: vehicle.capacity,
				base_location: {
					id: vehicle.baseLocation.id,
					latitude: vehicle.baseLocation.latitude,
					longitude: vehicle.baseLocation.longitude,
				},
				unavailability: [],
			};

			return result;
		});
	}

	// Map a day into a index format to use in for loop
	private toDayIndexVN(d: Date): number {
		return Math.floor((d.getTime() + this.TZ_OFFSET_MS) / this.MS_PER_DAY);
	}

	// Return date in yyyy-mm-dd format
	private getDate(idx: number): string {
		const msUtc = idx * this.MS_PER_DAY - this.TZ_OFFSET_MS;
		const dt = new Date(msUtc);
		const y = dt.getUTCFullYear();
		const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
		const d2 = String(dt.getUTCDate()).padStart(2, "0");
		return `${y}-${m}-${d2}`;
	}

	/** Build date-only unavailability from schedules */
	private buildUnavailableDate(
		schedules?: ReadonlyArray<Pick<Schedule, "startTime" | "endTime">>,
	): TripOptimizerUnavailability[] | undefined {
		if (!schedules?.length) return undefined;

		const daySet = new Set<string>();

		for (const s of schedules) {
			if (!s?.startTime || !s?.endTime) continue;

			const startIdx = this.toDayIndexVN(s.startTime);
			const endIdx = this.toDayIndexVN(s.endTime); // inclusive
			if (endIdx < startIdx) continue;

			for (let idx = startIdx; idx <= endIdx; idx++) {
				daySet.add(this.getDate(idx));
			}
		}

		if (!daySet.size) return undefined;

		return Array.from(daySet)
			.sort()
			.map((date) => ({ date, period: 0 }));
	}

	public async optimizeNormalBookingRequest(
		bookingRequestId: string,
		manager: EntityManager,
	): Promise<void> {
		// Fetch the booking request by ID
		const bookingRequest: BookingRequest | null =
			await this.bookingRequestRepository.findOne(
				bookingRequestId,
				manager,
			);
		if (!bookingRequest) {
			throw new ApiError(
				`Booking request with ID '${bookingRequestId}' not found.`,
				404,
			);
		}

		// Check if there are combinable trips
		let isCombined = false;
		const combinableTrips: Trip[] = await this.getCombinableTrips(
			bookingRequestId,
			manager,
		);
		if (combinableTrips.length > 0) {
			isCombined = true;

			// Get the combinable trip with smallest arrival time conflict
			let selectedTrip: Trip | null = null;
			for (const combinableTrip of combinableTrips) {
				if (!selectedTrip) {
					selectedTrip = combinableTrip;
				}

				// Calculate arrival time conflict
				const selectedTripConflict = Math.abs(
					selectedTrip.arrivalTime.getTime() -
						combinableTrip.arrivalTime.getTime(),
				);
				const combinableTripConflict = Math.abs(
					bookingRequest.arrivalTime.getTime() -
						combinableTrip.arrivalTime.getTime(),
				);
				if (combinableTripConflict < selectedTripConflict) {
					selectedTrip = combinableTrip;
				}
			}

			// Add booking request to the selected trip
			await this.addBookingRequestToTrip(
				bookingRequestId,
				selectedTrip!.id,
				manager,
			);
		}

		if (!isCombined) {
			// Get available vehicles for the booking request
			const availableVehicles: Vehicle[] =
				await this.getAvailableVehiclesForTrip(
					bookingRequestId,
					manager,
				);
			if (availableVehicles.length === 0) {
				// Send notification to coordinator
				AppDataSource.transaction(async (manager: EntityManager) => {
					const notificationBody = new NotificationBody(
						"No vehicle available for booking request",
						"NoVehicleAvailableForBookingRequest",
						{
							departureDate: new Date(
								bookingRequest.departureTime,
							).toLocaleDateString("en-GB", {
								day: "2-digit",
								month: "2-digit",
								year: "numeric",
							}),
							departureTime: new Date(
								bookingRequest.departureTime,
							).toLocaleTimeString("en-GB", {
								hour: "2-digit",
								minute: "2-digit",
								hour12: false,
							}),
						},
						bookingRequest.id,
						Priority.URGENT,
					);
					await this.notificationService.sendCoordinatorAndAdminNotification(
						notificationBody,
						manager,
					);
				});
				return;
			}

			// Assign a random vehicle from the available vehicles
			const assignedVehicle: Vehicle =
				availableVehicles[
					Math.floor(Math.random() * availableVehicles.length)
				];
			const tripTickets: TripTicket[] =
				await this.tripService.createSchedulingTripFromBookingRequest(
					bookingRequest,
					assignedVehicle,
					manager,
				);

			// Update the booking request
			bookingRequest.tickets = tripTickets;
			await this.bookingRequestRepository.update(bookingRequest, manager);
		}
	}

	public async optimizeHighPriorityBookingRequest(
		bookingRequestId: string,
		manager: EntityManager,
	): Promise<void> {
		// Fetch the booking request by ID
		const bookingRequest: BookingRequest | null =
			await this.bookingRequestRepository.findOne(
				bookingRequestId,
				manager,
			);
		if (!bookingRequest) {
			throw new ApiError(
				`Booking request with ID ${bookingRequestId} not found.`,
				404,
			);
		}

		// Get available vehicles for the booking request
		const availableVehicles: Vehicle[] =
			await this.getAvailableVehiclesForTrip(bookingRequestId, manager);
		if (availableVehicles.length === 0) {
			// Send notification to coordinator
		}

		// Assign a random vehicle from the available vehicles
		const assignedVehicle: Vehicle =
			availableVehicles[
				Math.floor(Math.random() * availableVehicles.length)
			];
		const tripTickets: TripTicket[] =
			await this.tripService.createSchedulingTripFromBookingRequest(
				bookingRequest,
				assignedVehicle,
				manager,
			);

		// Update the booking request
		bookingRequest.tickets = tripTickets;
		await this.bookingRequestRepository.update(bookingRequest, manager);
	}

	public async getCombinableTrips(
		bookingRequestId: string,
		manager: EntityManager,
	): Promise<Trip[]> {
		// Fetch the booking request by ID
		const bookingRequest: BookingRequest | null =
			await this.bookingRequestRepository.findOne(
				bookingRequestId,
				manager,
			);
		if (!bookingRequest) {
			throw new ApiError(
				`Booking request with ID ${bookingRequestId} not found.`,
				404,
			);
		}

		// Build the query for fetching trips
		const query: Record<string, unknown> = {
			status: TripStatus.SCHEDULED,
			departureTimeFrom: Date.now(),
		};

		// Fetch all trips
		const trips: Trip[] = await this.tripRepository.find(
			undefined,
			query,
			manager,
		);

		// Filter combinable trips
		const combinableTrips: Trip[] = [];
		for (const trip of trips) {
			if (
				trip.departureTime.getDate() ===
					bookingRequest.departureTime.getDate() &&
				trip.arrivalTime.getDate() ===
					bookingRequest.arrivalTime.getDate() &&
				trip.vehicle &&
				trip.driver &&
				trip.tickets.length + bookingRequest.numberOfPassengers <=
					trip.vehicle.capacity
			) {
				let pickupOrder: number | null = null;
				let dropoffOrder: number | null = null;

				// Loop through trip stops ascending to find matching pickup location
				for (const stop of trip.stops) {
					if (
						stop.type === TripStopType.PICKUP &&
						stop.location.id === bookingRequest.departureLocation.id
					) {
						pickupOrder = stop.order;
					}
				}

				// Loop through trip stops descending to find matching dropoff location
				for (const stop of trip.stops.slice().reverse()) {
					if (
						stop.type === TripStopType.DROP_OFF &&
						stop.location.id === bookingRequest.arrivalLocation.id
					) {
						dropoffOrder = stop.order;
					}
				}

				// Check if the trip is for high priority booking request
				let isHighPriorityTrip = false;
				for (const ticket of trip.tickets) {
					if (ticket.bookingRequest.priority === Priority.HIGH) {
						isHighPriorityTrip = true;
						break;
					}
				}

				// Check if both pickup and dropoff orders are found and trip is not high priority
				if (
					pickupOrder &&
					dropoffOrder &&
					pickupOrder < dropoffOrder &&
					!isHighPriorityTrip
				) {
					combinableTrips.push(trip);
				}
			}
		}

		return combinableTrips;
	}

	public async addBookingRequestToTrip(
		bookingRequestId: string,
		tripId: string,
		manager: EntityManager,
	): Promise<void> {
		// Fetch the booking request by ID
		const bookingRequest: BookingRequest | null =
			await this.bookingRequestRepository.findOne(
				bookingRequestId,
				manager,
			);
		if (!bookingRequest) {
			throw new ApiError(
				`Booking request with ID '${bookingRequestId}' not found.`,
				404,
			);
		}

		// Fetch the trip by ID
		const trip: Trip | null = await this.tripRepository.findOne(
			tripId,
			manager,
		);
		if (!trip) {
			throw new ApiError(`Trip with ID '${tripId}' not found.`, 404);
		}

		// Create trip tickets for each passenger in the booking request
		for (const passenger of bookingRequest.passengers) {
			// Generate an ID for the new trip ticket
			const ticketId: string = await this.idCounterService.generateId(
				EntityMap.TRIP_TICKET,
				manager,
			);

			// Create a new trip ticket
			const tripTicket: TripTicket = new TripTicket(
				ticketId,
				passenger,
				bookingRequest,
				trip,
				bookingRequest.departureTime,
				bookingRequest.arrivalTime,
				bookingRequest.departureLocation,
				bookingRequest.arrivalLocation,
			);
			await this.tripTicketRepository.create(tripTicket, manager);
			trip.tickets.push(tripTicket);
			bookingRequest.tickets.push(tripTicket);
		}

		// Update the trip
		await this.tripRepository.update(trip, manager);

		// Update the booking request
		bookingRequest.status = RequestStatus.APPROVED;
		await this.bookingRequestRepository.update(bookingRequest, manager);
	}

	public async getAvailableVehiclesForTrip(
		bookingRequestId: string,
		manager: EntityManager,
	): Promise<Vehicle[]> {
		// Fetch the booking request by ID
		const bookingRequest: BookingRequest | null =
			await this.bookingRequestRepository.findOne(
				bookingRequestId,
				manager,
			);
		if (!bookingRequest) {
			throw new ApiError(
				`Booking request with ID '${bookingRequestId}' not found.`,
				404,
			);
		}

		// Fetch all active drivers
		const drivers: Driver[] = await this.driverRepository.find(
			undefined,
			{ status: UserStatus.ACTIVE },
			manager,
		);

		// Filter available drivers and vehicles
		const availableVehicleIds: string[] = [];
		for (const driver of drivers) {
			if (
				driver.vehicle &&
				!driver.vehicle.executive &&
				driver.vehicle.availability !==
					VehicleAvailability.UNAVAILABLE &&
				driver.vehicle.availability !==
					VehicleAvailability.OUT_OF_SERVICE &&
				driver.vehicle.capacity >= bookingRequest.numberOfPassengers
			) {
				// Check driver's schedules
				if (driver.schedules.length === 0) {
					availableVehicleIds.push(driver.vehicle.id);
				} else {
					// Get the start and end time of the booking request
					let startTime: Date;
					let endTime: Date;
					if (bookingRequest instanceof RoundTripBookingRequest) {
						startTime = bookingRequest.departureTime;
						endTime = bookingRequest.returnArrivalTime;
					} else {
						startTime = bookingRequest.departureTime;
						endTime = bookingRequest.arrivalTime;
					}

					// Check if driver is available (no conflicting schedules)
					let hasConflict = false;
					for (const schedule of driver.schedules) {
						if (
							schedule.startTime < endTime &&
							schedule.endTime > startTime
						) {
							hasConflict = true;
							break;
						}
					}

					// Only add vehicle if there are no scheduling conflicts
					if (!hasConflict) {
						availableVehicleIds.push(driver.vehicle.id);
					}
				}
			}
		}

		// Fetch the available vehicles by IDs
		const availableVehicles: Vehicle[] = [];
		for (const vehicleId of availableVehicleIds) {
			const vehicle: Vehicle | null =
				await this.vehicleRepository.findOne(vehicleId, manager);
			if (!vehicle) {
				throw new ApiError(
					`Vehicle with ID ${vehicleId} not found.`,
					404,
				);
			}
			availableVehicles.push(vehicle);
		}

		return availableVehicles;
	}
}

export default TripOptimizerService;
