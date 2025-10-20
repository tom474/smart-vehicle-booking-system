"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "@/lib/msalconfig";
import { driverLogin } from "@/lib/utils";
import { toast } from "sonner";
import { getRedirectPath } from "@/lib/utils";
import LocaleSwitcher from "@/components/locale-switcher";
import { PWAButton } from "@/app/pwa/pwa-button";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { getSupportContact, SupportContactSettingSchema } from "@/apis/settings";
import { z } from "zod/v4";

export default function Login() {
	useInstallPrompt();
	const t = useTranslations("Login");
	const isMobile = useIsMobile();
	const { instance } = useMsal();
	const router = useRouter();
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [supportContact, setSupportContact] = useState<z.infer<typeof SupportContactSettingSchema> | null>(null);

	useEffect(() => {
		const fetchSupportContact = async () => {
			try {
				const settings = await getSupportContact();
				setSupportContact(settings);
			} catch (error) {
				console.error(error);
				toast.error(error instanceof Error ? error.message : String(error));
			}
		};

		fetchSupportContact();
	}, []);

	const handleSuccessfulLogin = () => {
		const redirectPath = getRedirectPath("driver");
		router.push(redirectPath);
	};

	const handleMicrosoftLogin = async () => {
		setIsProcessing(true);

		try {
			// clear cookies
			document.cookie = "msal.cache.encryption=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
			// initiate login
			await instance.loginRedirect(loginRequest);
		} catch (error) {
			console.error(error);
			toast.error(error instanceof Error ? error.message : String(error));
			setIsProcessing(false);
		}
	};

	async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsProcessing(true);

		try {
			const formData = new FormData(event.currentTarget);
			const username = formData.get("username") as string;
			const password = formData.get("password") as string;

			const response = await driverLogin(username, password);
			if (response.success) {
				toast.success(t("loginSuccess"));
				handleSuccessfulLogin();
			} else {
				toast.error(t("loginFailed"));
				setIsProcessing(false);
			}
		} catch (error) {
			console.error(error);
			toast.error(error instanceof Error ? error.message : String(error));
			setIsProcessing(false);
		}
	}

	return (
		<div className="grid w-screen h-screen grid-cols-3">
			<div className={`absolute top-4 ${isMobile ? "left-4" : "right-16"}`}>
				<PWAButton />
			</div>
			<div className="absolute top-4 right-4">
				<LocaleSwitcher />
			</div>
			<div className="relative inset-0 flex-col hidden col-span-1 overflow-hidden border-r lg:flex bg-muted border-foreground/10">
				<div className="absolute z-0 flex items-center justify-center w-full h-full">
					<Image
						src="/images/svb-logo.svg"
						alt="Smart Vehicle Booking System Logo"
						width="0"
						height="0"
						sizes="100vw"
						className="w-full h-auto p-10"
						priority={true}
					/>
				</div>
			</div>
			<div className="flex flex-col items-center justify-center w-full h-full col-span-3 lg:col-span-2">
				<div className="flex flex-col justify-between h-full pt-10 w-sm">
					<div className="flex items-center justify-center w-full size-20 lg:invisible lg:size-0">
						<Image
							src="/images/svb-logo-var2.svg"
							alt="Smart Vehicle Booking System Logo"
							width="0"
							height="0"
							sizes="100vw"
							className="w-auto h-full mt-40 lg:hidden"
							priority={true}
						/>
					</div>
					<div className="p-5 space-y-8">
						{!isMobile && <div className="font-bold text-headline-1 text-start">{t("welcomeBack")}</div>}
						<form className="w-full space-y-6" onSubmit={handleLogin}>
							<div>
								<Input
									type="text"
									name="username"
									placeholder={t("enterEmail")}
									className="shadow-sm border-foreground/10 h-15"
									required
								/>
							</div>
							<div>
								<Input
									type="password"
									name="password"
									placeholder={t("enterPassword")}
									className="shadow-sm border-foreground/10 h-15"
									required
								/>
							</div>
							{/* <div className="w-full text-end">
								<Link href="/support" className="text-gray-500">
									{t("forgotPassword")}
								</Link>
							</div> */}
							<Button
								variant="outline"
								type="submit"
								className="w-full font-semibold rounded-md text-md h-15 bg-primary text-background hover:bg-primary/80"
								disabled={isProcessing}
							>
								{isProcessing ? t("loggingIn") : t("login")}
							</Button>
							<div className="flex flex-row items-center justify-center gap-2 text-gray-500">
								<div className="w-full border-t"></div>
								<div className="w-fit text-nowrap whitespace-nowrap">{t("orLoginWith")}</div>
								<div className="w-full border-t"></div>
							</div>
							<div>
								<Button
									variant="outline"
									type="button"
									className="w-full font-semibold rounded-md text-md h-15 border-foreground/10 hover:bg-foreground/10 hover:text-foreground"
									onClick={handleMicrosoftLogin}
									disabled={isProcessing}
								>
									<Image
										src="/images/microsoft-logo.png"
										alt="Microsoft Logo"
										width="0"
										height="0"
										sizes="100vw"
										className="w-8 h-auto"
									/>
									&nbsp; {isProcessing ? t("loggingIn") : t("microsoftAccount")}
								</Button>
							</div>
						</form>
					</div>

					<div>
						<div className="flex items-center justify-center mb-4">
							{t("needHelp")}&nbsp;
							<Popover>
								<PopoverTrigger>
									<div className="text-blue-500 underline text-background">{t("contactSupport")}</div>
								</PopoverTrigger>
								<PopoverContent className="w-full">
									<b>
										{supportContact?.name} / {supportContact?.phone}
									</b>
								</PopoverContent>
							</Popover>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
