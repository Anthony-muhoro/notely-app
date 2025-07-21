
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, Shield, Edit3 } from "lucide-react";
import LandingNavbar from "@/components/LandingNavbar";
import HeroVideoSection from "@/components/HeroVideoSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import { useScrollToTop } from "@/hooks/useScrollToTop";

const Index = () => {
  useScrollToTop();

  const features = [
    {
      icon: <Edit3 className="h-8 w-8 text-orange-500" />,
      title: "Rich Text Editor",
      description: "Write with advanced formatting, highlighting, and image support for beautiful notes."
    },
    {
      icon: <Search className="h-8 w-8 text-blue-500" />,
      title: "Smart Organization",
      description: "Find your notes instantly with powerful search, tagging, and filtering capabilities."
    },
    {
      icon: <Shield className="h-8 w-8 text-purple-500" />,
      title: "Export & Share",
      description: "Download as PDF or share your notes seamlessly with enterprise-grade security."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <LandingNavbar />
      
      {/* Hero Video Section */}
      <HeroVideoSection />

      {/* Features Section */}
      <section id="features" className="px-4 py-20 mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything you need to stay organized
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Powerful features designed to help you capture and organize your thoughts effortlessly with professional-grade tools.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-gray-50 rounded-full w-fit">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <HowItWorksSection />

      <TestimonialsSection />

      <footer id="contact" className="px-4 py-12 mx-auto max-w-7xl border-t bg-white">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <FileText className="h-6 w-6 text-orange-500 mr-2" />
            <span className="text-xl font-bold text-gray-900">Notely</span>
          </div>
          <div className="flex space-x-6 text-gray-600">
            <a href="#" className="hover:text-orange-500 transition-colors">Linkedln</a>
            <a href="#" className="hover:text-orange-500 transition-colors">X</a>
            <a href="https://github.com/Anthony-muhoro" className="hover:text-orange-500 transition-colors">GitHub</a>
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
