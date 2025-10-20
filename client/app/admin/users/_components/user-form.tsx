"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { atom } from "jotai";
import { Car, CheckCircle, Mail, Phone, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod/v4";
import { getUser, type UserData, UserSchema, updateUser } from "@/apis/user";
import Badge from "@/components/badge";
import FileUpload from "@/components/file-upload";
import FieldSeparator from "@/components/form-field/field-separator";
import TextInputField from "@/components/form-field/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import TextViewField, { Grid } from "@/components/ui/view-field";
import { mapRole } from "@/lib/utils";
import { apiErrHandler } from "@/lib/error-handling";

const sheetOpenAtom = atom<boolean>(false);
// const stateAtom = atom<SheetState>(SheetState.NONE);
const isFetchingAtom = atom<boolean>(false);
const errorAtom = atom<string | undefined>(undefined);
const userDataAtom = atom<UserData | undefined>(undefined);

const viewUserAtom = atom(null, async (_, set, id: string) => {
	set(sheetOpenAtom, true);
	set(isFetchingAtom, true);

	try {
		const user = await getUser(id);

		set(userDataAtom, user);
		set(isFetchingAtom, false);
	} catch (e) {
		set(errorAtom, String(e));
	}
});

interface UserViewerProps {
	user: UserData;
}

export function ViewUser({ user }: UserViewerProps) {
	const t = useTranslations("Admin.user");

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((word) => word[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "active":
				return <Badge variant="success">Active</Badge>;
			case "inactive":
				return <Badge variant="destructive">Inactive</Badge>;
			case "suspended":
				return <Badge variant="warning">Suspended</Badge>;
			default:
				return <Badge variant="destructive">Unknown</Badge>;
		}
	};

	return (
		<div className="w-full space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Avatar className="size-16">
						<AvatarImage
							src={user.profileImageUrl ?? undefined}
							alt={user.name}
						/>
						<AvatarFallback className="text-lg">
							{getInitials(user.name)}
						</AvatarFallback>
					</Avatar>
					<div>
						<h2 className="text-2xl font-semibold">{user.name}</h2>
						<p className="flex items-center gap-2 mt-1 text-muted-foreground">
							<Shield className="size-4" />
							{mapRole(user.roleId)}
						</p>
					</div>
				</div>
			</div>

			<FieldSeparator>
				<Grid>
					<TextViewField
						icon={Mail}
						title={t("email")}
						value={user.email}
						variant="dropdown"
					/>

					<TextViewField
						icon={Phone}
						title={t("phoneNumber")}
						value={user.phoneNumber}
						variant="dropdown"
					/>
				</Grid>

				<TextViewField
					icon={CheckCircle}
					title={t("status")}
					value={getStatusBadge(user.status)}
				/>

				{user.dedicatedVehicle && (
					<TextViewField
						icon={Car}
						title={t("dedicatedVehicle")}
						value={user.dedicatedVehicle}
					/>
				)}
			</FieldSeparator>
		</div>
	);
}

interface UserFormProps {
	defaultValues?: UserData;
}

function UserForm({ defaultValues }: UserFormProps) {
	const router = useRouter();
	const t = useTranslations("Admin.user.form");

	const updateUserSchema = z.object({
		...UserSchema.pick({
			name: true,
			email: true,
			phoneNumber: true,
			profileImageUrl: true,
			roleId: true,
		}).shape,
		avatar: z
			.any()
			.refine(
				(val) =>
					val instanceof File ||
					(val &&
						typeof val === "object" &&
						"url" in val &&
						"id" in val),
				"Receipt must be a file or file metadata",
			)
			.optional(),
	});

	type createUserData = z.infer<typeof updateUserSchema>;

	const form = useForm<createUserData>({
		resolver: zodResolver(updateUserSchema),
		defaultValues: {
			...defaultValues,
		},
	});

	const onEditSubmit = (values: createUserData) => {
		if (defaultValues) {
			console.log(JSON.stringify(values));
			const id = defaultValues.id;
			toast.promise(updateUser(id, values, values.avatar), {
				loading: "Editing the account...",
				success: () => {
					router.refresh();
					return `Account updated successfully`;
				},
				error: (e) => {
					const apiErr = apiErrHandler(e);
					if (apiErr) return apiErr;

					return `Could not update user #${id}, please try again later`;
				},
			});
		}
	};

	return (
		<Form {...form}>
			{/* <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8"> */}
			<form
				onSubmit={(e) => {
					e.preventDefault();
					form.handleSubmit(onEditSubmit)(e);
					console.log("Submited");
				}}
				className="flex flex-col gap-6 h-full"
			>
				<FieldSeparator>
					{/* Name Field */}
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<TextInputField
								{...field}
								icon={User}
								title={t("nameLabel")}
								placeholder={t("namePlaceholder")}
							/>
						)}
					/>

					{/* Email Field */}
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<TextInputField
								{...field}
								icon={Mail}
								title={t("emailLabel")}
								placeholder={t("emailPlaceholder")}
								type="email"
							/>
						)}
					/>

					{/* Pfp Field */}
					{/* <FormField */}
					{/*   control={form.control} */}
					{/*   name="profileImageUrl" */}
					{/*   render={({ field }) => ( */}
					{/*     <TextInputField */}
					{/*       {...field} */}
					{/*       value={field.value ?? undefined} */}
					{/*       icon={User} */}
					{/*       title={t("avatarLabel")} */}
					{/*       placeholder="Url" */}
					{/*     /> */}
					{/*   )} */}
					{/* /> */}

					{/* Profile Image */}
					<FormField
						control={form.control}
						name="avatar"
						render={() => (
							<FormItem>
								<div className="flex flex-col items-start w-full gap-2 p-1">
									<FormLabel className="flex h-full">
										<User />
										Avatar
									</FormLabel>
									<FormControl>
										<FileUpload
											initialImageUrl={
												defaultValues?.profileImageUrl ??
												undefined
											}
											onFileUpload={(files) => {
												if (files.length > 0) {
													console.log(
														"FILE: ",
														files[0].file,
													);
													form.setValue(
														"avatar",
														files[0].file,
														{
															shouldValidate: true,
														},
													);
												} else {
													form.setValue(
														"avatar",
														undefined,
														{
															shouldValidate: true,
														},
													);
												}
											}}
											className="w-full"
										/>
									</FormControl>
									<FormMessage />
								</div>
							</FormItem>
						)}
					/>

					{/* Phone Field */}
					<FormField
						control={form.control}
						name="phoneNumber"
						render={({ field }) => (
							<TextInputField
								{...field}
								icon={Phone}
								title={t("phoneLabel")}
								placeholder={t("phonePlaceholder")}
								type="tel"
								value={field.value ?? ""}
							/>
						)}
					/>

					{/* <FormField */}
					{/* 	control={form.control} */}
					{/* 	name="roleId" */}
					{/* 	render={({ field }) => ( */}
					{/* 		<FixedSelectorField */}
					{/* 			field={field} */}
					{/* 			label="Role" */}
					{/* 			placeholder="Select a role" */}
					{/* 			items={getRoleList().filter( */}
					{/* 				([roleId]) => roleId !== "ROL-3", // Driver role */}
					{/* 			)} */}
					{/* 			icon={Shield} */}
					{/* 		/> */}
					{/* 	)} */}
					{/* /> */}
				</FieldSeparator>

				<div className="flex h-full justify-end items-end">
					<Button
						className="w-full"
						type="submit"
						variant="secondary"
					>
						Update
					</Button>
				</div>
			</form>
		</Form>
	);
}

export { UserForm };
export { viewUserAtom };
