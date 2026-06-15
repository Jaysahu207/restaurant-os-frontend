"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface Props {
    setActiveTab: (tab: "login" | "register" | "forgot" | "reset") => void;
    setToken: (token: string) => void;
}

export default function ResetDetector({
    setActiveTab,
    setToken,
}: Props) {
    const searchParams = useSearchParams();

    useEffect(() => {
        const mode = searchParams.get("mode");
        const token = searchParams.get("token");

        if (mode === "reset" && token) {
            setToken(token);
            setActiveTab("reset");
        }
    }, [searchParams, setActiveTab, setToken]);

    return null;
}