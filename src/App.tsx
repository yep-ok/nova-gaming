import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";
import Awards from "./pages/Awards";
import Messages from "./pages/Messages";
import SuggestedAwards from "./pages/SuggestedAwards";
import NotFound from "./pages/NotFound";
import "./App.css";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/awards" element={<Awards />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/suggested-awards" element={<SuggestedAwards />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;