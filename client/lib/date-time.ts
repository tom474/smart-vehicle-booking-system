export function formatLocalDateTime(date: Date): string {
	// Subtract 7 hours for demo
	const adjustedDate = new Date(date.getTime() - 7 * 60 * 60 * 1000);
	const pad = (n: number) => n.toString().padStart(2, "0");
	return `${adjustedDate.getFullYear()}-${pad(adjustedDate.getMonth() + 1)}-${pad(adjustedDate.getDate())}T${pad(adjustedDate.getHours())}:${pad(adjustedDate.getMinutes())}:${pad(adjustedDate.getSeconds())}Z`;
}
