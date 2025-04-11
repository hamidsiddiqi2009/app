import React, { useEffect, useState } from "react";
import {
  Bell,
  MessageSquare,
  Copy,
  Share2,
  Loader2,
  Plus,
  User,
  Calendar,
} from "lucide-react";
import Logo from "@/components/logo";
import BottomNav from "@/components/bottom-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { generateQRCode, formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

// Define types for referrals
interface ReferredUser {
  id: number;
  username: string;
  createdAt: string;
}

interface ReferralDetail {
  id: number;
  level: number;
  commission: number;
  referredUser: ReferredUser;
}

interface ProfileResponse {
  profile: any;
  referrals: ReferralDetail[];
}

const InvitePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralLink, setReferralLink] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [inviteCodes, setInviteCodes] = useState<any[]>([]);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [referrals, setReferrals] = useState<ReferralDetail[]>([]);
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(false);

  // Fetch user's invites and profile data when component mounts
  useEffect(() => {
    if (user) {
      fetchInviteCodes();
      fetchProfileData();

      if (user.referralCode) {
        const link = `${window.location.origin}/auth?ref=${user.referralCode}`;
        setReferralLink(link);
        try {
          setQrCodeUrl(generateQRCode(link));
        } catch (error) {
          console.error("Error generating QR code:", error);
          // Fallback to a default empty QR that won't break the UI
          setQrCodeUrl(
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
          );
        }
      }
    }
  }, [user]);

  // Fetch invite codes from the server
  const fetchInviteCodes = async () => {
    try {
      const res = await apiRequest("GET", "/api/invite-codes");
      const data = await res.json();
      setInviteCodes(data);
    } catch (error) {
      console.error("Error fetching invite codes:", error);
      toast({
        title: "Error",
        description: "Failed to load invite codes",
        variant: "destructive",
      });
    }
  };

  // Fetch profile data including referrals
  const fetchProfileData = async () => {
    try {
      setIsLoadingReferrals(true);
      const res = await apiRequest("GET", "/api/profile");
      const data: ProfileResponse = await res.json();
      setReferrals(data.referrals || []);
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast({
        title: "Error",
        description: "Failed to load team information",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReferrals(false);
    }
  };

  // Generate a new invite code
  const generateInviteCode = async () => {
    try {
      setIsGeneratingCode(true);
      const res = await apiRequest("POST", "/api/invite-code");
      const data = await res.json();

      // Add new code to the list
      setInviteCodes((prev) => [data, ...prev]);

      toast({
        title: "Success",
        description: "New invite code generated successfully",
      });
    } catch (error) {
      console.error("Error generating invite code:", error);
      toast({
        title: "Error",
        description: "Failed to generate invite code",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) {
      toast({
        title: "Error",
        description: "No referral link available to copy",
        variant: "destructive",
      });
      return;
    }

    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: "Referral link copied to clipboard",
        });
      },
      (err) => {
        toast({
          title: "Failed to copy",
          description: "Could not copy to clipboard",
          variant: "destructive",
        });
      },
    );
  };

  const shareReferralLink = async () => {
    if (!referralLink) {
      toast({
        title: "Error",
        description: "No referral link available to share",
        variant: "destructive",
      });
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join CryptoGrow",
          text: "Use my referral link to join CryptoGrow and earn crypto rewards!",
          url: referralLink,
        });
        toast({
          title: "Shared!",
          description: "Referral link shared successfully",
        });
      } catch (error) {
        toast({
          title: "Share failed",
          description: "Could not share link",
          variant: "destructive",
        });
      }
    } else {
      copyToClipboard(referralLink);
    }
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <header className="bg-[#1E1E1E] p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Logo size="small" />
          </div>
          <div className="flex items-center space-x-3">
            <button className="w-6 h-6 flex items-center justify-center rounded-full bg-[#252525] text-white">
              <Bell className="h-4 w-4" />
            </button>
            <button className="w-6 h-6 flex items-center justify-center rounded-full bg-[#252525] text-white">
              <MessageSquare className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 space-y-6">
        

        <Card className="bg-[#1E1E1E] border-[#333333]">
          <CardHeader>
            <CardTitle className="text-white">Referral Rewards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <p className="text-gray-400 text-sm">
                Your referral code can be used unlimited times. Earn commission
                from each referral when they make investments!
              </p>

              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-[#F2C94C]/10 flex items-center justify-center mr-3">
                    <span className="text-[#F2C94C] font-bold">1</span>
                  </div>
                  <span className="text-white">Commission Rate</span>
                </div>
                <span className="text-[#F2C94C] font-bold">12%</span>
              </div>

              <div className="bg-[#F2C94C]/10 p-3 rounded-lg border border-[#F2C94C]/30">
                <p className="text-[#F2C94C] font-semibold">
                  12% Commission on Level 1 Referrals!
                </p>
                <p className="text-sm text-gray-300 mt-1">
                  Each time your direct referral makes an investment, you'll
                  earn a 12% commission instantly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#333333]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Invite Codes</CardTitle>
            <Button
              onClick={generateInviteCode}
              disabled={isGeneratingCode}
              className="bg-[#F2C94C] text-[#121212] hover:bg-[#E0B845]"
            >
              {isGeneratingCode ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Code
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {inviteCodes.length > 0 ? (
              <div className="space-y-3">
                <p className="text-gray-400 text-sm mb-2">
                  Share these codes with friends to invite them to CryptoGrow.
                  Each code can be used multiple times.
                </p>
                <div className="divide-y divide-[#333333]">
                  {inviteCodes.map((code) => (
                    <div
                      key={code.id}
                      className="py-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-[#F2C94C] font-mono font-bold">
                          {code.code}
                        </p>
                        <p className="text-xs text-gray-400">
                          Created:{" "}
                          {new Date(code.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="text-[#F2C94C] hover:text-[#E0B845]"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>You haven't generated any invite codes yet</p>
                <p className="mt-2 text-sm">
                  Generate and share invite codes to allow friends to register!
                </p>
                <Button
                  onClick={generateInviteCode}
                  disabled={isGeneratingCode}
                  className="mt-4 bg-[#F2C94C] text-[#121212] hover:bg-[#E0B845]"
                >
                  {isGeneratingCode ? "Generating..." : "Generate First Code"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-[#333333]">
          <CardHeader>
            <CardTitle className="text-white">My Team</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingReferrals ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#F2C94C]" />
              </div>
            ) : referrals.length > 0 ? (
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Your team members who registered using your invite codes or
                  referral link.
                </p>
                <div className="space-y-3 divide-y divide-[#333333]">
                  {referrals.map((referral) => (
                    <div key={referral.id} className="pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="bg-[#252525] w-10 h-10 rounded-full flex items-center justify-center mr-3">
                            <User className="h-5 w-5 text-[#F2C94C]" />
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {referral.referredUser.username}
                            </p>
                            <div className="flex items-center text-xs text-gray-400">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(referral.referredUser.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[#F2C94C] font-semibold">
                            {referral.commission > 0
                              ? formatCurrency(referral.commission)
                              : "Level " + referral.level}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>You haven't invited anyone yet</p>
                <p className="mt-2 text-sm">
                  Share your invite code with unlimited friends to earn
                  commissions!
                </p>
                <p className="mt-2 text-sm text-[#F2C94C]">
                  Each time your referrals invest, you earn 12% commission
                  instantly.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default InvitePage;
