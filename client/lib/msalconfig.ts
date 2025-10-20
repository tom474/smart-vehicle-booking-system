import { PopupRequest, PublicClientApplication, LogLevel } from "@azure/msal-browser";

export const msalConfig = {
	auth: {
		clientId: process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID!,
		authority: "https://login.microsoftonline.com/" + process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID,
		redirectUri: process.env.NEXT_PUBLIC_MICROSOFT_CALLBACK_URL,
		postLogoutRedirectUri: process.env.POST_LOGOUT_URL,
		navigateToLoginRequestUrl: false,
	},
	cache: {
		cacheLocation: "localStorage",
		storeAuthStateInCookie: true,
	},
	system: {
		loggerOptions: {
			// eslint-disable-next-line
			loggerCallback: (level: any, message: any, containsPii: any) => {
				if (containsPii) {
					return;
				}
				switch (level) {
					case LogLevel.Error:
						console.error(message);
						return;
					case LogLevel.Warning:
						console.warn(message);
						return;
					default:
						return;
				}
			},
		},
	},
};

export const loginRequest: PopupRequest = {
	scopes: ["User.Read"],
	prompt: "select_account",
};

export const msalInstance = new PublicClientApplication(msalConfig);
