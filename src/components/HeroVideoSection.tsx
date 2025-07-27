
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HeroImageCarousel from "./HeroImageCarousel";

const HeroVideoSection = () => {
  const navigate = useNavigate();

  return (
    <section id="home" className="pt-24 pb-20 px-4 mx-auto max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6" data-aos="fade-up">
          Think. Write.
          <span className="text-orange-500 block" data-aos="fade-right" data-aos-delay="200">
            Converse.
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto" data-aos="fade-up" data-aos-delay="300">
          Experience the future of note-taking with AI-powered voice conversations. 
          Chat with your notes, organize thoughts naturally, and unlock new insights.
        </p>
      </div>

      <div data-aos="zoom-in" data-aos-delay="400">
        <HeroImageCarousel />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center" data-aos="fade-up" data-aos-delay="500">
        <Button
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
          onClick={() => navigate("/signup")}
        >
          Start Creating Notes
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          className="border-2 border-orange-500 text-orange-500 hover:bg-orange-50 transition-all duration-200"
          onClick={() => navigate("/login")}
        >
          Sign In
        </Button>
      </div>
    </section>
  );
};

export default HeroVideoSection;
