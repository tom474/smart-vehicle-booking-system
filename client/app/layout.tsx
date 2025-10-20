import type { Metadata } from "next";
import "./globals.css";
import { Roboto } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { MsalProviderWrapper } from "@/app/msal-provider";
import { AuthGuard } from "@/app/auth-guard";

const roboto = Roboto({
	variable: "--font-roboto-2",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Smart Vehicle Booking System",
	description: "A smart vehicle booking system for efficient transportation management.",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getLocale();

	return (
		<html lang={locale} suppressHydrationWarning>
			<head>
				<link rel="manifest" href="/manifest.json" />
				<link rel="preload" href="/manifest.json" as="fetch" />
			</head>
			<body className={`${roboto.variable} antialiased`}>
				<NextIntlClientProvider>
					<ThemeProvider
						attribute="class"
						// defaultTheme="system"
						defaultTheme="light"
						enableSystem
						disableTransitionOnChange
					>
						<MsalProviderWrapper>
							<AuthGuard>{children}</AuthGuard>
							<Toaster richColors />
						</MsalProviderWrapper>
					</ThemeProvider>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
