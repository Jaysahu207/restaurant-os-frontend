"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { X, ExternalLink } from "lucide-react";

import "swiper/css";
import "swiper/css/pagination";

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  buttonText?: string;
  actionType?: "url" | "whatsapp" | "route";
  actionTarget?: string;
}

interface BannerCarouselProps {
  banners: Banner[];
  className?: string;
}

export default function BannerCarousel({
  banners,
  className = "",
}: BannerCarouselProps) {
  const router = useRouter();
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});

  if (!banners?.length) return null;

  // Mark image as loaded (for shimmer removal)
  const onImageLoad = (id: string) => {
    setImagesLoaded((prev) => ({ ...prev, [id]: true }));
  };

  // Action handler
  const handleBannerClick = useCallback(
    (banner: Banner) => {
      const { actionType, actionTarget } = banner;
      if (!actionType || !actionTarget) return;

      switch (actionType) {
        case "url":
          window.open(actionTarget, "_blank", "noopener,noreferrer");
          break;
        case "whatsapp":
          window.open(
            `https://wa.me/${actionTarget}`,
            "_blank",
            "noopener,noreferrer",
          );
          break;
        case "route":
          router.push(actionTarget);
          break;
        default:
          break;
      }
    },
    [router],
  );

  const handleAction = useCallback(() => {
    if (!selectedBanner) return;
    handleBannerClick(selectedBanner);
    setSelectedBanner(null); // close modal after action
  }, [selectedBanner, handleBannerClick]);

  // Keyboard accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, banner: Banner) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleBannerClick(banner);
      }
    },
    [handleBannerClick],
  );

  return (
    <div className={`w-full ${className}`}>
      {/* ========== MODAL ========== */}

      {selectedBanner && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={() => setSelectedBanner(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full md:max-w-2xl max-h-[92vh] overflow-hidden rounded-t-3xl md:rounded-3xl bg-white shadow-2xl"
          >
            {/* Banner Image */}
            {!imageErrors[selectedBanner._id] ? (
              <img
                src={selectedBanner.image}
                alt={selectedBanner.title}
                className="w-full max-h-[65vh] object-contain transition-opacity duration-500 ease-in-out"
                onError={() =>
                  setImageErrors((prev) => ({
                    ...prev,
                    [selectedBanner._id]: true,
                  }))
                }
              />
            ) : (
              <div className="h-80 flex items-center justify-center bg-gray-100">
                🖼️ Image unavailable
              </div>
            )}

            {/* Details */}
            <div className="p-6 overflow-y-auto max-h-[30vh]">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedBanner.title}
              </h2>

              {selectedBanner.subtitle && (
                <p className="mt-2 text-orange-600 font-medium">
                  {selectedBanner.subtitle}
                </p>
              )}

              {selectedBanner.description && (
                <p className="mt-4 text-gray-600 leading-7">
                  {selectedBanner.description}
                </p>
              )}

              {selectedBanner.actionTarget && (
                <button
                  onClick={handleAction}
                  className="mt-6 w-full rounded-2xl bg-linear-to-r from-orange-500 to-orange-600 py-4 text-white font-semibold"
                >
                  {selectedBanner.buttonText || "Explore Offer"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========== SWIPER CAROUSEL ========== */}
      <div className="relative group">
        <Swiper
          modules={[Autoplay, Pagination]}
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          loop={banners.length > 1}
          spaceBetween={16}
          slidesPerView={1}
          className="rounded-xl shadow-lg overflow-hidden"
          onSlideChange={() => {
            // Reset image loading state when slide changes (optional)
          }}
        >
          {banners.map((banner) => (
            <SwiperSlide key={banner._id}>
              <div
                onClick={() => setSelectedBanner(banner)}
                onKeyDown={(e) => handleKeyDown(e, banner)}
                role="button"
                tabIndex={0}
                aria-label={`Promotional banner: ${banner.title}`}
                className="relative block w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded-xl overflow-hidden group/slide"
              >
                {/* Image with shimmer placeholder */}
                <div className="relative h-44 w-full md:h-56 lg:h-64 bg-gray-200 shimmer">
                  {!imageErrors[banner._id] ? (
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className={`h-full w-full object-cover transition-opacity duration-500 ${
                        imagesLoaded[banner._id] ? "opacity-100" : "opacity-0"
                      }`}
                      onLoad={() => onImageLoad(banner._id)}
                      onError={() =>
                        setImageErrors((prev) => ({
                          ...prev,
                          [banner._id]: true,
                        }))
                      }
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      🖼️ Image unavailable
                    </div>
                  )}
                </div>

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Text content */}
                <div className="absolute bottom-4 left-4 right-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">
                    {banner.title}
                  </h2>
                  {banner.subtitle && (
                    <p className="text-sm md:text-base text-white/90 mt-1">
                      {banner.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10">
          <div
            className="h-full bg-orange-500 transition-all duration-300 ease-linear"
            style={{ width: "0%" }}
            id="banner-progress"
          />
        </div>
      </div>

      {/* ========== STYLES ========== */}
      <style jsx>{`
        /* Shimmer animation for image placeholder */
        .shimmer {
          background: linear-gradient(
            90deg,
            #f0f0f0 25%,
            #e0e0e0 50%,
            #f0f0f0 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        /* Swiper pagination styling */
        :global(.swiper-pagination-bullet) {
          background: white !important;
          opacity: 0.5;
          transition: all 0.2s ease;
        }
        :global(.swiper-pagination-bullet-active) {
          opacity: 1;
          background: white !important;
          transform: scale(1.2);
        }
        :global(.swiper-pagination) {
          bottom: 16px !important;
        }

        /* Modal slide-up animation */
        @keyframes slideUp {
          from {
            transform: translateY(10%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }

        /* Progress bar animation via Swiper autoplay time */
        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
