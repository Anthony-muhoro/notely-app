import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Bot, Search, Edit3, Mic, Zap } from "lucide-react";
import LandingNavbar from "@/components/LandingNavbar";
import HeroVideoSection from "@/components/HeroVideoSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useEffect } from "react";
import Aos from "aos";
import "aos/dist/aos.css";

const Index = () => {
  useScrollToTop();
  useEffect(() => {
    const initAOS = async () => {
      await import("aos");
      Aos.init({
        duration: 1000,
        easing: "ease-out-cubic",
        once: false,
        offset: 100,
      });
    };
    initAOS();
  }, []);

  const features = [
    {
      icon: <Bot className="h-8 w-8 text-orange-500" />,
      title: "Voice Chat with Your Notes",
      description:
        "Revolutionary AI-powered voice assistant that understands your notes and helps you interact with them naturally through conversation.",
      gradient: "from-orange-50 to-orange-100",
    },
    {
      icon: <Edit3 className="h-8 w-8 text-blue-500" />,
      title: "Rich Text Editor",
      description:
        "Professional-grade editor with advanced formatting, highlighting, and multimedia support for creating beautiful, structured notes.",
      gradient: "from-blue-50 to-blue-100",
    },
    {
      icon: <Search className="h-8 w-8 text-purple-500" />,
      title: "Smart Organization",
      description:
        "Intelligent search and organization system that helps you find any note instantly with powerful filtering and categorization.",
      gradient: "from-purple-50 to-purple-100",
    },
    {
      icon: <Mic className="h-8 w-8 text-green-500" />,
      title: "Voice Commands",
      description:
        "Control your notes with voice commands - create, edit, search, and organize everything hands-free with natural language processing.",
      gradient: "from-green-50 to-green-100",
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-500" />,
      title: "AI-Powered Insights",
      description:
        "Get intelligent suggestions, summaries, and insights from your notes with advanced AI that learns from your writing patterns.",
      gradient: "from-yellow-50 to-yellow-100",
    },
    {
      icon: <FileText className="h-8 w-8 text-indigo-500" />,
      title: "Seamless Sync",
      description:
        "Access your notes anywhere with real-time synchronization across all devices, ensuring your thoughts are always available.",
      gradient: "from-indigo-50 to-indigo-100",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <LandingNavbar />

      <HeroVideoSection />

      <section id="features" className="px-4 py-20 mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            data-aos="fade-up"
          >
            Next-Generation Note-Taking
          </h2>
          <p
            className="text-gray-600 text-lg max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Powered by advanced AI technology, our platform transforms how you
            create, organize, and interact with your notes through natural
            conversation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 bg-white"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <CardHeader className="text-center pb-4">
                <div
                  className={`mx-auto mb-4 p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl w-fit shadow-sm group-hover:shadow-md transition-shadow duration-300`}
                >
                  {feature.icon}
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed text-center">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <HowItWorksSection />

      <TestimonialsSection />

      <footer
        id="contact"
        className="px-4 py-12 mx-auto max-w-7xl border-t bg-white/80 backdrop-blur-sm"
      >
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <FileText className="h-6 w-6 text-orange-500 mr-2" />
            <span className="text-xl font-bold text-gray-900">Notely</span>
          </div>
          <div className="flex space-x-6 text-gray-600">
            <a href="#" className="hover:text-orange-500 transition-colors">
              LinkedIn
            </a>
            <a href="#" className="hover:text-orange-500 transition-colors">
              X
            </a>
            <a
              href="https://github.com/Anthony-muhoro"
              className="hover:text-orange-500 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
        <div className="text-center mt-8 pt-8 border-t text-gray-500 text-sm">
          © {new Date().getFullYear()} Notely. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;
