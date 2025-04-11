import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/logo";
import AuthTabs from "@/components/auth-tabs";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  // Extract referral code from URL if present
  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    
    if (ref) {
      setReferralCode(ref);
      // Switch to register mode if we have a referral code
      setMode("register");
    }
  }, [location]);

  // Redirect if already logged in
  if (!isLoading && user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen dark-pattern bg-black pb-10">
      <div className="max-w-md mx-auto pt-10 px-4">
        {/* Back Button */}
        <div className="flex justify-start items-center mb-6">
          <button 
            className="text-white opacity-80 hover:opacity-100"
            onClick={() => {
              if (mode === "register") {
                setMode("login");
              }
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
        
        {/* Logo and Brand */}
        <div className="flex flex-col items-center mb-10">
          <Logo size="medium" />
        </div>

        {/* Auth Container */}
        <div className="bg-[#1E1E1E] rounded-2xl p-5 mb-4">
          <AuthTabs mode={mode} onModeChange={setMode} referralCode={referralCode} />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
