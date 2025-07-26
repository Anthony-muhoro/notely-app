import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Eye, EyeOff } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/store/useAuth";
import { toast } from "sonner";

const Login = () => {
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const isEmail = (input: string) => /\S+@\S+\.\S+/.test(input);
  const login = useAuth((state) => state.login);

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const input = formData.emailOrUsername.trim();
      const email = isEmail(input) ? input : "";
      const userName = isEmail(input) ? "" : input;
      const message = await login(email, userName, formData.password);
      toast.success(message);
      setTimeout(() => {
        navigate("/dashboard");
        setIsLoading(false);
      }, 1000);
    } catch (err: any) {
      setIsLoading(false);
      toast(
        <div className="max-w-sm w-full flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 text-red-800 rounded-md shadow">
          <span className="text-xl">⚠️</span>
          <div className="text-sm font-medium">
            {err?.response?.data?.message || "Something went wrong"}
          </div>
        </div>
      );
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <FileText className="h-8 w-8 text-orange-500 mr-2" />
          <span className="text-2xl font-bold text-gray-900">Notely</span>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrUsername">Username / Email</Label>
                <Input
                  id="emailOrUsername"
                  name="emailOrUsername"
                  placeholder="Enter your email or username"
                  value={formData.emailOrUsername}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-orange-500 hover:text-orange-600"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="button"
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={isLoading}
                onClick={handleSubmit}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="text-orange-500 hover:text-orange-600"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
