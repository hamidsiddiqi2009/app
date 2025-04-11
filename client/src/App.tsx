import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { LanguageSelector } from "@/components/language-selector";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ProfilePage from "@/pages/profile-page";
import VerificationPage from "@/pages/verification-page";
import InvitePage from "@/pages/invite-page";
import QuantitativePage from "@/pages/quantitative-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import ResetPasswordPage from "./pages/reset-password-page";
import AdminPage from "./pages/admin-page";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />{" "}
      {/* Updated reset password route */}
      {/* Protected routes */}
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/verify" component={VerificationPage} />
      <ProtectedRoute path="/invite" component={InvitePage} />
      <ProtectedRoute path="/quantitative" component={QuantitativePage} />
      <ProtectedRoute path="/admin" component={AdminPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div
          id="google_translate_element"
          className="fixed top-0 right-0 mt-4 mr-16 z-50"
        ></div>
        <div className="fixed top-0 right-0 mt-4 mr-4 z-50">
          <LanguageSelector />
        </div>
        <div className="min-h-screen bg-black text-gray-200">
          <Router />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
