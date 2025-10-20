"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	ChevronDown,
} from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getSchedules, ScheduleData } from "@/apis/schedule";
import { format } from "date-fns";
import { getUserFromCookie } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

export default function Calendar() {
	const t = useTranslations("DriverCalendar");
	const locale = useLocale();
	const isMobile = useIsMobile();
	const [currentDate, setCurrentDate] = useState(new Date());
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [isCalendarCollapsed, setIsCalendarCollapsed] = useState(true);
	const [weekViewDate, setWeekViewDate] = useState(new Date()); // Track the week being viewed when collapsed

	const today = new Date();

	const currentMonth = currentDate.getMonth();
	const currentYear = currentDate.getFullYear();

	const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
	const firstDayOfCalendar = new Date(firstDayOfMonth);
	firstDayOfCalendar.setDate(
		firstDayOfCalendar.getDate() - firstDayOfCalendar.getDay(),
	);

	const [schedules, setSchedules] = useState<ScheduleData[]>([]);

	useEffect(() => {
		const fetchSchedules = async () => {
			try {
				const user = getUserFromCookie();
				if (!user) {
					console.error("User not found.");
					return;
				}
				// const data = await getSchedules({ driverId: user.id, limit: 100 });
				const data = await getSchedules({ limit: 100 });
				setSchedules(data);
			} catch (error) {
				console.error("Failed to fetch schedules:", error);
			}
		};

		fetchSchedules();
	}, []);

	const monthNames = [
		t("monthNames.january"),
		t("monthNames.february"),
		t("monthNames.march"),
		t("monthNames.april"),
		t("monthNames.may"),
		t("monthNames.june"),
		t("monthNames.july"),
		t("monthNames.august"),
		t("monthNames.september"),
		t("monthNames.october"),
		t("monthNames.november"),
		t("monthNames.december"),
	];

	const dayNames = [
		t("dayNames.sun"),
		t("dayNames.mon"),
		t("dayNames.tue"),
		t("dayNames.wed"),
		t("dayNames.thu"),
		t("dayNames.fri"),
		t("dayNames.sat"),
	];
	const shortDayNames = [
		t("shortDayNames.su"),
		t("shortDayNames.m"),
		t("shortDayNames.t"),
		t("shortDayNames.w"),
		t("shortDayNames.t"),
		t("shortDayNames.f"),
		t("shortDayNames.sa"),
	];

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function getLocaleDate(date: any, options = {}) {
		if (locale === "vn") {
			const newDate = date.toLocaleDateString("vi-VN", {
				...options,
			});
			return newDate.replace("tháng", "Tháng");
		} else {
			return date.toLocaleDateString("en-US", {
				...options,
			});
		}
	}

	function getDuration(event: ScheduleData) {
		const start = new Date(event.startTime);
		const end = new Date(event.endTime);
		const duration = Math.round(
			(end.getTime() - start.getTime()) / (1000 * 60),
		); // Duration in minutes

		if (duration < 60) {
			return `${duration}${t("duration.h")}`;
		}

		const hours = Math.floor(duration / 60);
		const minutes = duration % 60;

		return minutes === 0
			? `${hours}${t("duration.h")}`
			: `${hours}h ${minutes}${t("duration.m")}`;
	}

	function getEventColor(event: ScheduleData) {
		if (event.tripId) return "bg-blue-500";
		else if (event.vehicleService) return "bg-green-500";
		else if (event.leaveRequest) return "bg-yellow-500";
		return "bg-gray-500"; // Default color
	}

	function getEventType(event: ScheduleData) {
		if (event.tripId) return "Trip " + event.tripId;
		else if (event.vehicleService)
			return "Vehicle Service" + event.vehicleService;
		else if (event.leaveRequest)
			return "Leave Schedule" + event.leaveRequest;
		return "General Event"; // Default type
	}

	const formatDate = (date: Date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	const getEventsForDate = (date: Date) => {
		return schedules.filter((schedule) => {
			const scheduleDate = new Date(schedule.startTime);
			return (
				scheduleDate.getFullYear() === date.getFullYear() &&
				scheduleDate.getMonth() === date.getMonth() &&
				scheduleDate.getDate() === date.getDate()
			);
		});
	};

	const isToday = (date: Date) => {
		return formatDate(date) === formatDate(today);
	};

	const isSameMonth = (date: Date) => {
		if (isCalendarCollapsed) {
			// When collapsed, we want to show all days in the week regardless of month
			return true;
		}
		return date.getMonth() === currentMonth;
	};

	const isSelected = (date: Date) => {
		return selectedDate && formatDate(date) === formatDate(selectedDate);
	};

	const getCurrentWeekDays = () => {
		const days = [];
		// Use weekViewDate when collapsed for consistent week navigation
		const referenceDate = isCalendarCollapsed ? weekViewDate : today;
		const startOfWeek = new Date(referenceDate);
		startOfWeek.setDate(referenceDate.getDate() - referenceDate.getDay());

		for (let i = 0; i < 7; i++) {
			const date = new Date(startOfWeek);
			date.setDate(startOfWeek.getDate() + i);
			days.push(date);
		}

		return days;
	};

	const navigateWeek = (direction: "prev" | "next") => {
		if (isCalendarCollapsed) {
			// Navigate by week when collapsed
			const newDate = new Date(weekViewDate);
			newDate.setDate(
				weekViewDate.getDate() + (direction === "next" ? 7 : -7),
			);
			setWeekViewDate(newDate);
			// Update currentDate to reflect the month of the new week
			setCurrentDate(
				new Date(newDate.getFullYear(), newDate.getMonth(), 1),
			);
		} else {
			// Navigate by month when expanded
			setCurrentDate(
				new Date(
					currentYear,
					currentMonth + (direction === "next" ? 1 : -1),
					1,
				),
			);
			// Sync weekViewDate with the new month when navigating in expanded mode
			setWeekViewDate(
				new Date(
					currentYear,
					currentMonth + (direction === "next" ? 1 : -1),
					1,
				),
			);
		}
	};

	const navigateMonth = (direction: "prev" | "next") => {
		const newDate = new Date(
			currentYear,
			currentMonth + (direction === "next" ? 1 : -1),
			1,
		);
		setCurrentDate(newDate);
		// Reset weekViewDate to the first day of the new month
		setWeekViewDate(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
	};

	// Handle the collapse/expand toggle
	const handleToggleCollapsed = () => {
		if (!isCalendarCollapsed) {
			// When collapsing, set weekViewDate to today or current month's first day
			setWeekViewDate(new Date());
		}
		setIsCalendarCollapsed(!isCalendarCollapsed);
	};

	const renderMiniCalendar = () => {
		if (isCalendarCollapsed) {
			// Show only current week
			const weekDays = getCurrentWeekDays();

			return (
				<div className="grid grid-cols-7 gap-1">
					{shortDayNames.map((day, index) => (
						<div
							key={`day-${index}`}
							className="p-2 text-xs font-medium text-center text-muted-foreground"
						>
							{day}
						</div>
					))}
					{weekDays.map((date, index) => {
						const events = getEventsForDate(date);
						const hasEvents = events.length > 0;

						return (
							<div
								key={`week-${index}`}
								className={`
									h-10 flex flex-col items-center justify-center cursor-pointer transition-colors relative
									text-muted-foreground
									${isToday(date) ? "size-10 ml-1 bg-blue-500 text-white rounded-full" : ""}
									${isSelected(date) && !isToday(date) ? "bg-gray-100 rounded-full" : ""}
								`}
								onClick={() => {
									setSelectedDate(date);
									scrollToAgendaDate(date);
								}}
							>
								<span className="text-sm font-medium">
									{date.getDate()}
								</span>
								{hasEvents && !isToday(date) && (
									<div className="absolute w-1 h-1 bg-gray-400 rounded-full bottom-1"></div>
								)}
							</div>
						);
					})}
				</div>
			);
		}

		// Show full month
		const days = [];
		const startDate = new Date(firstDayOfCalendar);

		for (let i = 0; i < 42; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);
			const events = getEventsForDate(date);
			const hasEvents = events.length > 0;

			days.push(
				<div
					key={`month-${i}`}
					className={`
						h-10 flex flex-col items-center justify-center cursor-pointer transition-colors relative
						${!isSameMonth(date) ? "text-gray-300" : "text-gray-900"}
						${isToday(date) ? "size-10 ml-1 bg-blue-500 text-white rounded-full" : ""}
						${isSelected(date) && !isToday(date) ? "bg-gray-100 rounded-full" : ""}
					`}
					onClick={() => {
						setSelectedDate(date);
						scrollToAgendaDate(date);
					}}
				>
					<span className="text-sm font-medium">
						{date.getDate()}
					</span>
					{hasEvents && !isToday(date) && (
						<div className="absolute w-1 h-1 bg-gray-400 rounded-full bottom-1"></div>
					)}
				</div>,
			);
		}

		return (
			<div className="grid grid-cols-7 gap-1">
				{shortDayNames.map((day, index) => (
					<div
						key={`header-${index}`}
						className="p-2 text-xs font-medium text-center text-muted-foreground"
					>
						{day}
					</div>
				))}
				{days}
			</div>
		);
	};

	const getUpcomingEvents = () => {
		const events: { date: Date; events: ScheduleData[] }[] = [];

		// Check if schedules is defined and not empty
		if (!schedules || schedules.length === 0) {
			console.warn("Schedules array is undefined or empty.");
			return events; // Return an empty array if schedules is invalid
		}

		// Find the earliest date in schedules
		const earliestDate = schedules.reduce((earliest, schedule) => {
			if (!schedule.startTime) {
				console.error(
					"Schedule object is missing 'startTime'.",
					schedule,
				);
				return earliest; // Skip invalid schedule objects
			}
			const scheduleDate = new Date(schedule.startTime);
			return scheduleDate < earliest ? scheduleDate : earliest;
		}, new Date(schedules[0].startTime));

		// Find the latest date in schedules
		const latestDate = schedules.reduce((latest, schedule) => {
			if (!schedule.startTime) {
				console.error(
					"Schedule object is missing 'startTime'.",
					schedule,
				);
				return latest; // Skip invalid schedule objects
			}
			const scheduleDate = new Date(schedule.startTime);
			return scheduleDate > latest ? scheduleDate : latest;
		}, new Date(schedules[0].startTime));

		const startDate = new Date(earliestDate);

		// Calculate the number of days between startDate and latestDate
		const daysDifference = Math.ceil(
			(latestDate.getTime() - startDate.getTime()) /
				(1000 * 60 * 60 * 24),
		);

		for (let i = 0; i <= daysDifference; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);
			const dayEvents = getEventsForDate(date);

			if (dayEvents.length > 0) {
				events.push({
					date,
					events: dayEvents,
				});
			} else {
				events.push({
					date,
					events: [],
				});
			}
		}

		return events;
	};

	const agendaContainerRef = useRef<HTMLDivElement | null>(null);
	const todayRef = useRef<HTMLDivElement | null>(null);
	const agendaDateRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

	const scrollToAgendaDate = (date: Date) => {
		const key = formatDate(date);
		const el = agendaDateRefs.current[key];
		if (el && agendaContainerRef.current) {
			agendaContainerRef.current.scrollTo({
				top: el.offsetTop - agendaContainerRef.current.offsetTop,
				behavior: "smooth",
			});
		}
	};

	// Scroll to today's date when the component is first rendered
	useEffect(() => {
		const scrollToToday = () => {
			if (todayRef.current && agendaContainerRef.current) {
				const container = agendaContainerRef.current;
				const todayElement = todayRef.current;

				// Calculate the position of today's element relative to the container
				const containerTop = container.getBoundingClientRect().top;
				const todayTop = todayElement.getBoundingClientRect().top;

				// Scroll the container to bring today's element into view
				container.scrollTo({
					top: container.scrollTop + (todayTop - containerTop),
				});
				return true;
			}
			return false;
		};

		const interval = setInterval(() => {
			const scrolled = scrollToToday();
			if (scrolled) {
				clearInterval(interval);
			}
		}, 100);

		return () => clearInterval(interval);
	}, [todayRef, agendaContainerRef]);

	const renderAgendaView = () => {
		const upcomingEvents = getUpcomingEvents();

		return (
			<div className="space-y-6">
				{upcomingEvents.map(({ date, events }) => {
					const dateStr = getLocaleDate(date, {
						month: "long",
						day: "numeric",
					});
					const dayStr = getLocaleDate(date, {
						weekday: "long",
					});

					// Check if the current date is today
					const isToday =
						new Date().toDateString() === date.toDateString();

					return (
						<div
							key={formatDate(date)}
							ref={
								isToday
									? todayRef
									: (el) => {
											agendaDateRefs.current[
												formatDate(date)
											] = el;
										}
							}
						>
							<div className="flex flex-row items-end gap-4 mb-3">
								<h3 className="text-lg font-semibold">
									{dateStr}
								</h3>
								<p className="mb-0.5 text-sm text-muted-foreground">
									{dayStr}
								</p>
							</div>

							{events.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									{t("noEvents")}
								</p>
							) : (
								<div className="space-y-4">
									{events.map((event) => (
										<div
											key={event.id}
											className="flex items-start gap-3"
										>
											<div className="flex flex-col flex-shrink-0 w-16 text-sm">
												<span>
													{format(
														event.startTime,
														"HH:mm",
													)}
												</span>
												<span className="text-xs text-muted-foreground">
													{getDuration(event)}
												</span>
											</div>
											<div className="flex-1 pl-3 border-l-2 border-gray-300">
												<p className="text-body-1">
													{event.title}
												</p>
												{event.description && (
													<p className="text-caption text-muted-foreground">
														{event.description}
													</p>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					);
				})}
			</div>
		);
	};

	const renderCalendarGrid = () => {
		const days = [];
		const startDate = new Date(firstDayOfCalendar);

		for (let i = 0; i < 42; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);
			const events = getEventsForDate(date);

			days.push(
				<div
					key={i}
					className={`
                        min-h-24 border border-gray-200 p-1 cursor-pointer hover:bg-gray-50 transition-colors
                        ${!isSameMonth(date) ? "bg-gray-50 text-muted-foreground" : ""}
                        ${isSelected(date) ? "ring-2 ring-blue-500" : ""}
                    `}
					onClick={() => setSelectedDate(date)}
				>
					<div
						className={`
                        text-sm font-medium mb-1 
                        ${isToday(date) ? "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center" : ""}
                    `}
					>
						{date.getDate()}
					</div>
					<div className="space-y-1">
						{events.slice(0, 3).map((event) => (
							<div
								key={event.id}
								className={`${getEventColor(event)} text-white text-xs p-1 rounded truncate`}
								title={`${event.title} - ${format(event.startTime, "HH:mm")}`}
							>
								{event.title}
							</div>
						))}
						{events.length > 3 && (
							<div className="text-xs text-muted-foreground">
								+{events.length - 3} {t("more")}
							</div>
						)}
					</div>
				</div>,
			);
		}

		return days;
	};

	const renderEventsList = () => {
		if (!selectedDate) return null;

		const events = getEventsForDate(selectedDate);

		return (
			<div className="flex-shrink-0 ml-6 w-80">
				<div className="p-4 bg-white border rounded-lg">
					<h3 className="mb-4 text-lg font-semibold">
						{getLocaleDate(selectedDate, {
							weekday: "long",
							year: "numeric",
							month: "long",
							day: "numeric",
						})}
					</h3>
					{events.length === 0 ? (
						<p className="text-muted-foreground">{t("noEvents")}</p>
					) : (
						<div className="space-y-3">
							{events.map((event) => (
								<div
									key={event.id}
									className="py-2 pl-3 border-l-4 border-blue-500"
								>
									<h4 className="font-medium">
										{event.title}
									</h4>
									<p className="text-sm text-muted-foreground">
										{format(event.startTime, "HH:mm")} •{" "}
										{getDuration(event)}
									</p>
									<span
										className={`inline-block px-2 py-1 text-xs rounded-full text-white ${getEventColor(event)} mt-1`}
									>
										{getEventType(event)}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		);
	};

	if (isMobile) {
		return (
			<div className="h-screen p-4 overflow-hidden">
				{/* Mini Calendar */}
				<div className="p-4 mb-2 bg-white rounded-lg">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => navigateWeek("prev")}
							>
								<ChevronLeft className="w-4 h-4" />
							</Button>
							<h2 className="text-lg font-semibold">
								{monthNames[currentMonth]} {currentYear}
							</h2>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => navigateWeek("next")}
							>
								<ChevronRight className="w-4 h-4" />
							</Button>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleToggleCollapsed}
						>
							{isCalendarCollapsed ? (
								<ChevronDown className="w-4 h-4" />
							) : (
								<ChevronUp className="w-4 h-4" />
							)}
						</Button>
					</div>

					{renderMiniCalendar()}
				</div>

				{/* Agenda View */}
				<div
					ref={agendaContainerRef}
					className="h-full p-4 bg-white rounded-lg overflow-y-auto pb-70"
				>
					{renderAgendaView()}
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 mx-auto max-w-7xl">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-4">
					<Button
						variant="ghost"
						onClick={() => navigateMonth("prev")}
					>
						<ChevronLeft className="w-5 h-5" />
					</Button>
					<h1 className="text-2xl font-semibold">
						{monthNames[currentMonth]} {currentYear}
					</h1>
					<Button
						variant="ghost"
						onClick={() => navigateMonth("next")}
					>
						<ChevronRight className="w-5 h-5" />
					</Button>
				</div>
			</div>

			<div className="flex gap-6">
				<div className="flex-1">
					<div className="overflow-hidden bg-white border rounded-lg">
						<div className="grid grid-cols-7 bg-gray-50">
							{dayNames.map((day) => (
								<div
									key={day}
									className="p-4 font-medium text-center text-muted-foreground"
								>
									{day}
								</div>
							))}
						</div>
						<div className="grid grid-cols-7">
							{renderCalendarGrid()}
						</div>
					</div>
				</div>

				{renderEventsList()}
			</div>
		</div>
	);
}
