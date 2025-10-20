import {
	Entity,
	Column,
	CreateDateColumn,
	OneToOne,
	JoinColumn,
	PrimaryColumn,
	BeforeInsert,
} from "typeorm";
import { randomBytes } from "crypto";
import Trip from "./Trip";

@Entity("public_trip_access")
class PublicTripAccess {
	@PrimaryColumn({
		type: "varchar",
		length: 255,
	})
	code!: string;

	@OneToOne(() => Trip)
	@JoinColumn({ name: "trip_id" })
	trip!: Trip;

	@Column({ type: "timestamp with time zone", nullable: true })
	validFrom!: Date;

	@Column({ type: "timestamp with time zone", nullable: true })
	validUntil!: Date;

	@CreateDateColumn({ type: "timestamp with time zone" })
	createdAt!: Date;

	constructor(trip: Trip, departureTime: Date, arrivalTime: Date) {
		this.trip = trip;
		this.validFrom = departureTime;
		this.validUntil = arrivalTime;
	}

	@BeforeInsert()
	private assignCode() {
		if (!this.code) this.code = PublicTripAccess.generateCode();
	}

	private static readonly B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

	private static generateCode(): string {
		const time = Date.now(); // 48-bit time -> 10 chars
		const timePart = PublicTripAccess.encodeTime(time, 10);
		const randPart = PublicTripAccess.encodeRandom(16); // 80 bits -> 16 chars
		return timePart + randPart; // 26 chars total
	}

	private static encodeTime(time: number, length: number): string {
		let str = "";
		for (let i = 0; i < length; i++) {
			str = PublicTripAccess.B32[time % 32] + str;
			time = Math.floor(time / 32);
		}
		return str;
	}

	private static encodeRandom(length: number): string {
		const bytes = randomBytes(length);
		let str = "";
		for (let i = 0; i < length; i++) {
			// Map each byte to 0..31. Tiny bias is acceptable for IDs.
			str += PublicTripAccess.B32[bytes[i] & 31];
		}
		return str;
	}
}

export default PublicTripAccess;
