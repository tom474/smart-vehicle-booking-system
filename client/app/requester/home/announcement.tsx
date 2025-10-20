import { useTranslations } from "next-intl";

export default function Announcement() {
	const t = useTranslations("RequesterHome.tabs");

	return (
		<div className="h-full p-4 pt-2 overflow-hidden">
			<h1 className="ml-2 text-headline-2">{t("announcements")}</h1>
			<div className="h-full min-h-0 pb-2 mt-2 mb-4 overflow-y-auto custom-scrollbar">
				<Announcements />
			</div>
		</div>
	);
}

// Demo announcement data
const announcements = [
	{
		id: 1,
		title: "System Maintenance Notice",
		description:
			"Scheduled maintenance will occur on Sunday from 2:00 AM to 4:00 AM. Some services may be temporarily unavailable.",
		type: "success" as const,
	},
	{
		id: 2,
		title: "New Feature Available",
		description: "We've introduced a new dashboard feature that allows better tracking of your progress.",
		type: "warning" as const,
	},
	{
		id: 3,
		title: "Security Update",
		description: "Please update your password to comply with our new security requirements.",
		type: "warning" as const,
	},
	{
		id: 4,
		title: "Holiday Schedule",
		description:
			"Office hours will be modified during the upcoming holiday period. Check the calendar for details.",
		type: "warning" as const,
	},
	{
		id: 5,
		title: "Training Session",
		description: "Join our upcoming training session on new platform features next Friday at 10:00 AM.",
		type: "warning" as const,
	},
	{
		id: 6,
		title: "Feedback Request",
		description: "We value your feedback! Please take a moment to fill out our user satisfaction survey.",
		type: "warning" as const,
	},
	{
		id: 7,
		title: "System Upgrade",
		description: "A system upgrade is scheduled for next week. Expect improved performance and new features.",
		type: "success" as const,
	},
	{
		id: 8,
		title: "Bug Fixes",
		description: "Recent bug fixes have been deployed. Please report any issues you encounter.",
		type: "success" as const,
	},
];

function Announcements() {
	return (
		<>
			{announcements.map((announcement) => (
				<div key={announcement.id} className="flex flex-row gap-4 p-3">
					<div className={`w-1.5 bg-${announcement.type} rounded-tr-md rounded-br-md`}></div>
					<div className="space-y-2">
						<div className="text-subtitle-1">
							<span>{announcement.title}</span>
						</div>
						<div className="text-body-2 text-muted-foreground">{announcement.description}</div>
					</div>
				</div>
			))}
		</>
	);
}
