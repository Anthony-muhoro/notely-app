import { Card, CardContent } from "@/components/ui/card";
import { Edit3, Bot, Zap } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      step: "1",
      title: "Create & Write",
      description:
        "Start writing with our intuitive rich text editor. Add formatting, images, and structure your thoughts with professional-grade tools.",
      icon: <Edit3 className="h-8 w-8 text-orange-500" />,
      gradient: "from-orange-50 to-orange-100",
      iconBg: "bg-orange-500",
    },
    {
      step: "2",
      title: "Voice Chat",
      description:
        "Activate the AI voice assistant to have natural conversations with your notes. Ask questions, get summaries, or find specific information instantly.",
      icon: <Bot className="h-8 w-8 text-blue-500" />,
      gradient: "from-blue-50 to-blue-100",
      iconBg: "bg-blue-500",
    },
    {
      step: "3",
      title: "Smart Insights",
      description:
        "Let AI analyze your notes to provide intelligent suggestions, connections between ideas, and actionable insights to enhance your productivity.",
      icon: <Zap className="h-8 w-8 text-purple-500" />,
      gradient: "from-purple-50 to-purple-100",
      iconBg: "bg-purple-500",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="px-4 py-20 mx-auto max-w-7xl bg-gradient-to-br from-gray-50 to-white"
    >
      <div className="text-center mb-16">
        <h2
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          data-aos="fade-up"
        >
          How It Works
        </h2>
        <p
          className="text-gray-600 text-lg max-w-2xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          Experience the future of note-taking with our AI-powered workflow that
          adapts to your thinking process
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 relative">
        <div className="hidden md:block absolute top-1/2 left-1/3 w-1/3 h-0.5 bg-gradient-to-r from-orange-300 via-blue-300 to-purple-300 -translate-y-1/2 z-0"></div>
        <div className="hidden md:block absolute top-1/2 right-1/3 w-1/3 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 -translate-y-1/2 z-0"></div>

        {steps.map((step, index) => (
          <div
            key={index}
            className="relative z-10"
            data-aos="fade-up"
            data-aos-delay={index * 200}
          >
            <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-3 bg-white overflow-hidden">
              <CardContent className="pt-8 pb-6 text-center relative">
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                ></div>

                <div className="relative z-10">
                  <div className="relative mx-auto mb-6 w-20 h-20">
                    {/* Step number circle */}
                    <div
                      className={`absolute inset-0 ${step.iconBg} rounded-full flex items-center justify-center shadow-lg`}
                    >
                      <span className="text-2xl font-bold text-white">
                        {step.step}
                      </span>
                    </div>

                    {/* Icon overlay */}
                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-md group-hover:shadow-lg transition-shadow duration-300">
                      {step.icon}
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {step.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div
        className="mt-16 flex justify-center"
        data-aos="fade-up"
        data-aos-delay="600"
      >
        <div className="w-32 h-1 bg-gradient-to-r from-orange-500 via-blue-500 to-purple-500 rounded-full shadow-sm"></div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
