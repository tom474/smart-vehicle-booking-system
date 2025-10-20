import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

export default function StatusBadge({ status, noBorder }: { status: string; noBorder?: boolean }) {
	const t = useTranslations("Status");
	const [statusText, setStatusText] = useState("");

	const getStatusStyles = (status: string) => {
		if (status === "approved" || status === "scheduled") return "text-green-800 bg-green-100 border-green-800";
		else if (status === "pending" || status === "scheduling")
			return "text-yellow-800 bg-yellow-100 border-yellow-800";
		else if (status === "cancelled" || status === "denied" || status === "rejected")
			return "text-red-800 bg-red-100 border-red-800";
		else if (status === "completed" || status === "on_going") return "text-blue-800 bg-blue-100 border-blue-800";
	};

	useEffect(() => {
		switch (status) {
			case "approved":
				setStatusText(t("approved"));
				break;
			case "pending":
				setStatusText(t("pending"));
				break;
			case "cancelled":
				setStatusText(t("cancelled"));
				break;
			case "completed":
				setStatusText(t("completed"));
				break;
			case "scheduled":
				setStatusText(t("scheduled"));
				break;
			case "scheduling":
				setStatusText(t("scheduling"));
				break;
			case "on_going":
				setStatusText(t("onGoing"));
				break;
			case "denied":
				setStatusText(t("denied"));
			case "rejected":
				setStatusText(t("rejected"));
		}
	}, [status, t]);

	if (noBorder) {
		return (
			<div
				className={`${getStatusStyles(status)} border-none bg-transparent`}
				style={{ backgroundColor: "transparent" }}
			>
				{statusText}
			</div>
		);
	}

	return (
		<div className={`p-1 pl-4 pr-4 border rounded-full text-body-2 w-fit ${getStatusStyles(status)}`}>
			{statusText}
		</div>
	);
}
