"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface Props {
    setActiveTab: (tab: "login" | "register" | "forgot" | "reset") => void;
}

export default function ResetDetector({ setActiveTab }: Props) {
    const searchParams = useSearchParams();

    useEffect(() => {
        const mode = searchParams.get("mode");
        const token = searchParams.get("token");

        if (mode === "reset" && token) {
            setActiveTab("reset");
        }
    }, [searchParams, setActiveTab]);

    return null;
}