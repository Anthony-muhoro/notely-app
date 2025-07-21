
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Tasha wanjiku",
      role: "Product Designer",
      company: "Figma",
      content: "Notely has completely transformed how I organize my thoughts. The interface is so clean and intuitive.",
      avatar: "/placeholder.svg",
      rating: 5
    },
    {
      name: "Anthony muhoro",
      role: "C.E.O",
      company: "Muhoro Groups",
      content: "Finally, a note-taking app that doesn't get in the way of my creativity. Love the markdown support!",
      avatar: "/placeholder.svg",
      rating: 5
    },
    {
      name: "Frank kober",
      role: "student",
      company: "Murang'a university",
      content: "Perfect for keeping track of lectures and research. The search feature is incredibly fast.",
      avatar: "/placeholder.svg",
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="px-4 py-20 mx-auto max-w-7xl bg-gradient-to-b from-white to-gray-50">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Loved by thousands
        </h2>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          Join thousands of users who have transformed their note-taking experience with Notely
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
            <CardContent className="pt-8 pb-6">
              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>
              
              {/* Testimonial */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              <div className="flex items-center">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="bg-orange-100 text-orange-600">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                  <p className="text-xs text-orange-500">{testimonial.company}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
