
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import NewNote from "./pages/NewNote";
import EditNote from "./pages/EditNote";
import NoteDetails from "./pages/NoteDetails";
import Profile from "./pages/Profile";
import PinnedNotes from "./pages/PinnedNotes";
import BookmarkedNotes from "./pages/BookmarkedNotes";
import TrashPage from "./pages/TrashPage";
import PublicNotes from "./pages/PublicNotes";
import NotFound from "./pages/NotFound";
import ChangePassword from "@/pages/ChangePassword.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new" element={<NewNote />} />
          <Route path="/edit/:id" element={<EditNote />} />
          <Route path="/note/:id" element={<NoteDetails />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword/>}/>
          <Route path="/pinned" element={<PinnedNotes />} />
          <Route path="/bookmarks" element={<BookmarkedNotes />} />
          <Route path="/trash" element={<TrashPage />} />
          <Route path="/public" element={<PublicNotes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
