import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, MapPin, Phone, User, User2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	CreateVendorSchema,
	type CreateVendorSchemaData,
	createVendor,
	updateVendor,
	type VendorData,
} from "@/apis/vendor";
import FieldSeparator from "@/components/form-field/field-separator";
import TextInputField from "@/components/form-field/input";
import TextAreaField from "@/components/form-field/text-area";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { apiErrHandler } from "@/lib/error-handling";

interface Props {
	data?: VendorData;
}

export default function CreateUpdateVendorForm({ data }: Props) {
	const router = useRouter();
	const tt = useTranslations("Admin.vendor.toast");
	const tf = useTranslations("Admin.vendor.form");

	const form = useForm<CreateVendorSchemaData>({
		resolver: zodResolver(CreateVendorSchema),
		defaultValues: data,
	});

	const handleCreateFormSubmit = (data: CreateVendorSchemaData) => {
		toast.promise(createVendor(data), {
			loading: tt("create.loading"),
			success: () => {
				router.refresh();
				form.reset();
				return tt("create.success");
			},
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return tt("create.error");
			},
		});
	};

	const handleUpdateFormSubmit = (updatedData: CreateVendorSchemaData) => {
		if (!data) return;
		toast.promise(updateVendor(data.id, updatedData), {
			loading: tt("update.loading"),
			success: () => {
				router.refresh();
				return tt("update.success", { id: data.id });
			},
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return tt("update.error");
			},
		});
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(
					data ? handleUpdateFormSubmit : handleCreateFormSubmit,
				)}
				className="flex flex-col h-full"
			>
				<FieldSeparator>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<TextInputField
								{...field}
								name="name"
								placeholder={tf("namePlaceholder")}
								icon={User}
							/>
						)}
					/>

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<TextInputField
								{...field}
								type="email"
								name="email"
								placeholder={tf("emailPlaceholder")}
								icon={Mail}
							/>
						)}
					/>

					<FormField
						control={form.control}
						name="phoneNumber"
						render={({ field }) => (
							<TextInputField
								{...field}
								name="phoneNumber"
								placeholder={tf("phoneNumberPlaceholder")}
								icon={Phone}
							/>
						)}
					/>

					<FormField
						control={form.control}
						name="contactPerson"
						render={({ field }) => (
							<TextInputField
								{...field}
								name="contactPerson"
								placeholder={tf("contactPersonPlaceholder")}
								icon={User2}
							/>
						)}
					/>

					<FormField
						control={form.control}
						name="address"
						render={({ field }) => (
							<TextAreaField
								{...field}
								name="address"
								placeholder={tf("addressPlaceholder")}
								icon={MapPin}
							/>
						)}
					/>
				</FieldSeparator>
				<div className="flex items-end h-full">
					<Button
						className="w-full"
						type="submit"
						variant="secondary"
						disabled={form.formState.isSubmitting}
					>
						{data ? tf("updateButton") : tf("createButton")}
					</Button>
				</div>
			</form>
		</Form>
	);
}
