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
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout.tsx";
import { useMutation } from "@tanstack/react-query";
import ApiClient from "@/lib/api";
import { toast } from "sonner";
import VoiceAssistant from "@/components/voice/VoiceAssistant";

const ChangePassword = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { mutate } = useMutation({
    mutationKey: ["change-password"],
    mutationFn: async () => {
      const { confirmPassword, ...rest } = passwordData;
      const response = await ApiClient.put("/users/change-password", rest);
      return response.data;
    },
    onError: (err: any) => {
      toast(
        <div className="flex items-start space-x-3 text-red-700 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertCircle className="h-5 w-5 mt-1 text-red-600" />
          <div className="text-sm">
            {err?.response?.data.message || "Something went wrong."}
          </div>
        </div>
      );
    },
    onSuccess: (data) => {
      toast(
        <div className="flex items-start space-x-3 text-green-700 bg-green-50 border border-green-200 rounded-md p-4">
          <CheckCircle2 className="h-5 w-5 mt-1 text-green-600" />
          <div className="text-sm">
            {data?.message || "Password updated successfully."}
          </div>
        </div>
      );

      setPasswordData({
        currentPassword: "",
        confirmPassword: "",
        newPassword: "",
      });
      return;
    },
  });

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast(
        <div className="flex items-start space-x-3 text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <AlertCircle className="h-5 w-5 mt-1 text-yellow-600" />
          <div className="text-sm">
            Password mismatch: New passwords do not match.
          </div>
        </div>
      );
      return;
    }

    setIsChangingPassword(true);
    mutate();
    setIsChangingPassword(false);
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto p-1 md:p-6">
        <div className="mb-8">
          <h1 className=" text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Change Password
          </h1>
          <p className="text-gray-600">
            Update your account password for security
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="">Change Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      handlePasswordChange("currentPassword", e.target.value)
                    }
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility("current")}
                  >
                    {showPasswords.current ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      handlePasswordChange("newPassword", e.target.value)
                    }
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility("new")}
                  >
                    {showPasswords.new ? (
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
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      handlePasswordChange("confirmPassword", e.target.value)
                    }
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility("confirm")}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                onClick={handlePasswordSubmit}
                className="bg-orange-500 hover:bg-orange-600"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <VoiceAssistant assistantType="default" />
    </DashboardLayout>
  );
};

export default ChangePassword;
