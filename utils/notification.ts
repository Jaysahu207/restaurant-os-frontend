export const playNotification = () => {
    const audio = new Audio(
        "/sounds/new-order.mp3"
    );

    audio.play().catch(() => { });
};