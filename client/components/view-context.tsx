import { createContext, useContext, useState } from "react";

type ViewContextType = {
	isListView: boolean;
	setIsListView: (view: boolean) => void;
};

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export const ViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [isListView, setIsListView] = useState(() => {
		const storedView = localStorage.getItem("isListView");
		return storedView ? storedView === "true" : false;
	});

	const handleSetIsListView = (view: boolean) => {
		setIsListView(view);
		localStorage.setItem("isListView", view ? "true" : "false");
	};

	return (
		<ViewContext.Provider value={{ isListView, setIsListView: handleSetIsListView }}>
			{children}
		</ViewContext.Provider>
	);
};

export function useViewContext() {
	const context = useContext(ViewContext);
	if (!context) {
		// Provide a fallback value or throw an error
		return {
			isListView: false,
			setIsListView: () => {
				console.warn("setIsListView called outside of ViewProvider");
			},
		};
	}
	return context;
}
