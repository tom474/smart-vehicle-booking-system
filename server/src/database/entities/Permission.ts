import { Column, Entity, ManyToMany, PrimaryColumn } from "typeorm";
import Role from "./Role";

@Entity("permission")
class Permission {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({ name: "title", type: "varchar", length: 255, unique: true })
	title!: string;

	@Column({ name: "key", type: "varchar", length: 255, unique: true })
	key!: string;

	@Column({ name: "description", type: "text", nullable: true })
	description?: string | null;

	@ManyToMany(() => Role, (role) => role.permissions)
	roles!: Role[];

	constructor(
		id: string,
		title: string,
		key: string,
		description?: string | null,
	) {
		this.id = id;
		this.title = title;
		this.key = key;
		this.description = description;
	}
}

export default Permission;
