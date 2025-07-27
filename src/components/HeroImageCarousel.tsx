import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroImageCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      image: "https://ik.imagekit.io/muhorodev/takenotes",
      title: "Capture Your Thoughts",
      description: "Take notes with our advanced rich text editor",
    },
    {
      id: 2,
      image: "https://ik.imagekit.io/muhorodev/voicechat",
      title: "Voice Chat with Notes",
      description: "Talk to your notes with AI-powered voice assistance",
    },
    {
      id: 3,
      image: "https://ik.imagekit.io/muhorodev/organized",
      title: "Stay Organized",
      description: "Find and organize your notes effortlessly",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative max-w-4xl mx-auto mb-8">
      <div className="relative aspect-video bg-gradient-to-br from-orange-100 to-blue-100 rounded-2xl overflow-hidden shadow-2xl">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h3 className="text-2xl font-bold mb-2" data-aos="fade-up">
                {slide.title}
              </h3>
              <p
                className="text-white/90 text-lg"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                {slide.description}
              </p>
            </div>
          </div>
        ))}

        {/* Navigation buttons */}
        <Button
          variant="outline"
          size="icon"
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 transition-all duration-200"
        >
          <ChevronLeft className="h-5 w-5 text-white" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm border-white/30 hover:bg-white/30 transition-all duration-200"
        >
          <ChevronRight className="h-5 w-5 text-white" />
        </Button>

        {/* Dot indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "bg-white scale-110"
                  : "bg-white/50 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroImageCarousel;
