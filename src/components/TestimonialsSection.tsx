import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Tasha wanjiku",
      role: "Product Designer",
      company: "Figma",
      content:
        "Notely has completely transformed how I organize my thoughts. The interface is so clean and intuitive.",
      avatar: "/placeholder.svg",
      rating: 5,
    },
    {
      name: "Anthony muhoro",
      role: "C.E.O",
      company: "Muhoro Groups",
      content:
        "Finally, a note-taking app that doesn't get in the way of my creativity. Love the markdown support!",
      avatar: "/placeholder.svg",
      rating: 5,
    },
    {
      name: "Frank kober",
      role: "student",
      company: "Murang'a university",
      content:
        "Perfect for keeping track of lectures and research. The search feature is incredibly fast.",
      avatar: "/placeholder.svg",
      rating: 5,
    },
  ];

  return (
    <section
      id="testimonials"
      className="px-4 py-20 mx-auto max-w-7xl bg-gradient-to-b from-white to-gray-50 overflow-hidden"
    >
      <div className="text-center mb-16">
        <h2
          className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          data-aos="fade-up"
          data-aos-duration="800"
        >
          Loved by thousands
        </h2>
        <p
          className="text-gray-600 text-lg max-w-2xl mx-auto"
          data-aos="fade-up"
          data-aos-delay="200"
          data-aos-duration="800"
        >
          Join thousands of users who have transformed their note-taking
          experience with Notely
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <Card
            key={index}
            className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 bg-white relative overflow-hidden"
            data-aos="fade-up"
            data-aos-delay={index * 150}
            data-aos-duration="800"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="pt-8 pb-6 relative z-10">
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-yellow-400 fill-current transform transition-all duration-300 group-hover:scale-110"
                    style={{
                      animationDelay: `${i * 100}ms`,
                      animation: "pulse 2s infinite",
                    }}
                  />
                ))}
              </div>

              <div className="relative">
                <p className="text-gray-700 mb-6 leading-relaxed group-hover:text-gray-800 transition-colors duration-300">
                  "{testimonial.content}"
                </p>
                <div className="absolute -top-2 -left-2 text-4xl text-orange-200 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110">
                  "
                </div>
                <div className="absolute -bottom-4 -right-2 text-4xl text-orange-200 opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:scale-110 rotate-180">
                  "
                </div>
              </div>

              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-4 ring-2 ring-transparent group-hover:ring-orange-200 transition-all duration-300 transform group-hover:scale-105">
                  <AvatarImage
                    src={testimonial.avatar}
                    alt={testimonial.name}
                  />
                  <AvatarFallback className="bg-orange-100 text-orange-600 group-hover:bg-orange-200 transition-colors duration-300">
                    {testimonial.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="transform group-hover:translate-x-1 transition-transform duration-300">
                  <p className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors duration-300">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
                    {testimonial.role}
                  </p>
                  <p className="text-xs text-orange-500 group-hover:text-orange-600 transition-colors duration-300 font-medium">
                    {testimonial.company}
                  </p>
                </div>
              </div>
            </CardContent>
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-orange-200 rounded-lg transition-all duration-500" />
          </Card>
        ))}
      </div>
      <div className="absolute top-20 left-10 w-20 h-20 bg-orange-100 rounded-full opacity-20 animate-pulse" />
      <div
        className="absolute bottom-20 right-10 w-16 h-16 bg-blue-100 rounded-full opacity-20 animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/2 left-1/4 w-12 h-12 bg-purple-100 rounded-full opacity-20 animate-pulse"
        style={{ animationDelay: "2s" }}
      />
    </section>
  );
};

export default TestimonialsSection;
