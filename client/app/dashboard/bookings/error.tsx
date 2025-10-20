"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
}

function ErrorPage({ error, reset }: ErrorProps) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="flex flex-col size-full items-center justify-center gap-2">
			<h2 className="text-headline-2 text-destructive">
				Uh oh! Somthing went wrong!
			</h2>
			<p className="text-body-1">{error.message}</p>
			<Button onClick={() => reset()}>Try again</Button>
		</div>
	);
}

export default ErrorPage;
