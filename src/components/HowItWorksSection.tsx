import { Card, CardContent } from "@/components/ui/card";
import { Edit3, Search, Share2 } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      step: "1",
      title: "Create & Write",
      description: "Use our rich text editor with highlighting, formatting, and image support to capture your thoughts beautifully.",
      icon: <Edit3 className="h-8 w-8 text-orange-500" />,
      color: "from-orange-50 to-orange-100"
    },
    {
      step: "2",
      title: "Organize & Search",
      description: "Tag, pin, and bookmark your notes. Find anything instantly with our powerful search functionality.",
      icon: <Search className="h-8 w-8 text-blue-500" />,
      color: "from-blue-50 to-blue-100"
    },
    {
      step: "3",
      title: "Share & Export",
      description: "Download your notes as PDF or share them with others. Your knowledge, beautifully presented.",
      icon: <Share2 className="h-8 w-8 text-purple-500" />,
      color: "from-purple-50 to-purple-100"
    }
  ];

  return (
      <section id="how-it-works" className="px-4 py-20 mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How it works
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Transform your note-taking workflow in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-8 left-full w-8 h-px bg-gradient-to-r from-gray-300 to-gray-200 z-0"></div>
                )}

                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative z-10">
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center mx-auto mb-6 relative`}>
                      <span className="text-2xl font-bold text-gray-700">{step.step}</span>
                      <div className="absolute inset-0 rounded-full border-2 border-white shadow-sm"></div>
                    </div>

                    <div className="mb-4 flex justify-center">
                      {step.icon}
                    </div>

                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
          ))}
        </div>

        <div className="mt-16 flex justify-center">
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 via-blue-500 to-purple-500 rounded-full"></div>
        </div>
      </section>
  );
};

export default HowItWorksSection;