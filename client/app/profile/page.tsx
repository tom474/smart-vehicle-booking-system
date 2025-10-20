"use client";

import { useState, useEffect, useRef } from "react";
import { UserRound, Mail, Phone, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserData, getUser, updateUser } from "@/apis/user";
import { DriverData, getDriver, updateDriver } from "@/apis/driver";
import { getUserFromToken } from "@/lib/utils";
import { PWAButton } from "@/app/pwa/pwa-button";
import { useTranslations } from "next-intl";
import { logoutUser } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { mapRole, setUserInCookie } from "@/lib/utils";
import { toast } from "sonner";

export default function ProfilePage() {
	useInstallPrompt();
	const t = useTranslations("Profile");
	const isMobile = useIsMobile();
	const [profile, setProfile] = useState<UserData | DriverData | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		// Fetch user profile data
		const fetchProfile = async () => {
			try {
				const userToken = getUserFromToken();
				if (!userToken) {
					console.error("User token not found");
					return;
				}
				if (userToken.role === "driver") {
					const driver = (await getDriver(userToken.id)) as DriverData;
					setProfile(driver);
					if (!driver.vehicleId) {
						return;
					}
				} else {
					const user = (await getUser(userToken.id)) as UserData;
					setProfile(user);
				}
			} catch (error) {
				console.error("Error fetching profile:", error);
			}
		};

		fetchProfile();
	}, []);

	const handleAvatarClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			toast.error("Please select a valid image file");
			return;
		}

		// Validate file size (5MB limit)
		if (file.size > 5 * 1024 * 1024) {
			toast.error("File size must be less than 5MB");
			return;
		}

		setIsUploading(true);

		try {
			const userToken = getUserFromToken();
			if (!userToken) {
				console.error("User token not found");
				return;
			}

			// Refetch the profile to get updated data
			if (userToken.role === "driver") {
				const updatedDriver = (await updateDriver(userToken.id, undefined, file)) as DriverData;
				setProfile(updatedDriver);
				setUserInCookie(updatedDriver);
			} else {
				const updatedUser = (await updateUser(userToken.id, undefined, file)) as UserData;
				setProfile(updatedUser);
				setUserInCookie(updatedUser);
			}
			toast.success("Avatar updated successfully");
		} catch (error) {
			console.error("Error updating avatar:", error);
			toast.error("Failed to update avatar");
		} finally {
			setIsUploading(false);
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	if (!profile) {
		return;
	}

	return (
		<div className="min-h-full overflow-y-auto">
			<div className="max-w-4xl p-4 mx-auto sm:px-6 lg:px-8">
				{/* Header */}
				<div className="pb-4 text-headline-1">{t("profile")}</div>
				<div className="bg-white border border-gray-200 rounded-lg shadow-sm">
					{!isMobile && <div className="h-32 rounded-t-lg bg-gradient-to-br from-blue-50 to-blue-100"></div>}

					{/* Avatar */}
					<div className="flex items-center justify-between p-6">
						<div className="flex items-center space-x-4">
							<div className="relative group">
								<Avatar
									className="transition-opacity cursor-pointer size-15 hover:opacity-80"
									onClick={handleAvatarClick}
								>
									<AvatarImage src={profile.profileImageUrl || ""} alt={`@${profile.name}`} />
									<AvatarFallback>
										<UserRound />
									</AvatarFallback>
								</Avatar>

								{/* Camera overlay */}
								<div
									className="absolute inset-0 flex items-center justify-center transition-opacity bg-black bg-opacity-50 rounded-full opacity-0 cursor-pointer group-hover:opacity-100"
									onClick={handleAvatarClick}
								>
									<Camera className="w-6 h-6 text-white" />
								</div>

								{/* Loading overlay */}
								{isUploading && (
									<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
										<div className="w-6 h-6 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
									</div>
								)}
							</div>

							{/* Hidden file input */}
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								className="hidden"
								disabled={isUploading}
							/>

							<div className="text-start">
								<h1 className="text-2xl font-semibold text-gray-900">{profile.name}</h1>
								<p className="text-sm text-gray-600">{profile?.id}</p>
							</div>
						</div>
					</div>
				</div>

				{/* Profile Content */}
				<div className="grid grid-cols-1 gap-8 mt-8 lg:grid-cols-3">
					{/* Contact Information */}
					<div className="lg:col-span-1">
						<div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
							<h2 className="mb-4 text-lg font-semibold text-gray-900">{t("contact")}</h2>
							<div className="space-y-4">
								<div className="flex items-center space-x-3">
									<Mail className="w-5 h-5 text-gray-400" />
									<span className="text-gray-700">{profile.email}</span>
								</div>

								<div className="flex items-center space-x-3">
									<Phone className="w-5 h-5 text-gray-400" />
									<span className="text-gray-700">{profile.phoneNumber}</span>
								</div>
							</div>
						</div>
					</div>

					{/* Bio and Additional Info */}
					<div className="space-y-6 text-center lg:col-span-2">
						{/* Stats Cards */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="p-4 text-center bg-white border border-gray-200 rounded-lg shadow-sm">
								<div className="text-2xl font-bold text-primary">{mapRole(profile.roleId)}</div>
								<div className="text-sm text-muted-foreground">{t("role")}</div>
							</div>

							<div className="p-4 text-center bg-white border border-gray-200 rounded-lg shadow-sm">
								<div
									className={`text-2xl font-bold ${profile.status === "active" ? "text-secondary" : "text-desctructive"}`}
								>
									{profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
								</div>
								<div className="text-sm text-muted-foreground">{t("status")}</div>
							</div>
						</div>

						<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
							<PWAButton ghost={false} />
							<Button
								variant="outline"
								className={`flex-1 border-destructive text-destructive hover:bg-destructive h-full text-lg rounded-md ${isMobile && "w-full"}`}
								onClick={() => logoutUser()}
							>
								{t("logout")}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
