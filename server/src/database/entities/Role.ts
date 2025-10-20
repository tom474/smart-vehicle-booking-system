import {
	Column,
	Entity,
	JoinTable,
	ManyToMany,
	OneToMany,
	PrimaryColumn,
} from "typeorm";
import Permission from "./Permission";
import User from "./User";
import Driver from "./Driver";

@Entity("role")
class Role {
	@PrimaryColumn({ name: "id", type: "varchar", length: 255 })
	id!: string;

	@Column({ name: "title", type: "varchar", length: 255, unique: true })
	title!: string;

	@Column({ name: "key", type: "varchar", length: 255, unique: true })
	key!: string;

	@Column({ name: "description", type: "text", nullable: true })
	description?: string | null;

	@ManyToMany(() => Permission, (permission) => permission.roles)
	@JoinTable({
		name: "roles_permissions",
		joinColumn: { name: "role_id", referencedColumnName: "id" },
		inverseJoinColumn: {
			name: "permission_id",
			referencedColumnName: "id",
		},
	})
	permissions!: Permission[];

	@OneToMany(() => User, (user) => user.role)
	users!: User[];

	@OneToMany(() => Driver, (driver) => driver.role)
	drivers!: Driver[];

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

export default Role;
