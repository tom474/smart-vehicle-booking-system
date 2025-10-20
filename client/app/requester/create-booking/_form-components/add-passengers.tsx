import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRound, ChevronLeft, Search, Dot } from "lucide-react";
import { UserData } from "@/apis/user";
import { useTranslations } from "next-intl";

interface AddPassengersProps {
	users: UserData[];
	currentUser: UserData;
	onAddPassengers: (selectedPassengers: UserData[], passengerIds: number[] | string[]) => void;
	passengerCount: number;
	initialSelectedPassengers: UserData[];
	onLoadMore: (searchQuery?: string) => void;
	onSearch: (searchQuery: string) => void;
	hasNextPage: boolean;
	isLoading: boolean;
	disabled?: boolean;
}

export default function AddPassengers({
	users,
	currentUser,
	onAddPassengers,
	passengerCount,
	initialSelectedPassengers,
	onLoadMore,
	onSearch,
	hasNextPage,
	isLoading,
	disabled,
}: AddPassengersProps) {
	const t = useTranslations("RequesterBookings.bookingForm.form.passengers");
	const [selectedPassengers, setSelectedPassengers] = useState<UserData[]>(initialSelectedPassengers);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
	const scrollContainerRef = useRef<HTMLDivElement>(null);

	// Update selected passengers when initial data changes
	useEffect(() => {
		setSelectedPassengers(initialSelectedPassengers);
	}, [initialSelectedPassengers]);

	// Filter out already selected passengers from available users
	const availableUsers = users.filter((user) => !selectedPassengers.some((selected) => selected.id === user.id));

	const isMeSelected = selectedPassengers.some((p) => p.id === currentUser.id);

	// Debounced search function
	const debouncedSearch = useCallback(
		(query: string) => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}

			const timeout = setTimeout(() => {
				onSearch(query);
			}, 300); // 300ms delay

			setSearchTimeout(timeout);
		},
		[searchTimeout, onSearch],
	);

	// Handle search input changes
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const query = e.target.value;
		setSearchQuery(query);

		// Debounce the search
		debouncedSearch(query);
	};

	// Clean up timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeout) {
				clearTimeout(searchTimeout);
			}
		};
	}, [searchTimeout]);

	const handleSelectPassenger = (passenger: UserData) => {
		if (selectedPassengers.length < passengerCount) {
			setSelectedPassengers((prev) => [...prev, passenger]);
		}
	};

	const handleRemovePassenger = (passengerToRemove: UserData) => {
		setSelectedPassengers((prev) => prev.filter((p) => p.id !== passengerToRemove.id));
	};

	const handleAddMe = () => {
		if (!isMeSelected) {
			setSelectedPassengers((prev) => [currentUser, ...prev]);
		}
	};

	const handleConfirm = () => {
		const passengerIds = selectedPassengers.map((passenger) => passenger.id);
		const sanitizedPassengers = selectedPassengers.map((passenger) => ({
			...passenger,
			id: passenger.id.toString(),
			avatar: passenger.profileImageUrl || "",
		}));
		onAddPassengers(sanitizedPassengers, passengerIds);
	};

	const handleScroll = useCallback(() => {
		if (!scrollContainerRef.current || isLoading || !hasNextPage) return;

		const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
		if (scrollTop + clientHeight >= scrollHeight - 5) {
			onLoadMore(searchQuery);
		}
	}, [onLoadMore, isLoading, hasNextPage, searchQuery]);

	useEffect(() => {
		const scrollContainer = scrollContainerRef.current;
		if (scrollContainer) {
			scrollContainer.addEventListener("scroll", handleScroll);
			return () => scrollContainer.removeEventListener("scroll", handleScroll);
		}
	}, [handleScroll]);

	return (
		<div className="flex flex-col h-full max-h-screen gap-4 p-4">
			<div className="flex flex-col flex-1 min-h-0 space-y-4">
				<div className="flex flex-row items-center justify-between">
					<SheetClose asChild>
						<Button variant="ghost" className="hover:bg-background hover:text-success hover:cursor-pointer">
							<ChevronLeft className="size-6" />
						</Button>
					</SheetClose>
					<h3 className="text-lg font-semibold">{t("sheetTitle")}</h3>
					<div className="size-6"></div>
				</div>

				{/* Add Me button if not selected */}
				{!isMeSelected && (
					<div className="p-3 border rounded-lg bg-blue-50">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Avatar>
									<AvatarImage src={currentUser.profileImageUrl ?? undefined} />
									<AvatarFallback>
										<UserRound />
									</AvatarFallback>
								</Avatar>
								<div>
									<p className="font-medium">{currentUser.name}</p>
									<p className="text-sm text-muted-foreground">
										{currentUser.email && currentUser.email}
										<Dot className="inline" />
										{currentUser.phoneNumber && currentUser.phoneNumber}
									</p>
								</div>
							</div>
							<Button
								size="sm"
								onClick={handleAddMe}
								disabled={selectedPassengers.length >= passengerCount || disabled}
							>
								{t("addMe")}
							</Button>
						</div>
					</div>
				)}

				{/* Selected passengers */}
				{selectedPassengers.length > 0 && (
					<div className="space-y-2">
						<h4 className="font-medium">
							{t("selectedPassengers.title")} ({selectedPassengers.length}/{passengerCount})
						</h4>
						{selectedPassengers.map((passenger) => (
							<div
								key={passenger.id}
								className="flex items-center justify-between p-2 rounded bg-gray-50"
							>
								<div className="flex items-center gap-2">
									<Avatar>
										<AvatarImage src={passenger.profileImageUrl ?? undefined} />
										<AvatarFallback>
											<UserRound />
										</AvatarFallback>
									</Avatar>
									<div>
										<p className="font-medium">{passenger.name}</p>
										<p className="text-sm text-muted-foreground">
											{passenger.email && passenger.email}
											<Dot className="inline" />
											{passenger.phoneNumber && passenger.phoneNumber}
										</p>
									</div>
								</div>
								<Button
									size="sm"
									variant="outline"
									onClick={() => handleRemovePassenger(passenger)}
									disabled={disabled}
								>
									{t("selectedPassengers.remove")}
								</Button>
							</div>
						))}
					</div>
				)}

				{/* Search field and Available users list */}
				<div className="mb-2 font-medium text-headline-3">{t("availablePassengers.title")}</div>

				{/* Search field */}
				<div className="relative">
					<Search className="absolute transform -translate-y-1/2 left-3 top-1/2 text-muted-foreground size-4" />
					<Input
						type="text"
						placeholder={t("availablePassengers.searchPassengers")}
						value={searchQuery}
						onChange={handleSearchChange}
						className="pl-10"
					/>
				</div>
				<div className="flex flex-col flex-1 min-h-0 gap-2">
					{/* Available users list */}
					<div ref={scrollContainerRef} className="flex-1 space-y-2 overflow-y-auto">
						{availableUsers.length > 0 ? (
							<>
								{availableUsers.map((user) => (
									<div key={user.id} className="flex items-center justify-between p-2 border rounded">
										<div className="flex items-center gap-2">
											<Avatar>
												<AvatarImage src={user.profileImageUrl || undefined} />
												<AvatarFallback>
													<UserRound />
												</AvatarFallback>
											</Avatar>
											<div>
												<p className="font-medium">{user.name}</p>
												<p className="text-sm text-muted-foreground">
													{user.email && user.email}
													{user.phoneNumber && (
														<>
															<Dot className="inline" />
															{user.phoneNumber}
														</>
													)}
												</p>
											</div>
										</div>
										<Button
											size="sm"
											onClick={() => handleSelectPassenger(user)}
											disabled={selectedPassengers.length >= passengerCount || disabled}
										>
											{t("availablePassengers.add")}
										</Button>
									</div>
								))}
								{/* Loading indicator */}
								{isLoading && (
									<div className="flex justify-center py-4">
										<div className="text-sm text-muted-foreground">{t("loadingMoreUsers")}</div>
									</div>
								)}
								{/* End of list indicator */}
								{!hasNextPage && !searchQuery && (
									<div className="flex justify-center py-4">
										<div className="text-sm text-muted-foreground">{t("noMoreUsersToLoad")}</div>
									</div>
								)}
							</>
						) : (
							<div className="flex justify-center py-4">
								<div className="text-sm text-muted-foreground">
									{searchQuery ? `${t("noUsersFoundFor")} "${searchQuery}"` : t("noUsersAvailable")}
								</div>
							</div>
						)}
					</div>
				</div>

				{availableUsers.length === 0 && selectedPassengers.length > 0 && !searchQuery && (
					<p className="py-4 text-sm text-center text-muted-foreground">
						{t("availablePassengers.allSelected")}
					</p>
				)}
			</div>

			<div className="space-y-4">
				{/* Total count display */}
				<div className="p-3 border rounded-lg bg-gray-50">
					<p className="font-medium">
						{t("totalPassengers.title")}: {selectedPassengers.length}{" "}
					</p>
					<p className="text-sm text-muted-foreground">
						{selectedPassengers.length} {t("totalPassengers.registeredUsers")} +{" "}
						{passengerCount - selectedPassengers.length} {t("totalPassengers.externalPassengers")}
					</p>
				</div>

				{/* Confirm button */}
				<SheetClose asChild>
					<Button onClick={handleConfirm} className="w-full" disabled={disabled}>
						{t("totalPassengers.confirmSelection")} ({selectedPassengers.length}{" "}
						{t("totalPassengers.passengers")})
					</Button>
				</SheetClose>
			</div>
		</div>
	);
}
