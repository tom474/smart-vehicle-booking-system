import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
	const sasUrl = req.nextUrl.searchParams.get("sas");
	if (!sasUrl) return new Response("Missing URL", { status: 400 });

	const res = await fetch(sasUrl);
	if (!res.ok) return new Response("Failed to fetch blob", { status: 500 });

	const buffer = await res.arrayBuffer();

	return new Response(buffer, {
		headers: {
			"Content-Type": res.headers.get("content-type") ?? "image/jpeg",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
