import React, { useState } from "react";
import {
  Bell,
  MessageSquare,
  Wallet,
  RefreshCcw,
  History,
  ShieldCheck,
  Book,
  Newspaper,
  Globe,
  HelpCircle,
  Info,
  Download,
  ArrowLeft,
} from "lucide-react";
import Logo from "@/components/logo";
import BottomNav from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import RechargeDialog from "@/components/recharge-dialog";
import WithdrawDialog from "@/components/withdraw-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const ProfilePage: React.FC = () => {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  // State for dialogs
  const [rechargeDialogOpen, setRechargeDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(false); // New state for Quantization Tutorial

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/auth");
  };

  const handleRechargeClick = () => {
    setRechargeDialogOpen(true);
  };

  const handleWithdrawClick = () => {
    setWithdrawDialogOpen(true);
  };

  const handleAboutClick = () => {
    setAboutDialogOpen(true);
  };

  // Handler for Quantization Tutorial click
  const handleTutorialClick = () => {
    setTutorialDialogOpen(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black pb-24">
        <header className="bg-[#1E1E1E] p-4 mb-4">
          <Skeleton className="h-10 w-full" />
        </header>
        <div className="space-y-4 px-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Verification Alert */}
      {user && user.verificationStatus === 'unverified' && (
        <div className="bg-amber-900/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              <p className="text-amber-500">Please verify your identity to unlock all features</p>
            </div>
            <Button 
              variant="outline" 
              className="text-amber-500 border-amber-500 hover:bg-amber-900/20"
              onClick={() => setLocation('/verify')}
            >
              Verify Now
            </Button>
          </div>
        </div>
      )}

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

      {/* User Account Info */}
      <div className="bg-[#1E1E1E] rounded-lg mx-4 mb-6 p-4">
        <div className="flex items-center mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-[#F2C94C]/20 flex items-center justify-center mr-3">
              <User className="h-5 w-5 text-[#F2C94C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{user.username}</span>
                {user.verificationStatus === 'verified' ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-green-900/20 text-green-500 text-xs">
                    Verified
                  </span>
                ) : user.verificationStatus === 'pending' ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-900/20 text-blue-500 text-xs">
                    Pending
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-900/20 text-amber-500 text-xs">
                    Unverified
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">Copy</div>
            </div>
          </div>
        </div>

        {/* Assets Overview */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-gray-400 text-sm">Total Assets (USDT)</div>
            <div className="text-white font-medium">
              {parseFloat(user.totalAssets.toString()).toFixed(2)}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-gray-400 text-sm">
              Quantitative Account (USDT)
            </div>
            <div className="text-white font-medium">
              {parseFloat(user.quantitativeAssets.toString()).toFixed(2)}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-gray-400 text-sm">Profit Assets (USDT)</div>
            <div className="text-white font-medium">
              {parseFloat(user.profitAssets.toString()).toFixed(2)}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-gray-400 text-sm">Recharge Amount (USDT)</div>
            <div className="text-white font-medium">
              {parseFloat(user.rechargeAmount.toString()).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-around mt-6">
          <button
            className="flex flex-col items-center"
            onClick={handleRechargeClick}
          >
            <div className="w-12 h-12 rounded-full bg-[#252525] flex items-center justify-center mb-1 text-[#F2C94C]">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-xs text-gray-300">Recharge</span>
          </button>
          <button
            className="flex flex-col items-center"
            onClick={handleWithdrawClick}
          >
            <div className="w-12 h-12 rounded-full bg-[#252525] flex items-center justify-center mb-1 text-[#F2C94C]">
              <RefreshCcw className="h-5 w-5" />
            </div>
            <span className="text-xs text-gray-300">Withdraw</span>
          </button>
          <button className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#252525] flex items-center justify-center mb-1 text-[#F2C94C]">
              <History className="h-5 w-5" />
            </div>
            <span className="text-xs text-gray-300">Detail</span>
          </button>
        </div>
      </div>

      {/* Verification Banner */}
      <div className="bg-[#1E1E1E] rounded-lg mx-4 mb-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${user.verificationStatus === 'verified' ? 'bg-green-500/20' : 'bg-amber-500/20'} flex items-center justify-center`}>
              <ShieldCheck className={`h-5 w-5 ${user.verificationStatus === 'verified' ? 'text-green-500' : 'text-amber-500'}`} />
            </div>
            <div>
              <div className="text-white font-medium">Account Status</div>
              <div className="text-sm text-gray-400">Verification required for full access</div>
            </div>
          </div>
          <Button
            variant="outline"
            className={`${user.verificationStatus === 'verified' ? 'text-green-500 border-green-500' : 'text-amber-500 border-amber-500'}`}
            onClick={() => user.verificationStatus !== 'verified' && setLocation('/verify')}
          >
            {user.verificationStatus === 'verified' ? 'Verified' : 'Verify Now'}
          </Button>
        </div>
      </div>

      {/* Total Revenue */}
      <div className="bg-[#1E1E1E] rounded-lg mx-4 mb-6 p-4">
        <div className="text-white font-medium mb-4">Total Revenue</div>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center">
            <div className="text-gray-400 text-xs mb-1">Commission Today</div>
            <div className="text-white font-medium">
              {parseFloat(user.commissionToday.toString()).toFixed(2)}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-400 text-xs mb-1">Today's Earnings</div>
            <div className="text-white font-medium">
              {parseFloat(user.todayEarnings.toString()).toFixed(2)}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-gray-400 text-xs mb-1">
              Yesterday's Earnings
            </div>
            <div className="text-white font-medium">
              {parseFloat(user.yesterdayEarnings.toString()).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Invitation Section */}
      <div className="bg-[#1E1E1E] rounded-lg mx-4 mb-6 p-4">
        <div className="text-white font-medium">Subordinate Invitation</div>
      </div>

      {/* Menu Options */}
      <div className="bg-[#1E1E1E] rounded-lg mx-4 mb-6">
        <a
          href="#security"
          className="flex items-center justify-between p-4 border-b border-[#333333]"
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#252525] flex items-center justify-center mr-3 text-[#F2C94C]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-white">Security Center</span>
          </div>
          <ArrowLeft className="h-4 w-4 text-gray-500 transform rotate-180" />
        </a>

        {/* Replace Quantization Tutorial <a> with a button */}
        <button
          onClick={handleTutorialClick}
          className="flex items-center justify-between p-4 border-b border-[#333333] w-full text-left"
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#252525] flex items-center justify-center mr-3 text-[#F2C94C]">
              <Book className="h-4 w-4" />
            </div>
            <span className="text-white">Quantization Tutorial</span>
          </div>
          <ArrowLeft className="h-4 w-4 text-gray-500 transform rotate-180" />
        </button>

        <a
          href="#news"
          className="flex items-center justify-between p-4 border-b border-[#333333]"
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#252525] flex items-center justify-center mr-3 text-[#F2C94C]">
              <Newspaper className="h-4 w-4" />
            </div>
            <span className="text-white">News</span>
          </div>
          <ArrowLeft className="h-4 w-4 text-gray-500 transform rotate-180" />
        </a>

        <a
          href="#language"
          className="flex items-center justify-between p-4 border-b border-[#333333]"
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#252525] flex items-center justify-center mr-3 text-[#F2C94C]">
              <Globe className="h-4 w-4" />
            </div>
            <span className="text-white">Language Settings</span>
          </div>
          <ArrowLeft className="h-4 w-4 text-gray-500 transform rotate-180" />
        </a>

        <a
          href="#problems"
          className="flex items-center justify-between p-4 border-b border-[#333333]"
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#252525] flex items-center justify-center mr-3 text-[#F2C94C]">
              <HelpCircle className="h-4 w-4" />
            </div>
            <span className="text-white">Common Problem</span>
          </div>
          <ArrowLeft className="h-4 w-4 text-gray-500 transform rotate-180" />
        </a>

        <button
          onClick={handleAboutClick}
          className="flex items-center justify-between p-4 border-b border-[#333333] w-full text-left"
        >
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#252525] flex items-center justify-center mr-3 text-[#F2C94C]">
              <Info className="h-4 w-4" />
            </div>
            <span className="text-white">About Us</span>
          </div>
          <ArrowLeft className="h-4 w-4 text-gray-500 transform rotate-180" />
        </button>

        <a href="#download" className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-[#252525] flex items-center justify-center mr-3 text-[#F2C94C]">
              <Download className="h-4 w-4" />
            </div>
            <span className="text-white">Download APP</span>
          </div>
          <ArrowLeft className="h-4 w-4 text-gray-500 transform rotate-180" />
        </a>
      </div>

      {/* Logout Button */}
      <div className="mx-4 mb-20">
        <Button
          className="w-full py-6 rounded-lg font-medium bg-gradient-to-r from-[#F2C94C] to-[#FFCB8E] text-[#121212] hover:opacity-90 transition-opacity"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
        </Button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Existing Dialogs */}
      <RechargeDialog
        open={rechargeDialogOpen}
        onOpenChange={setRechargeDialogOpen}
      />
      <WithdrawDialog
        open={withdrawDialogOpen}
        onOpenChange={setWithdrawDialogOpen}
      />

      {/* About Us Dialog */}
      <Dialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white border-[#333333]">
          <DialogHeader>
            <DialogTitle className="text-white">About Us</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-4 pr-4 text-gray-300">
              <p>
                Taiwan Community Trading Bank (TBANK) is a small community
                trading bank that helps people in Taiwan and around the world
                trade currencies. The bank was established in 2011 and is making
                inroads into the African market.
              </p>
              <h3 className="text-white font-medium">
                TBANK automatic quantitative money-making function
              </h3>
              <p>
                TBANK can buy Bitcoin at a low price from Exchange A within 1
                second, and then sell it at a high price on Exchange B to make a
                profit.
              </p>
              <p>
                For example: (BTC/USDT) is bought at 30743.32 USDT on Binance
                and sold at 30761.32 USDT on Huobi. This transaction can earn 18
                USDT. Note: It is impossible for humans to buy at the lowest
                price and sell at the highest price almost at the same time
                within 1 second.
              </p>
              <p>
                The big AI model will bring about the fourth industrial
                revolution; and TBANK will take the lead in leading a small
                number of people to get rich through the crypto market.
              </p>
              <p>
                As a one-stop quantitative trading platform, let's talk about
                some of its advantages.
              </p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>
                  <span className="font-semibold">
                    TBANK's speed and accuracy
                  </span>
                  <br />
                  Speed and accuracy play a decisive role in trading results. In
                  the fast-paced and volatile market, a difference of a few
                  seconds can have a profound impact on the results.
                  <br />
                  Manual trading has restricted operating speed, while the TBANK
                  system automatically places orders (buy low and sell high) in
                  a very short time once it detects a cryptocurrency that meets
                  the trading criteria. It executes instructions, including
                  profit targets and stop losses, with unparalleled speed and
                  accuracy based on pre-written codes and algorithms.
                  <br />
                  Instructions are executed immediately without delay, which may
                  increase losses if executed manually. TBANK has a variety of
                  indicators and performs quantitative analysis through
                  algorithms 24/7 to ensure that investors get the best results.
                </li>
                <li>
                  <span className="font-semibold">
                    TBANK is not affected by human emotions
                  </span>
                  <br />
                  Being carried away and losing one's soul is a psychological
                  process that most traders go through. TBANK uses computer
                  programs and written algorithms to ensure specific trading
                  results, and the process is automated.
                  <br />
                  TBANK is not affected by human emotions and human errors.
                  Control emotions and prevent over-trading, thus avoiding
                  common risks for investors.
                </li>
                <li>
                  <span className="font-semibold">
                    TBANK's strong backtesting capabilities
                  </span>
                  <br />
                  TBANK uses historical market conditions and transaction data
                  to intelligently customize quantitative trading models
                  (multiple models), choose models suitable for current market
                  performance for trading, make profits in the first place, and
                  continuously iterate algorithms to maximize profits.
                </li>
                <li>
                  <span className="font-semibold">
                    TBANK and strict discipline
                  </span>
                  <br />
                  One reason why traders often suffer heavy losses is a lack of
                  discipline, either due to fear of losses or a desire to
                  increase profits.
                  <br />
                  TBANK can help investors stick to established trading plans in
                  volatile markets and avoid human errors. For example, if you
                  want to trade 100 USDT, you will not mistakenly write it as
                  1000 USDT.
                </li>
                <li>
                  <span className="font-semibold">
                    TBANK grasps market trends
                  </span>
                  <br />
                  TBANK can analyze the market prospects of large groups and
                  different categories of cryptocurrencies in real time, and
                  control market transaction nodes through a grading system.
                </li>
                <li>
                  <span className="font-semibold">
                    TBANK automatically achieves decentralized transactions
                  </span>
                  <br />
                  With TBANK, you can use N trading strategies to diversify your
                  risk across multiple exchanges and multiple trading types.
                  Doing this manually can be time-consuming, tedious,
                  inaccurate, and risky.
                  <br />
                  TBANK provides investors with the ability to diversify their
                  trading through multiple trading systems while creating hedges
                  for losing positions. It helps investors achieve stability in
                  their trading positions.
                  <br />
                  Compared with manually managing transactions, TBANK can handle
                  a wider range of portfolios intelligently and quickly at a
                  lower cost. It can change with the market to maximize profits.
                </li>
              </ol>
              <p>
                Today, TBANK has undergone its fourth transformation, expanding
                more functions while simplifying investors' transactions.
                Profits can be realized with just one click and waiting for 1-2
                minutes. This is undoubtedly the future of investors.
              </p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Quantization Tutorial Dialog */}
      <Dialog open={tutorialDialogOpen} onOpenChange={setTutorialDialogOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white border-[#333333]">
          <DialogHeader>
            <DialogTitle className="text-white">
              Quantization Tutorial
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="space-y-4 pr-4 text-gray-300">
              <p>
                The Minimum deposit amount for Tbank quantitative trading is
                50USDT, and the minimum withdrawal amount is 3USDT. The
                withdrawal fee is 0.5USDT and the funds will be credited to your
                account within three minutes.
              </p>
              <p className="border-t border-gray-600 pt-2">===========</p>
              <p className="font-semibold">✔How to make money:</p>
              <ol className="list-decimal pl-4 space-y-2">
                <li>
                  Invest now and earn 3% per day (weekly cash Withdrawals are
                  available every Fridays)
                </li>
                <li>
                  Invite others to participate and get 12% referral commission✔
                </li>
              </ol>
              <p>
                <span className="font-semibold">
                  Quantification Trade time:
                </span>{" "}
                Trading Time at is 11am Taipei Time Zone(UTC +8)
              </p>
              <p>
                <span className="font-semibold">Withdrawal days:</span> Fridays
                Only
              </p>
              <p>
                <span className="font-semibold">Online customer service:</span>{" "}
                <a
                  href="https://t.me/Tbankofficial1"
                  className="text-[#F2C94C] underline"
                >
                  https://t.me/Tbankofficial1
                </a>
              </p>
              <p>
                <span className="font-semibold">Note:</span> The stored value is
                used to open the corresponding level and obtain the current
                level percentage benefit.
                <br />
                For example, if you deposit 100 USDT, the quantitative profit of
                a single transaction is 100×3%=3 USDT
              </p>
              <p className="bg-amber-900/20 p-2 rounded">
                <span className="font-semibold">Special reminder:</span>{" "}
                Transfer the amount you earn to AI quantification to quickly
                accumulate wealth
              </p>
              <p className="border-t border-gray-600 pt-2">===========</p>
              <p>
                <span className="font-semibold">Please note:</span> The first
                deposit amount of the invitee must be greater than 50 USDT! ! !
                <br />
                The bonus can be withdrawn immediately. The more users you
                recommend, the more commission rewards you will get. The
                commissions collected from the recommended users will go
                directly into your member account and you can withdraw them
                directly!
              </p>
              <p className="font-semibold">
                ------Invite team charging reward--------
              </p>
              <p>1: Get 12% of the deposit of level 1 team members</p>
              <p className="border-t border-gray-600 pt-2">
                --------------------------------------------------
              </p>
              <p>
                The first-level team can receive commission income every day =
                100*12%*10 people = 120 USDT
              </p>
              <p className="border-t border-gray-600 pt-2">
                ---------------------------------------------------
              </p>
              <p>
                Tbank team daily deposit reward Your team can only deposit the
                value as a reward within 24 hours
              </p>
              <p className="text-sm text-gray-400">
                Please note: If you meet the requirements, please contact
                customer service within 24 hours to claim your reward. Once the
                deadline has passed, it will be considered invalid and your team
                must recalculate within 24 hours. The final right of
                interpretation belongs to this platform.
              </p>
              <p className="border-t border-gray-600 pt-2">
                ---------------------------------------------------
              </p>
              <p className="text-sm text-gray-400">
                Tbank works with bloggers on multiple social platforms (such as
                Twitter, YouTube, TikTok, Facebook, Instagram, etc.) to promote
                bloggers’ tweets, videos and posts and increase account data
                (views, clicks, etc.) (Likes, reposts, fans, etc.) Help
                accounts achieve traffic growth. The final right of
                interpretation belongs to this platform.
              </p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;

// User icon component for profile
function User({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}