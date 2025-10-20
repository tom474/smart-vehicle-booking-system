import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserRound } from "lucide-react";

interface AvatarStackProps {
	avatars: Array<{
		src?: string | null;
		name: string;
	}>;
	maxDisplay?: number;
	size?: "sm" | "md" | "lg";
}

export function AvatarStack({ avatars, maxDisplay = 4, size = "md" }: AvatarStackProps) {
	const displayAvatars = avatars.slice(0, maxDisplay);
	const remainingCount = avatars.length - maxDisplay;

	const sizeClasses = {
		sm: "w-6 h-6",
		md: "w-8 h-8",
		lg: "w-10 h-10",
	};

	const offsetClasses = {
		sm: "-ml-3",
		md: "-ml-4",
		lg: "-ml-5",
	};

	return (
		<>
			{displayAvatars.map((avatar, index) => (
				<Avatar
					key={index}
					className={`
                        ${sizeClasses[size]} 
                        border-2 border-background 
                        ${index > 0 ? offsetClasses[size] : ""}
                    `}
					style={{ zIndex: displayAvatars.length - index }}
				>
					<AvatarImage src={avatar.src || undefined} />
					<AvatarFallback>
						<UserRound className={size === "sm" ? "size-4" : "size-6"} />
					</AvatarFallback>
				</Avatar>
			))}
			{remainingCount > 0 && (
				<div
					className={`
                        ${sizeClasses[size]}
                        ${offsetClasses[size]}
                        flex items-center justify-center
                        text-sm font-medium rounded-full
                        bg-muted text-muted-foreground
                        border-2 border-background
                    `}
					style={{ zIndex: 0 }}
				>
					+{remainingCount}
				</div>
			)}
		</>
	);
}
