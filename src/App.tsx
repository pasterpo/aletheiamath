import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Learn from "./pages/Learn";
import Problems from "./pages/Problems";
import IMO2027 from "./pages/IMO2027";
import Duels from "./pages/Duels";
import Leaderboard from "./pages/Leaderboard";
import AdminDashboard from "./pages/AdminDashboard";
import AletheiaRating from "./pages/AletheiaRating";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/problems" element={<Problems />} />
            <Route path="/imo-2027" element={<IMO2027 />} />
            <Route path="/duels" element={<Duels />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/aletheia-rating" element={<AletheiaRating />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
