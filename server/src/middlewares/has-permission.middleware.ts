import { NextFunction, Request, Response } from "express";
import { ExpressMiddlewareInterface, Middleware } from "routing-controllers";
import { Service } from "typedi";
import Role from "../database/entities/Role";
import RoleRepository from "../repositories/role.repository";
import ApiError from "../templates/api-error";

function HasPermissionMiddleware(requiredPermission: string) {
	@Middleware({ type: "before" })
	@Service()
	class HasPermissionMiddlewareImpl implements ExpressMiddlewareInterface {
		constructor(private roleRepository: RoleRepository) {}

		async use(req: Request, res: Response, next: NextFunction) {
			// Fetch the current user's role
			const roleKey: string = req.cookies.currentUser.role;
			const role: Role | null =
				await this.roleRepository.findOneByKey(roleKey);
			if (!role) {
				return next(
					new ApiError(`Role with key ${roleKey} not found`, 404),
				);
			}

			// Check if the role has the required permission
			const hasPermission: boolean = role.permissions.some(
				(permission) => permission.key === requiredPermission,
			);
			if (!hasPermission) {
				next(
					new ApiError(
						`Role '${role.key}' does not have permission '${requiredPermission}'`,
						403,
					),
				);
			}

			next();
		}
	}

	return HasPermissionMiddlewareImpl;
}

export default HasPermissionMiddleware;
