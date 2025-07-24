import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroVideoSection = () => {
  const navigate = useNavigate();

  return (
    <section id="home" className="pt-24 pb-20 px-4 mx-auto max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
          Capture. Organize.
          <span className="text-orange-500 block" data-aos="fade-right">
            Reflect.
          </span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          The simplest way to take, organize, and manage your thoughts.
          Transform your ideas into actionable insights.
        </p>
      </div>

      <div className="relative max-w-4xl mx-auto mb-8">
        <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-purple-500 to-blue-600 opacity-80 z-0" />
          <video
            src="/hero.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-10"
          />
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-white font-semibold mb-2">
                See Notely in Action
              </h3>
              <p className="text-white/80 text-sm">
                Watch how easy it is to create, organize, and share your notes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          size="lg"
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => navigate("/signup")}
        >
          Get Started Free
        </Button>
        <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
          Sign In
        </Button>
      </div>
    </section>
  );
};

export default HeroVideoSection;
