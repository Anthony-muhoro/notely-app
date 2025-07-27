import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  FileText,
  Plus,
  Pin,
  Bookmark,
  Trash2,
  User,
  LogOut,
  Menu,
  Globe,
  LockKeyhole,
} from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/store/useAuth";
import VoiceAssistant from "@/components/voice/VoiceAssistant";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { refreshUser, token, user, logout } = useAuth();

  useEffect(() => {
    refreshUser();
    if (!token) {
      navigate("/login");
    }
  }, [token]);

  const navigation = [
    { name: "My Notes", href: "/dashboard", icon: FileText },
    { name: "New Entry", href: "/new", icon: Plus },
    { name: "Pinned", href: "/pinned", icon: Pin },
    { name: "Bookmarked", href: "/bookmarks", icon: Bookmark },
    { name: "Trash", href: "/trash", icon: Trash2 },
    { name: "Public Notes", href: "/public", icon: Globe },
  ];

  const handleLogout = async () => {
    logout();
    toast(<p>You have successfully logged out </p>);
    navigate("/");
  };

  const initials = (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "");

  const NavItems = () => (
    <nav className="space-y-1 px-3">
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link key={item.name} to={item.href}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start h-11 ${
                isActive
                  ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </Button>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-md border"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0 bg-white border-r">
          <VisuallyHidden>
            <SheetTitle>Mobile Navigation Menu</SheetTitle>
            <SheetDescription>
              This is the mobile navigation menu for the site.
            </SheetDescription>
          </VisuallyHidden>
          <div className="flex h-full flex-col">
            <div className="flex items-center px-6 py-5 border-b bg-white">
              <FileText className="h-6 w-6 text-orange-500 mr-2" />
              <span className="text-xl font-bold text-gray-900">Notely</span>
            </div>
            <div className="flex-1 py-6 bg-white">
              <NavItems />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-40">
        <div className="flex flex-col flex-grow border-r bg-white shadow-sm">
          <div className="flex items-center flex-shrink-0 px-6 py-5 border-b">
            <FileText className="h-6 w-6 text-orange-500 mr-2" />
            <span className="text-xl font-bold text-gray-900">Notely</span>
          </div>
          <div className="flex-1 py-6">
            <NavItems />
          </div>
        </div>
      </div>

      <div className="md:pl-72 flex flex-col flex-1">
        <div className="sticky top-0 z-30 flex-shrink-0 flex h-16 bg-white border-b shadow-sm">
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900 ml-12 md:ml-0">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                Welcome back, {user?.firstName}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt="Profile" />
                      <AvatarFallback className="bg-orange-50 text-blue-700">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-white"
                  align="end"
                  forceMount
                >
                  <DropdownMenuItem
                    onClick={() => navigate("/profile")}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate("/change-password")}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <LockKeyhole className="mr-2 h-4 w-4" />
                    Change Password
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <VoiceAssistant />
    </div>
  );
};

export default DashboardLayout;
