import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Awards from "./pages/Awards";
import Messages from "./pages/Messages";
import SuggestedAwards from "./pages/SuggestedAwards";
import NotFound from "./pages/NotFound";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/awards" element={<Awards />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/suggested-awards" element={<SuggestedAwards />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}