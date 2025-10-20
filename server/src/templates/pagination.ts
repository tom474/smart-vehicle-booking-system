import { Min } from "class-validator";

class Pagination {
	@Min(1, { message: "Page number must be greater than or equal to 1." })
	page: number = 1;

	@Min(1, { message: "Limit must be greater than or equal to 1." })
	limit: number = 10;

	constructor(page: number = 1, limit: number = 10) {
		this.page = page;
		this.limit = limit;
	}
}

export default Pagination;
