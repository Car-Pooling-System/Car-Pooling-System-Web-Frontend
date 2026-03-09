export const clerkAuthAppearance = {
    variables: {
        colorPrimary: "#13ec5b",
        colorText: "#111813",
        colorBackground: "#ffffff",
        colorInputBackground: "#f0f4f2",
        colorInputText: "#111813",
        borderRadius: "12px",
        fontFamily: "Inter, sans-serif",
    },
    elements: {
        card: "shadow-sm border border-[var(--color-border)] rounded-2xl",
        headerTitle: "font-extrabold text-xl",
        headerSubtitle: "text-sm",
        socialButtonsBlockButton:
            "border border-[var(--color-border)] rounded-xl font-semibold text-sm",
        formButtonPrimary:
            "bg-[var(--color-primary)] text-[var(--color-dark)] font-bold rounded-xl hover:opacity-90",
        footerActionLink: "font-bold text-[var(--color-primary-dark)]",
    },
};
