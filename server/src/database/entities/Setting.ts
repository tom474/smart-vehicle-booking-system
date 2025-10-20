import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("setting")
class Setting {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({ name: "title", type: "varchar", length: 255, unique: true })
	title!: string;

	@Column({ name: "key", type: "varchar", length: 255, unique: true })
	key!: string;

	@Column({ name: "value", type: "text" })
	value!: string;

	@Column({ name: "description", type: "text", nullable: true })
	description?: string | null;

	constructor(
		id: string,
		title: string,
		key: string,
		value: string,
		description?: string | null,
	) {
		this.id = id;
		this.title = title;
		this.key = key;
		this.value = value;
		this.description = description;
	}
}

export default Setting;
