import API from "@/config/axios";



export const saveGoogleReviewLink = async (
    restaurantId: string,
    googleReviewLink: string
) => {
    const response = await API.put(
        `/api/restaurant/google-review-link/${restaurantId}`,
        {
            googleReviewLink,
        },
        {
            withCredentials: true,
        }
    );

    return response.data;
};

export const getGoogleReviewLink = async (restaurantId: string) => {
    const response = await API.get(
        `/api/restaurant/google-review-link/${restaurantId}`,
        {
            withCredentials: true,
        }
    );

    return response.data;
};