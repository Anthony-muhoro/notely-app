import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Save, Upload } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout.tsx";

const Profile = () => {
  const [profileData, setProfileData] = useState({
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    email: "john@example.com"
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      console.log("Profile updated successfully");
      setIsSaving(false);
    }, 1000);
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
     <DashboardLayout>
       <div className="max-w-4xl mx-auto p-2 md:p-6">
         <div className="mb-8">
           <h1 className=" text-2xl md:text-3xl font-bold text-gray-900 mb-2">Profile Information</h1>
           <p className="text-gray-600">Manage your account information and profile picture</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1">
             <Card>
               <CardHeader>
                 <CardTitle>Profile Picture</CardTitle>
                 <CardDescription>Update your profile photo</CardDescription>
               </CardHeader>
               <CardContent className="flex flex-col items-center space-y-4">
                 <Avatar className="h-32 w-32">
                   <AvatarImage src="/placeholder.svg" alt="Profile" />
                   <AvatarFallback className="text-2xl">
                     {profileData.firstName[0]}{profileData.lastName[0]}
                   </AvatarFallback>
                 </Avatar>
                 <Button variant="outline" className="w-full">
                   <Upload className="h-4 w-4 mr-2" />
                   Change Photo
                 </Button>
               </CardContent>
             </Card>
           </div>

           <div className="lg:col-span-2">
             <Card>
               <CardHeader>
                 <CardTitle>Personal Information</CardTitle>
                 <CardDescription>Update your personal details</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label htmlFor="firstName">First Name</Label>
                       <Input
                           id="firstName"
                           value={profileData.firstName}
                           onChange={(e) => handleProfileChange("firstName", e.target.value)}
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="lastName">Last Name</Label>
                       <Input
                           id="lastName"
                           value={profileData.lastName}
                           onChange={(e) => handleProfileChange("lastName", e.target.value)}
                       />
                     </div>
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="username">Username</Label>
                     <Input
                         id="username"
                         value={profileData.username}
                         onChange={(e) => handleProfileChange("username", e.target.value)}
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="email">Email</Label>
                     <Input
                         id="email"
                         type="email"
                         value={profileData.email}
                         onChange={(e) => handleProfileChange("email", e.target.value)}
                     />
                   </div>

                   <Button
                       onClick={handleProfileSubmit}
                       className="bg-orange-500 hover:bg-orange-600"
                       disabled={isSaving}
                   >
                     <Save className="h-4 w-4 mr-2" />
                     {isSaving ? "Saving..." : "Save Changes"}
                   </Button>
                 </div>
               </CardContent>
             </Card>
           </div>
         </div>
       </div>
     </DashboardLayout>

  );
};

export default Profile;