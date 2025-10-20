"use client";

import { atom, useAtom, useAtomValue } from "jotai";
import { useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useTranslations } from "next-intl";
import { apiErrHandler } from "@/lib/error-handling";

const alertDialogOpenAtom = atom(false);
const alertDialogTargetIdAtom = atom<string | undefined>(undefined);

const alertAtom = atom(null, (_, set, id: string) => {
	set(alertDialogTargetIdAtom, id);
	set(alertDialogOpenAtom, true);
});

function DeactivateUserAlertDialog() {
	const [alertDialogOpen, setAlertDialogOpen] = useAtom(alertDialogOpenAtom);
	const id = useAtomValue(alertDialogTargetIdAtom);

	const t = useTranslations("Admin.user.deactivateDialog");

	const formId = useId();

	// ----- Form
	const deactivateForm = useForm({});

	if (!id) {
		return;
	}

	const onDeactivationSubmit = (values: unknown) => {
		console.log("Cancel booking request action called", values);
		toast.promise(new Promise<void>(() => {}), {
			loading: "Suspending the account...",
			success: `User #${id} has been supended`,
			error: (e) => {
				const apiErr = apiErrHandler(e);
				if (apiErr) return apiErr;

				return `Could not suspended user #${id}, please try again later`;
			},
		});
		setAlertDialogOpen(false);
	};

	return (
		<AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
			<AlertDialogContent>
				<AlertDialogHeader className="gap-4">
					<div>
						<AlertDialogTitle>{t("title")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("description")}
						</AlertDialogDescription>
					</div>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
					<Form {...deactivateForm}>
						<form
							onSubmit={deactivateForm.handleSubmit(
								onDeactivationSubmit,
							)}
						>
							<Button
								type="submit"
								form={formId}
								variant="destructive"
							>
								{t("confirm")}
							</Button>
						</form>
					</Form>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default DeactivateUserAlertDialog;
export { alertAtom };
