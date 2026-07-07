export const requestPermission = async () => {
    if ("Notification" in window) {
        if (Notification.permission !== "granted") {
            await Notification.requestPermission();
        }
    }
};

export const showBrowserNotification = (
    title: string,
    body: string
) => {
    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {
        new Notification(title, {
            body,
            icon: "/logo.png",
        });
    }
};