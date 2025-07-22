import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Mail, CheckCircle, ArrowLeft } from "lucide-react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import ApiClient from "@/lib/api";

const VerifyEmail = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const token = searchParams.get("token");
  const email =
    searchParams.get("email") ||
    localStorage.getItem("pending_verification_email");

  const handleResendVerification = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Verification email sent!",
        description: "Check your inbox for the verification link.",
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleVerifyToken = async () => {
    if (token) {
      setIsLoading(true);
      try {
        await ApiClient.post(
          "auth/verify-email",
          { token },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        setIsVerified(true);
        toast({
          title: "Email verified successfully!",
          description: "Welcome to Notely. You can now start taking notes.",
        });
        setIsLoading(false);
        setTimeout(() => navigate("/login"), 3000);
      } catch (error) {
        toast({
          title: "Verification failed",
          description:
            error?.response?.data?.message || "Invalid or expired token.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (token) {
      handleVerifyToken();
    }
  }, [token]);

  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="text-center p-8">
            <div className="mb-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 mb-6">
              Your account has been successfully verified. Redirecting to your
              dashboard...
            </p>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Notely
            </span>
          </div>
        </div>

        <Card className="glass-card border-0 shadow-2xl">
          <CardHeader className="text-center">
            <div className="mb-4">
              <Mail className="h-12 w-12 text-orange-500 mx-auto" />
            </div>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription className="text-base">
              We've sent a verification link to{" "}
              <span className="font-medium text-gray-900">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600">
                Click the link in your email to verify your account and get
                started with Notely.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    "Resend verification email"
                  )}
                </Button>

                <Button
                  variant="outline"
                  asChild
                  className="w-full h-12 border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  <Link to="/login">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to login
                  </Link>
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={handleResendVerification}
                  className="text-orange-500 hover:text-orange-600 underline"
                >
                  try a different email address
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
