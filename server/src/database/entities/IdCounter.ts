import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("id_counter")
class IdCounter {
	@PrimaryColumn({ name: "table_name", type: "varchar", length: 255 })
	tableName!: string;

	@Column({ name: "prefix", type: "varchar", length: 255, unique: true })
	prefix!: string;

	@Column({ name: "current_id", type: "int", default: 0 })
	currentId!: number;

	constructor(tableName: string, prefix: string, currentId: number = 0) {
		this.tableName = tableName;
		this.prefix = prefix;
		this.currentId = currentId;
	}
}

export default IdCounter;
