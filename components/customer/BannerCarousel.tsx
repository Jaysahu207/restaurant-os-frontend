"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  image: string;
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

  if (!banners?.length) return null;

  const handleBannerClick = (banner: Banner) => {
    const { actionType, actionTarget } = banner;
    if (!actionType || !actionTarget) return;

    switch (actionType) {
      case "url":
        // Open external URLs in a new tab
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
        // Internal navigation – use Next.js router
        router.push(actionTarget);
        break;
      default:
        break;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, banner: Banner) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleBannerClick(banner);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true, // modern touch: pause on hover
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true, // cleaner on mobile
        }}
        loop={banners.length > 1}
        spaceBetween={16}
        slidesPerView={1}
        className="rounded-xl shadow-md overflow-hidden"
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner._id}>
            <div
              onClick={() => handleBannerClick(banner)}
              onKeyDown={(e) => handleKeyDown(e, banner)}
              role="button"
              tabIndex={0}
              aria-label={`Promotional banner: ${banner.title}`}
              className="relative block w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {/* Responsive Image with Next.js optimization */}
              <div className="relative h-44 w-full md:h-56 lg:h-64">
                {!imageErrors[banner._id] ? (
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="h-full w-full object-cover"
                    onError={() =>
                      setImageErrors((prev) => ({
                        ...prev,
                        [banner._id]: true,
                      }))
                    }
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200 text-gray-500">
                    🖼️ Image unavailable
                  </div>
                )}
              </div>

              {/* Gradient overlay – modern and smooth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

              {/* Text content – adjusted for better readability */}
              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-xl font-bold text-white drop-shadow-lg">
                  {banner.title}
                </h2>

                <p className="text-sm text-white/90">{banner.subtitle}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom styles for pagination (can be moved to global CSS) */}
      <style jsx>{`
        :global(.swiper-pagination-bullet) {
          background: white !important;
          opacity: 0.6;
          transition: all 0.2s ease;
        }
        :global(.swiper-pagination-bullet-active) {
          opacity: 1;
          background: white !important;
          transform: scale(1.1);
        }
        :global(.swiper-pagination) {
          bottom: 12px !important;
        }
        @media (min-width: 768px) {
          :global(.swiper-pagination) {
            bottom: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
