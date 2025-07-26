import { useState, useRef } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, Camera, Loader2, Pencil } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout.tsx";
import { useAuth } from "@/store/useAuth";
import { useToast } from "@/hooks/use-toast";
import ApiClient from "@/lib/api";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [updateData, setupdateData] = useState({
    firstName: user?.firstName,
    lastName: user?.lastName,
    userName: user?.userName,
    email: user?.email,
  });

  const [profileImage, setProfileImage] = useState<string | null>(user?.avatar);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await ApiClient.put("/users/profile", updateData);
      refreshUser();
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch {
      toast({
        title: "Update failed",
        description: "There was an error updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setupdateData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setProfileImage(previewUrl);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedFile) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("avatar", selectedFile);
      await ApiClient.put("/users/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSelectedFile(null);
      toast({ title: "Profile picture updated." });
      refreshUser();
    } catch (err: any) {
      console.log(err?.response.data);
      toast({
        title: "Upload failed",
        description: "Could not upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-2 md:p-6">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Profile Information
          </h1>
          <p className="text-gray-600">
            Manage your account information and profile picture
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Upload a new profile photo</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div
                  className="relative group cursor-pointer"
                  onClick={triggerFileInput}
                >
                  <Avatar className="h-32 w-32 border-4 border-orange-100">
                    <AvatarImage src={profileImage || "/placeholder.svg"} />
                    <AvatarFallback className="text-2xl bg-orange-100 text-orange-700">
                      {(user?.firstName?.[0] ?? "U").toUpperCase()}
                      {(user?.lastName?.[0] ?? "").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isUploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow group-hover:opacity-100 opacity-0 transition-opacity">
                    <Pencil className="h-5 w-5 text-gray-600" />
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <Button
                  onClick={handleImageUpload}
                  variant="outline"
                  className="w-full hover:bg-orange-50 hover:border-orange-300"
                  disabled={!selectedFile || isUploadingImage}
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4 mr-2" />
                      Change Photo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={updateData.firstName}
                        onChange={(e) =>
                          handleProfileChange("firstName", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={updateData.lastName}
                        onChange={(e) =>
                          handleProfileChange("lastName", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="userName">Username</Label>
                    <Input
                      id="userName"
                      value={updateData.userName}
                      onChange={(e) =>
                        handleProfileChange("userName", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={updateData.email}
                      disabled
                      className="bg-gray-50 cursor-not-allowed"
                    />
                  </div>

                  <Button
                    onClick={handleProfileSubmit}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
