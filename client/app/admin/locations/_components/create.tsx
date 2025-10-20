import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, MapPinHouse, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	type CreateLocationData,
	CreateLocationSchema,
	createLocation,
	type LocationData,
	type UpdateLocationData,
	updateLocation,
} from "@/apis/location";
import FieldSeparator from "@/components/form-field/field-separator";
import TextInputField from "@/components/form-field/input";
import TextAreaField from "@/components/form-field/text-area";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { apiErrHandler } from "@/lib/error-handling";

interface Props {
	defaultValue?: LocationData;
}

function CreateLocation({ defaultValue }: Props) {
	const router = useRouter();
	const t = useTranslations("Admin.location.form");
	const tToast = useTranslations("Admin.location.toast");

	const form = useForm<CreateLocationData>({
		resolver: zodResolver(CreateLocationSchema),
		defaultValues: {
			...defaultValue,
			type: "fixed",
		},
	});

	function onCreateSubmit(values: CreateLocationData) {
		form.reset();
		toast.promise(createLocation(values), {
			loading: tToast("create.loading"),
			success: () => {
				router.refresh();
				return tToast("create.success");
			},
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return tToast("create.error");
			},
		});
	}

	function onEditSubmit(values: UpdateLocationData) {
		if (!defaultValue) return;

		form.reset();
		toast.promise(updateLocation(defaultValue.id, values), {
			loading: tToast("update.loading"),
			success: () => {
				router.refresh();
				return tToast("update.success");
			},
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return tToast("update.error");
			},
		});
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => {
					if (defaultValue) {
						form.handleSubmit(onEditSubmit)(e);
					} else {
						form.handleSubmit(onCreateSubmit)(e);
					}
				}}
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
								placeholder={t("namePlaceholder")}
								icon={MapPinHouse}
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
								placeholder={t("addressPlaceholder")}
								icon={MapPin}
							/>
						)}
					/>

					<FormField
						control={form.control}
						name="latitude"
						render={({ field }) => (
							<TextInputField
								{...field}
								type="number"
								step="any"
								name="latitude"
								placeholder={t("latitudePlaceholder")}
								onChange={(e) =>
									field.onChange(parseFloat(e.target.value))
								}
								className="[&::-webkit-inner-spin-button]:appearance-none
                                [&::-webkit-outer-spin-button]:appearance-none
                                [appearance:textfield]"
								variant="dropdown"
								icon={Navigation}
								label="Latitude"
							/>
						)}
					/>

					<FormField
						control={form.control}
						name="longitude"
						render={({ field }) => (
							<TextInputField
								{...field}
								type="number"
								step="any"
								name="longitude"
								placeholder={t("longitudePlaceholder")}
								onChange={(e) =>
									field.onChange(parseFloat(e.target.value))
								}
								className="[&::-webkit-inner-spin-button]:appearance-none
                                [&::-webkit-outer-spin-button]:appearance-none
                                [appearance:textfield]"
								variant="dropdown"
								icon={Navigation}
								label="Latitude"
							/>
						)}
					/>
				</FieldSeparator>

				<div className="flex items-end h-full">
					<Button
						className="w-full"
						type="submit"
						variant="secondary"
					>
						{defaultValue ? t("updateButton") : t("createButton")}
					</Button>
				</div>
			</form>
		</Form>
	);
}

export default CreateLocation;
