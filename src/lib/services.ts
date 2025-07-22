// import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useAuthStore } from "@/store/useAuth";
// import { useToast } from "@/hooks/use-toast";
// import { api } from "./api";

// export const useAuth = () => {
//   const { setUser, setToken, logout: logoutStore } = useAuthStore();
//   const { toast } = useToast();
//   const queryClient = useQueryClient();

//   const login = useMutation({
//     mutationFn: async (credentials: { email: string; password: string }) => {
//       const response = await api.post("/auth/login", credentials);
//       return response.data;
//     },
//     onSuccess: (data) => {
//       setToken(data.token);
//       setUser(data.user);
//       toast({
//         title: "Welcome back!",
//         description: "You have been logged in successfully.",
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Login failed",
//         description: error.response?.data?.message || "Invalid credentials",
//         variant: "destructive",
//       });
//     },
//   });

//   const signup = useMutation({
//     mutationFn: async (userData: {
//       firstName: string;
//       lastName: string;
//       username: string;
//       email: string;
//       password: string;
//     }) => {
//       const response = await api.post("/auth/register", userData);
//       return response.data;
//     },
//     onSuccess: () => {
//       toast({
//         title: "Account created!",
//         description: "Please check your email for a verification link.",
//       });
//     },
//     onError: (error: any) => {
//       toast({
//         title: "Signup failed",
//         description:
//           error.response?.data?.message || "Failed to create account",
//         variant: "destructive",
//       });
//     },
//   });

//   const verifyEmail = useMutation({
//     mutationFn: async (token: string) => {
//       const response = await api.post("/auth/verify-email", { token });
//       return response.data;
//     },
//     onSuccess: () => {
//       toast({
//         title: "Email verified!",
//         description: "Your email has been successfully verified.",
//       });
//     },
//     onError: () => {
//       toast({
//         title: "Verification failed",
//         description: "The verification link is invalid or has expired.",
//         variant: "destructive",
//       });
//     },
//   });

//   const resendVerification = useMutation({
//     mutationFn: async () => {
//       const response = await api.post("/auth/resend-verification");
//       return response.data;
//     },
//     onSuccess: () => {
//       toast({
//         title: "Verification email sent!",
//         description: "Please check your email for the verification link.",
//       });
//     },
//     onError: () => {
//       toast({
//         title: "Failed to send email",
//         description: "Please try again later.",
//         variant: "destructive",
//       });
//     },
//   });

//   const forgotPassword = useMutation({
//     mutationFn: async (email: string) => {
//       const response = await api.post("/auth/forgot-password", { email });
//       return response.data;
//     },
//     onSuccess: () => {
//       toast({
//         title: "Reset link sent!",
//         description: "Please check your email for the password reset link.",
//       });
//     },
//     onError: () => {
//       toast({
//         title: "Failed to send reset link",
//         description: "Please try again later.",
//         variant: "destructive",
//       });
//     },
//   });

//   const resetPassword = useMutation({
//     mutationFn: async (data: { token: string; password: string }) => {
//       const response = await api.post("/auth/reset-password", data);
//       return response.data;
//     },
//     onSuccess: () => {
//       toast({
//         title: "Password reset successful!",
//         description: "You can now log in with your new password.",
//       });
//     },
//     onError: () => {
//       toast({
//         title: "Password reset failed",
//         description: "The reset link is invalid or has expired.",
//         variant: "destructive",
//       });
//     },
//   });

//   const logout = () => {
//     logoutStore();
//     queryClient.clear();
//     toast({
//       title: "Logged out",
//       description: "You have been successfully logged out.",
//     });
//   };

//   return {
//     login,
//     signup,
//     verifyEmail,
//     resendVerification,
//     forgotPassword,
//     resetPassword,
//     logout,
//   };
// };
