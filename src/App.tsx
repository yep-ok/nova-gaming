import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Awards from "@/pages/Awards";
import SuggestedAwards from "@/pages/SuggestedAwards";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/awards" element={<Awards />} />
        <Route path="/suggested-awards" element={<SuggestedAwards />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}