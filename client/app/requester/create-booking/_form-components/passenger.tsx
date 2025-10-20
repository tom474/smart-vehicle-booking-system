import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, UserRound, UsersRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import { AvatarStack } from "@/components/avatar-stack";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import AddPassengers from "@/app/requester/create-booking/_form-components/add-passengers";
import { UseFormReturn } from "react-hook-form";
import { BookingRequestData } from "@/apis/booking-request";
import { UserData, getUsers } from "@/apis/user";
import { useTranslations } from "next-intl";
import { getUserFromCookie } from "@/lib/utils";

export default function PassengerSection({
	form,
	disabled = false,
	mobile = false,
	coordinator = false,
}: {
	form: UseFormReturn<BookingRequestData>;
	disabled?: boolean;
	mobile?: boolean;
	coordinator?: boolean;
}) {
	const t = useTranslations("RequesterBookings.bookingForm.form.passengers");
	const [hasAddedPassengers, setHasAddedPassengers] = useState(true);
	const [passengerList, setPassengerList] = useState<UserData[]>([]);
	const [users, setUsers] = useState<UserData[]>([]);
	const [meUser, setMeUser] = useState<UserData | null>(null);
	const [hasNextPage, setHasNextPage] = useState(true);
	const [isLoading, setIsLoading] = useState(false);

	// get users from API with search functionality
	const fetchUsers = async (page: number = 1, reset: boolean = false, searchTerm?: string) => {
		try {
			setIsLoading(true);
			const currentUserFromCookie = getUserFromCookie() as UserData;
			setMeUser(currentUserFromCookie);

			let fetchedUsers: UserData[] = [];

			if (searchTerm && searchTerm.trim() !== "") {
				// Search across name, email, and phone number
				const [nameResults, emailResults, phoneResults] = await Promise.all([
					getUsers({
						page: page,
						limit: 10,
						searchField: "name",
						searchValue: searchTerm.trim(),
					}),
					getUsers({
						page: page,
						limit: 10,
						searchField: "email",
						searchValue: searchTerm.trim(),
					}),
					getUsers({
						page: page,
						limit: 10,
						searchField: "phoneNumber",
						searchValue: searchTerm.trim(),
					}),
				]);

				// Combine and deduplicate results
				const combinedResults = [...nameResults, ...emailResults, ...phoneResults];
				fetchedUsers = combinedResults
					.filter((user, index, self) => index === self.findIndex((u) => u.id === user.id))
					.slice(0, 15); // Limit to 15 results
				// add "Me" user to the top of the list if not already present
				if (currentUserFromCookie && !fetchedUsers.some((user) => user.id === currentUserFromCookie.id)) {
					fetchedUsers.unshift(currentUserFromCookie);
				}
			} else {
				// No search term, get all users
				fetchedUsers = await getUsers({ page: page, limit: 15 });
				// add "Me" user to the top of the list if not already present
				if (currentUserFromCookie && !fetchedUsers.some((user) => user.id === currentUserFromCookie.id)) {
					fetchedUsers.unshift(currentUserFromCookie);
				}
			}

			// remove "Me" user from the list
			const filteredUsers = meUser ? fetchedUsers.filter((user) => user.id !== meUser.id) : fetchedUsers;

			if (reset) {
				setUsers(filteredUsers);
			} else {
				setUsers((prev) => [...prev, ...filteredUsers]);
			}

			// Check if there are more users to load
			setHasNextPage(filteredUsers.length === 15);

			// Only initialize selected passengers on initial load (no search term)
			if (page === 1 && !searchTerm && passengerList.length === 0) {
				const passengerIds = form.getValues("passengerIds");
				if (passengerIds && passengerIds.length > 0) {
					const selectedPassengers = filteredUsers.filter((user) => passengerIds.includes(user.id));

					if (meUser && !selectedPassengers.some((p) => p.id === meUser.id)) {
						selectedPassengers.unshift(meUser);
					}

					setPassengerList(selectedPassengers);
					setHasAddedPassengers(selectedPassengers.length > 0);
				} else {
					setPassengerList(meUser ? [meUser] : []);
					setHasAddedPassengers(true);
				}
			}
		} catch (error) {
			console.error("Failed to fetch users:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers(1, true);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [form]);

	const handleAddPassengers = (selectedPassengers: UserData[], passengerIds: number[] | string[]) => {
		setPassengerList(selectedPassengers);
		setHasAddedPassengers(selectedPassengers.length > 0);

		// Update the form's passengers field with the IDs
		form.setValue(
			"passengerIds",
			passengerIds.map((id) => id.toString()),
		);
	};

	return (
		<>
			<FormField
				control={form.control}
				name="numberOfPassengers"
				render={({ field }) => (
					<FormItem>
						<FormControl>
							<div className="flex justify-between p-1">
								<div className="flex flex-row items-center gap-2 text-subtitle-1">
									<UserRound />
									{t("numberOfPassengers")}
								</div>
								<div className="flex flex-row items-center gap-2">
									<Input
										type="number"
										inputMode="numeric"
										min={1}
										max={45}
										disabled={disabled}
										className={`w-15 p-0 m-0 md:text-md text-center ${
											disabled ? "opacity-60 cursor-not-allowed" : ""
										}`}
										{...field}
										value={field.value || 1} // Ensure value is never undefined
										onFocus={(e) => e.target.select()} // Select all text when focused
										onChange={(e) => {
											const newCount = parseInt(e.target.value) || 1;

											// Update form field with number value
											field.onChange(newCount);

											if (newCount <= 1) {
												setPassengerList(meUser ? [meUser] : []);
												setHasAddedPassengers(true);
												// Update form with just "me" ID
												form.setValue("passengerIds", [meUser ? meUser.id : ""]);
											} else if (newCount < passengerList.length) {
												// Trim passenger list if count is reduced, but keep "Me" if present
												const meUser = passengerList.find((p) => p.name === "Me");
												const otherPassengers = passengerList.filter((p) => p.name !== "Me");

												let trimmedList = [];
												if (meUser) {
													trimmedList = [meUser, ...otherPassengers.slice(0, newCount - 1)];
												} else {
													trimmedList = otherPassengers.slice(0, newCount);
												}

												setPassengerList(trimmedList);
												setHasAddedPassengers(trimmedList.length > 0);

												// Update form with trimmed passenger IDs
												const trimmedIds = trimmedList.map((passenger) => passenger.id);
												form.setValue("passengerIds", trimmedIds);
											}
										}}
									/>
									<div className="text-md">{t("people")}</div>
								</div>
							</div>
						</FormControl>
					</FormItem>
				)}
			/>
			<Separator />

			<>
				<div className="flex justify-between p-1">
					<div className="flex flex-row items-center gap-2 text-subtitle-1">
						<UsersRound />
						{t("passengers")}
					</div>
					<Sheet>
						<SheetTrigger
							asChild
							className={`flex flex-row items-center ${disabled && !coordinator ? "pointer-events-none opacity-60" : ""}`}
							disabled={disabled && !coordinator}
						>
							{!hasAddedPassengers ? (
								<Button
									variant="ghost"
									className={`font-normal text-md text-muted-foreground hover:bg-background hover:underline hover:text-foreground ${
										disabled && !coordinator
											? "opacity-60 cursor-not-allowed hover:no-underline"
											: ""
									}`}
								>
									{t("availablePassengers.add")}{" "}
									{!disabled && <ChevronRight className="text-black" />}
								</Button>
							) : (
								<Button
									variant="ghost"
									className={`p-0 font-normal text-md text-muted-foreground hover:bg-background hover:underline hover:text-foreground ${
										disabled && !coordinator
											? "opacity-60 cursor-not-allowed hover:no-underline"
											: ""
									}`}
								>
									<AvatarStack
										avatars={passengerList.slice(0, form.watch("numberOfPassengers")).map((p) => ({
											src: p.profileImageUrl,
											name: p.name,
										}))}
										maxDisplay={2}
										size="md"
									/>
									{!disabled && t("availablePassengers.add")}{" "}
									{(!disabled || coordinator) && <ChevronRight className="text-black" />}
								</Button>
							)}
						</SheetTrigger>
						<SheetContent
							className={`[&>button]:hidden ${
								mobile ? "max-w-screen sm:max-w-screen w-screen" : "max-w-xl sm:max-w-xl w-xl"
							}`}
						>
							<SheetHeader className="hidden">
								<SheetTitle>Your Passengers</SheetTitle>
								<SheetDescription>Add passengers to your booking request.</SheetDescription>
							</SheetHeader>
							<AddPassengers
								users={users}
								currentUser={meUser ?? users[0]}
								onAddPassengers={handleAddPassengers}
								passengerCount={form.watch("numberOfPassengers")}
								initialSelectedPassengers={passengerList}
								onLoadMore={(searchQuery?: string) =>
									fetchUsers(Math.floor(users.length / 15) + 1, false, searchQuery)
								}
								onSearch={(searchQuery: string) => fetchUsers(1, true, searchQuery)}
								hasNextPage={hasNextPage}
								isLoading={isLoading}
								disabled={disabled}
							/>
						</SheetContent>
					</Sheet>
				</div>
				<Separator />
			</>
		</>
	);
}
