import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { AppRoutes } from "@/routes";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" attribute="class">
          <AppRoutes />
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;