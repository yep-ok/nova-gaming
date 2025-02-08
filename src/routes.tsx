
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Awards from "./pages/Awards";
import Messages from "./pages/Messages";
import SuggestedAwards from "./pages/SuggestedAwards";
import FeatureRequests from "./pages/FeatureRequests";
import Bank from "./pages/Bank";
import NotFound from "./pages/NotFound";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  if (!session) {
    return <Navigate to={`/?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/awards"
        element={
          <ProtectedRoute>
            <Awards />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/suggested-awards"
        element={
          <ProtectedRoute>
            <SuggestedAwards />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feature-requests"
        element={
          <ProtectedRoute>
            <FeatureRequests />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bank"
        element={
          <ProtectedRoute>
            <Bank />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
