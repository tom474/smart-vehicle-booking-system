import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
	SheetClose,
} from "@/components/ui/sheet";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, MessageCircleQuestion, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { TripFeedbackData, createTripFeedback } from "@/apis/trip-feedback";
import Spinner from "@/components/spinner";
import { z } from "zod/v4";
import { getSupportContact, SupportContactSettingSchema } from "@/apis/settings";

export default function FeedbackSheet({
	tripId,
	tripInfo,
	feedback,
	setFeedback,
}: {
	tripId: string;
	tripInfo: React.ReactNode;
	feedback?: TripFeedbackData;
	setFeedback: (value: TripFeedbackData) => void;
}) {
	const t = useTranslations("RequesterTripDay.feedbackDialog");
	const isMobile = useIsMobile();

	return (
		<Sheet>
			<SheetTrigger asChild>
				{!feedback ? (
					<Button variant="default">{t("title")}</Button>
				) : (
					<Button variant="outline" className="border-success text-success hover:bg-success/10">
						{t("viewTitle")}
					</Button>
				)}
			</SheetTrigger>
			<SheetContent
				className={`[&>button]:hidden ${
					isMobile ? "z-200 max-w-screen sm:max-w-screen w-screen" : "max-w-xl sm:max-w-xl"
				}`}
			>
				<SheetHeader className="hidden">
					<SheetTitle>Feedback</SheetTitle>
					<SheetDescription>Please provide your feedback for the trip.</SheetDescription>
				</SheetHeader>
				<FeedbackContent tripId={tripId} tripInfo={tripInfo} feedback={feedback} setFeedback={setFeedback} />
			</SheetContent>
		</Sheet>
	);
}

function FeedbackSheetHeader() {
	const t = useTranslations("RequesterTripDay.feedbackDialog");

	return (
		<div className="flex items-center justify-between w-full">
			<SheetClose asChild>
				<Button variant="ghost" className="hover:bg-background hover:text-success hover:cursor-pointer">
					<ChevronLeft className="size-6" />
				</Button>
			</SheetClose>
			<div className="text-headline-3">{t("title")}</div>
			<div className="size-6"></div>
		</div>
	);
}

function FeedbackContent({
	tripId,
	tripInfo,
	feedback,
	setFeedback,
}: {
	tripId: string;
	tripInfo: React.ReactNode;
	feedback?: TripFeedbackData;
	setFeedback: (value: TripFeedbackData) => void;
}) {
	const t = useTranslations("RequesterTripDay.feedbackDialog");

	const [isProcessing, setIsProcessing] = useState(false);
	const [hover, setHover] = useState(0);
	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState("");

	useEffect(() => {
		if (feedback) {
			setRating(feedback.rating);
			setComment(feedback.comment || t("noComments"));
		}
	}, [feedback, t]);

	async function handleFeedback({ stars, comment }: { stars: number; comment: string }) {
		try {
			setIsProcessing(true);
			const feedback = await createTripFeedback({
				id: "",
				rating: stars,
				comment: comment || null,
				tripId: tripId,
				userId: "",
			});
			setFeedback(feedback);
			setIsProcessing(false);
			toast.success(t("toast.success"));
		} catch (error) {
			console.error("Error submitting feedback:", error);
			toast.error(t("toast.error"));
		}
	}

	return (
		<div className="flex flex-col justify-between h-full p-4">
			<FeedbackSheetHeader />

			<div className="flex-1 p-2 overflow-y-auto">
				{tripInfo}

				<div className="space-y-2">
					<div className="space-y-1">
						<h2 className="text-headline-2">{t("rateAndReview")}</h2>
						<p className="text-caption text-muted-foreground">{t("rateAndReviewDescription")}</p>
					</div>

					{/* Star Rating */}
					<div className="space-x-4">
						{[1, 2, 3, 4, 5].map((star) => (
							<button
								type="button"
								key={star}
								onClick={() => !feedback && setRating(star)}
								onMouseEnter={() => !feedback && setHover(star)}
								onMouseLeave={() => !feedback && setHover(0)}
								className={`focus:outline-none ${feedback ? "cursor-not-allowed" : ""}`}
								aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
								disabled={!!feedback}
							>
								<svg
									className={`size-10 transition-colors ${
										(hover || rating) >= star
											? "text-yellow-400 fill-yellow-400"
											: "text-gray-300 fill-gray-200"
									}`}
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.967c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.175 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.967a1 1 0 00-.364-1.118L2.049 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
								</svg>
							</button>
						))}
					</div>

					<Textarea
						className={`w-full h-40 p-2 border rounded-md ${feedback ? "bg-gray-100 cursor-not-allowed" : "bg-gray-50"}`}
						placeholder="Share your thoughts about the trip..."
						value={comment}
						onChange={(e) => !feedback && setComment(e.target.value)}
						disabled={!!feedback}
						readOnly={!!feedback}
					/>

					<div>
						<h2 className="mt-4 text-headline-2">{t("support")}</h2>
						<SupportButton />
					</div>
				</div>
			</div>

			{!feedback && (
				<Button
					variant="default"
					onClick={() => {
						handleFeedback({
							stars: rating,
							comment: comment, // Use state value here
						});
					}}
					disabled={isProcessing || rating === 0}
					className="gap-2"
				>
					{isProcessing && <Spinner />}
					{t("submitFeedback")}
				</Button>
			)}
		</div>
	);
}

function SupportButton() {
	const t = useTranslations("RequesterTripDay.supportDialog");
	const [supportContact, setSupportContact] = useState<z.infer<typeof SupportContactSettingSchema> | null>(null);

	useEffect(() => {
		const fetchSupportContact = async () => {
			try {
				const settings = await getSupportContact();
				setSupportContact(settings);
			} catch (error) {
				console.error(error);
			}
		};

		fetchSupportContact();
	}, []);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" className="flex items-center justify-between w-full p-2 mt-2 text-md">
					<div className="flex items-center gap-4">
						<MessageCircleQuestion className="size-6" />
						<span>{t("title")}</span>
					</div>
					<ChevronRight className="size-6" />
				</Button>
			</DialogTrigger>
			<DialogContent className="p-4 z-300">
				<DialogHeader>
					<DialogTitle>{t("header")}</DialogTitle>
					<DialogDescription>
						{supportContact?.name} / {supportContact?.phone}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="default"
						className="w-full text-white bg-success hover:bg-success/90"
						onClick={() => {
							window.location.href = `tel:${supportContact?.phone}`;
						}}
					>
						{t("callNow")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
