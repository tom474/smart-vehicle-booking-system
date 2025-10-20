class CurrentUser {
	public id: string;
	public role: string;

	constructor(id: string, role: string) {
		this.id = id;
		this.role = role;
	}
}

export default CurrentUser;
