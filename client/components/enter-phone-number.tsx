import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserData } from "@/apis/user";
import { useTranslations } from "next-intl";
import { updateUser } from "@/apis/user";
import { vietnamesePhoneRegex } from "@/lib/utils";

export default function EnterPhoneNumberDialog({ userCookie }: { userCookie: UserData }) {
	const t = useTranslations("Login.enterPhoneNumber");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [validationError, setValidationError] = useState<string | null>(null);

	const validatePhoneNumber = (phone: string): boolean => {
		if (!phone.trim()) {
			setValidationError(t("validationRequired"));
			return false;
		}

		if (!vietnamesePhoneRegex.test(phone)) {
			setValidationError(t("invalidFormat"));
			return false;
		}

		setValidationError(null);
		return true;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate phone number before submission
		console.log(validatePhoneNumber(phoneNumber));
		if (!validatePhoneNumber(phoneNumber)) {
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			const updatedUser = {
				name: userCookie.name,
				email: userCookie.email,
				phoneNumber: phoneNumber,
				profileImageUrl: userCookie.profileImageUrl,
				roleId: userCookie.roleId,
			};

			const response = await updateUser(userCookie.id, updatedUser);
			const userString = JSON.stringify(response);
			const encodedUserString = encodeURIComponent(userString);
			document.cookie = `user=${encodedUserString}; path=/; secure; samesite=strict`;
			// Refresh the page after successful submission
			window.location.reload();
		} catch (err) {
			setError(err instanceof Error ? err.message : "An unexpected error occurred");
		} finally {
			setIsSubmitting(false);
		}
	};

	const isFormValid = phoneNumber.trim() && !validationError;

	return (
		<Dialog open={true} onOpenChange={() => {}}>
			<DialogContent
				className="[&>button]:hidden sm:max-w-[425px]"
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>{t("title")}</DialogTitle>
					<DialogDescription>{t("description")}</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="phone">{t("phoneNumber")}</Label>
						<Input
							id="phone"
							type="tel"
							value={phoneNumber}
							onChange={(e) => {
								const value = e.target.value;
								setPhoneNumber(value);
								validatePhoneNumber(value);
							}}
							// onBlur={() => validatePhoneNumber(phoneNumber)}
							required
							placeholder="e.g., 0901234567 or +84901234567"
							disabled={isSubmitting}
							className={validationError ? "border-red-500 focus:ring-red-500" : ""}
						/>
						{validationError && <p className="text-sm text-red-600">{validationError}</p>}
					</div>
					{error && <p className="text-sm text-red-600">{error}</p>}
					<Button type="submit" disabled={isSubmitting || !isFormValid} className="w-full">
						{isSubmitting ? t("submitting") : t("submit")}
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
