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
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import ApiClient from "@/lib/api";
import { toast } from "sonner";

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");

  const { mutate } = useMutation({
    mutationKey: ["reset-password"],
    mutationFn: async () => {
      const { confirmPassword, ...passData } = formData;
      const response = await ApiClient.post("/auth/reset-password", {
        ...passData,
        token,
      });
      return response.data;
    },
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: () => {
      toast.success(
        <div className="flex items-center gap-3">
          <span className="text-green-600 text-lg">✅</span>
          <div>
            <p className="text-sm font-medium text-green-800">
              Password reset successfully
            </p>
            <p className="text-xs text-green-700">
              You can now log in with your new password
            </p>
          </div>
        </div>,
        {
          duration: 4000,
          className:
            "bg-green-50 border border-green-200 text-green-800 shadow rounded-md px-4 py-3",
        }
      );
      navigate("/login");
      setIsLoading(false);
    },
    onError: (error: any) => {
      toast.error(
        <div className="flex items-center gap-3">
          <span className="text-red-600 text-lg">⚠️</span>
          <div>
            <p className="text-sm font-medium text-red-800">Reset failed</p>
            <p className="text-xs text-red-700">
              {error?.response?.data?.message || "Something went wrong"}
            </p>
          </div>
        </div>,
        {
          duration: 5000,
          className:
            "bg-red-50 border border-red-200 text-red-800 shadow rounded-md px-4 py-3",
        }
      );
      setIsLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error(
        <div className="flex items-center gap-3">
          <span className="text-yellow-600 text-lg">⚠️</span>
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Passwords do not match
            </p>
            <p className="text-xs text-yellow-700">
              Please re-enter both fields
            </p>
          </div>
        </div>,
        {
          duration: 4000,
          className:
            "bg-yellow-50 border border-yellow-200 text-yellow-800 shadow rounded-md px-4 py-3",
        }
      );
      return;
    }

    if (!token) {
      toast.error(
        <div className="flex items-center gap-3">
          <span className="text-red-600 text-lg">⚠️</span>
          <div>
            <p className="text-sm font-medium text-red-800">
              Invalid or missing token
            </p>
            <p className="text-xs text-red-700">
              Use the link sent to your email
            </p>
          </div>
        </div>,
        {
          duration: 4000,
          className:
            "bg-red-50 border border-red-200 text-red-800 shadow rounded-md px-4 py-3",
        }
      );
      return;
    }

    mutate();
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
            <CardTitle className="text-2xl">Reset password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
