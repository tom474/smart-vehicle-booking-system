import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";
import { UserData, UserTokenData, UserTokenSchema } from "@/apis/user";
import { DriverData, getDriver } from "@/apis/driver";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const vietnamesePhoneRegex = /(?:\+84|0084|0)[235789][0-9]{1,2}[0-9]{7}(?:[^\d]+|$)/g;

export const serverURL = "";
// process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:5500"

export const apiURL = serverURL + "/api";

export function getAccessTokenFromCookie(): string | null {
	const cookies = document.cookie.split(";");
	const tokenCookie = cookies.find((cookie) => cookie.trim().startsWith("accessToken="));
	return tokenCookie ? tokenCookie.split("=")[1] : null;
}

export function getUserFromToken(): UserTokenData | null {
	const token = getAccessTokenFromCookie();
	if (!token) return null;
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const decoded = jwtDecode(token) as any;
		return UserTokenSchema.parse(decoded);
	} catch (error) {
		console.error("Failed to decode driver token:", error);
		return null;
	}
}

export function getUserFromCookie(): UserData | DriverData | null {
	const cookies = document.cookie.split(";");
	const userCookie = cookies.find((cookie) => cookie.trim().startsWith("user="));

	if (!userCookie) return null;

	try {
		const userString = userCookie.split("=")[1];
		// Decode URI component in case the JSON was encoded
		const decodedUserString = decodeURIComponent(userString);
		// Parse the JSON string to get the actual user object
		return JSON.parse(decodedUserString);
	} catch (error) {
		console.error("Failed to parse user from cookie:", error);
		return null;
	}
}

function getRefreshTokenFromCookie(): string | null {
	const cookies = document.cookie.split(";");
	const refreshTokenCookie = cookies.find((cookie) => cookie.trim().startsWith("refreshToken="));
	return refreshTokenCookie ? refreshTokenCookie.split("=")[1] : null;
}

export function setTokenInCookie(accessToken: string, refreshToken: string): void {
	document.cookie = `accessToken=${accessToken}; path=/; secure; samesite=strict`;
	document.cookie = `refreshToken=${refreshToken}; path=/; secure; samesite=strict`;
}

export function setUserInCookie(user: UserData | DriverData): void {
	const userString = JSON.stringify(user);
	const encodedUserString = encodeURIComponent(userString);
	document.cookie = `user=${encodedUserString}; path=/; secure; samesite=strict`;
}

async function refreshAccessToken(): Promise<string | null> {
	const refreshToken = getRefreshTokenFromCookie();
	if (!refreshToken) {
		return null;
	}

	try {
		const response = await fetch(`${apiURL}/auth/refresh`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ token: refreshToken }),
		});

		if (response.ok) {
			const data = await response.json();
			const newAccessToken = data.data.accessToken;
			const newRefreshToken = data.data.refreshToken;
			setTokenInCookie(newAccessToken, newRefreshToken);
			return newAccessToken;
		}
	} catch (error) {
		console.error("Failed to refresh token:", error);
	}

	return null;
}

export function requestWithCreds(
	method: "GET" | "POST" | "PUT" | "DELETE",
	body?: Record<string, unknown> | FormData,
): RequestInit {
	const token = getAccessTokenFromCookie();

	// Check if body is FormData
	const isFormData = body instanceof FormData;

	return {
		method,
		headers: {
			// Only set Content-Type for JSON, let browser set it for FormData
			...(isFormData ? {} : { "Content-Type": "application/json" }),
			...(token && { Authorization: `Bearer ${token}` }),
		},
		...(body && {
			body: isFormData ? body : JSON.stringify(body),
		}),
	};
}

export async function customFetch(
	endpoint: string,
	options?: {
		method?: "GET" | "POST" | "PUT" | "DELETE";
		body?: Record<string, unknown> | FormData;
	},
): Promise<Response> {
	const method = options?.method || "GET";
	const fullUrl = endpoint.startsWith("http") ? endpoint : `${endpoint}`;

	// First attempt with current token
	let response = await fetch(fullUrl, requestWithCreds(method, options?.body));

	// If unauthorized (401/403), try to refresh token and retry
	if (response.status === 401 || response.status === 403) {
		const newToken = await refreshAccessToken();

		if (newToken) {
			// Retry the request with the new token
			response = await fetch(fullUrl, requestWithCreds(method, options?.body));
		} else {
			// Refresh failed, redirect to login or handle as needed
			console.error("Token refresh failed, user needs to log in again");
			toast.error("Session expired. Please log in again.");
			redirectToLogin();
		}
	}

	return response;
}

export async function driverLogin(
	username: string,
	password: string,
): Promise<{ success: boolean; data?: { accessToken: string; refreshToken: string }; message?: string }> {
	const url = `${apiURL}/auth/driver/login`;
	try {
		const response = await fetch(url, {
			method: "POST",
			body: JSON.stringify({ username, password }),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || "Login failed");
		}

		const tokenData = await response.json();
		setTokenInCookie(tokenData.data.accessToken, tokenData.data.refreshToken);
		const userFromToken = getUserFromToken();
		const driverId = userFromToken?.id;
		if (!driverId) {
			throw new Error("Driver ID not found in token");
		}
		const driver = await getDriver(driverId);
		setUserInCookie(driver);
		return { success: true, data: tokenData.data };
	} catch (error: unknown) {
		console.error("Login error:", error);
		return { success: false, message: (error as Error).message };
	}
}

export function redirectToLogin(currentPath?: string) {
	const pathToStore = currentPath || window.location.pathname + window.location.search;
	if (pathToStore !== "/login") {
		sessionStorage.setItem("redirectAfterLogin", pathToStore);
	}
	window.location.href = "/login";
}

export function getRedirectPath(userRole?: string): string {
	const stored = sessionStorage.getItem("redirectAfterLogin");
	sessionStorage.removeItem("redirectAfterLogin");

	// If there's a stored redirect path and it's not the login page, use it
	if (stored && stored !== "/login") {
		return stored;
	}

	// Otherwise, redirect based on role
	if (userRole) {
		switch (userRole) {
			case "Admin":
			case "admin":
			case "ROL-5":
				return "/dashboard";
			case "Coordinator":
			case "coordinator":
			case "ROL-4":
				return "/dashboard";
			case "Employee":
			case "employee":
			case "ROL-1":
				return "/requester";
			case "Executive":
			case "executive":
			case "ROL-2":
				return "/executive";
			case "Driver":
			case "driver":
			case "ROL-3":
				return "/driver";
		}
	}

	// Fallback to login if no role provided
	return "/login";
}

export function logoutUser() {
	document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
	document.cookie = "refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
	document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
	sessionStorage.removeItem("redirectAfterLogin");
	window.location.href = "/login";
}

export function mapRole(roleId: string): string {
	switch (roleId) {
		case "ROL-1":
			return "Employee";
		case "ROL-2":
			return "Executive";
		case "ROL-3":
			return "Driver";
		case "ROL-4":
			return "Coordinator";
		case "ROL-5":
			return "Admin";
		default:
			throw new Error(`Unknown role ID: ${roleId}`);
	}
}

export function getRoleList(): [string, string][] {
	return [
		["ROL-1", "Employee"],
		["ROL-2", "Executive"],
		["ROL-3", "Driver"],
		["ROL-4", "Coordinator"],
		["ROL-5", "Admin"],
	];
}
