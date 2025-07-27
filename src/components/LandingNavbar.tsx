
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FileText, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const navItems = [
    { name: "Home", href: "#home" },
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Testimonials", href: "#testimonials" },
    { name: "Contact", href: "#contact" },
  ];
  
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-7 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center" data-aos="fade-right">
            <FileText className="h-8 w-8 text-orange-500" />
            <span className="ml-2 text-xl font-bold text-gray-900">Notely</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8" data-aos="fade-down">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => scrollToSection(item.href)}
                className="text-gray-600 hover:text-orange-500 transition-colors duration-200 font-medium"
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-4" data-aos="fade-left">
            <Button 
              variant="ghost" 
              className="text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-all duration-200"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
            <Button
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
              onClick={() => navigate("/signup")}
            >
              Get Started
            </Button>
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-white border-l border-gray-200 shadow-xl">
              <div className="flex flex-col space-y-6 mt-8 p-4">
                <div className="space-y-4">
                  {navItems.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => scrollToSection(item.href)}
                      className="block w-full text-left text-gray-700 hover:text-orange-500 transition-colors p-3 rounded-lg hover:bg-orange-50 font-medium"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
                <div className="pt-6 border-t border-gray-200 space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 text-base hover:bg-orange-50 hover:text-orange-500"
                    onClick={() => {
                      navigate("/login");
                      setIsOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 h-12 text-base font-medium shadow-lg"
                    onClick={() => {
                      navigate("/signup");
                      setIsOpen(false);
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
