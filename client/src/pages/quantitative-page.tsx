import React, { useState, useEffect } from "react";
import {
  Bell,
  MessageSquare,
  ArrowRight,
  Clock,
  Zap,
  LineChart,
  Cpu,
  BarChart4,
  Check,
} from "lucide-react";
import Logo from "@/components/logo";
import BottomNav from "@/components/bottom-nav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Define the investment plan interface
interface InvestmentPlan {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  dailyRate: number;
  description: string;
}

// VIP Status indicator component
const VipCard: React.FC<{
  level: number;
  name: string;
  minInvestment: number;
  maxInvestment: number;
  progress: number;
}> = ({ level, name, minInvestment, maxInvestment, progress }) => {
  return (
    <Card className="bg-[#252525] border-[#333333] mb-4 overflow-hidden">
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 h-1.5" />
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <Badge className="bg-amber-600 hover:bg-amber-700 text-xs font-semibold">
            VIP {level}
          </Badge>
          <span className="text-gray-400 text-xs">
            {minInvestment}$ - {maxInvestment}$
          </span>
        </div>
        <h3 className="text-white font-medium text-lg mb-1">{name}</h3>
        <div className="space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Progress</span>
            <span className="text-[#F2C94C]">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="h-1.5 bg-[#333333]"
            style={
              { "--progress-foreground": "#F2C94C" } as React.CSSProperties
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};

const QuantitativePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showTibankInfo, setShowTibankInfo] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Fetch investment plans
  const { data: plans, isLoading } = useQuery<InvestmentPlan[]>({
    queryKey: ["/api/investment/plans"],
  });

  // Fetch user investments and account details
  const { data: userInvestments, isLoading: isLoadingInvestments } = useQuery({
    queryKey: ["/api/investment"],
  });

  // Define account info type
  interface AccountInfoType {
    user: {
      id: number;
      username: string;
      email?: string;
      phone?: string;
      telegram?: string;
      referralCode: string;
      totalAssets: string | number;
      quantitativeAssets: string | number;
      profitAssets: string | number;
      todayEarnings: string | number;
      yesterdayEarnings: string | number;
      lastInvestmentDate?: string;
      createdAt: string;
    };
    stats: {
      totalInvested: number;
      currentBalance: number;
      totalProfit: number;
      activeInvestments: number;
      referralsCount: number;
    };
  }

  // Fetch account info to get lastInvestmentDate
  const { data: accountInfo, isLoading: isLoadingAccount } =
    useQuery<AccountInfoType>({
      queryKey: ["/api/account"],
    });

  // Calculate time remaining for next investment
  useEffect(() => {
    if (accountInfo?.user?.lastInvestmentDate) {
      const lastInvestment = new Date(accountInfo.user.lastInvestmentDate);
      const currentTime = new Date();
      const timeDifference = currentTime.getTime() - lastInvestment.getTime();
      const hoursDifference = timeDifference / (1000 * 60 * 60);

      if (hoursDifference < 24) {
        const hoursRemaining = Math.ceil(24 - hoursDifference);
        setTimeRemaining(hoursRemaining);
      } else {
        setTimeRemaining(null);
      }
    } else {
      setTimeRemaining(null);
    }

    // Update the timer every minute
    const timer = setInterval(() => {
      if (accountInfo?.user?.lastInvestmentDate) {
        const lastInvestment = new Date(accountInfo.user.lastInvestmentDate);
        const currentTime = new Date();
        const timeDifference = currentTime.getTime() - lastInvestment.getTime();
        const hoursDifference = timeDifference / (1000 * 60 * 60);

        if (hoursDifference < 24) {
          const hoursRemaining = Math.ceil(24 - hoursDifference);
          setTimeRemaining(hoursRemaining);
        } else {
          setTimeRemaining(null);
          clearInterval(timer);
        }
      }
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [accountInfo]);

  // Create investment mutation
  const investmentMutation = useMutation({
    mutationFn: async (data: {
      amount: number;
      plan: string;
      dailyRate: number;
    }) => {
      console.log("Investment data:", data);
      const res = await apiRequest("POST", "/api/investment", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create investment");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/investment"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      // Get the instant profit from the response
      const instantProfit = data.instantProfit;

      // Get the VIP level and profit percentage for the toast message
      let vipLevelText = "";
      let profitPercentage = "3%";

      // Show success toast with profit information
      toast({
        title: "Investment Created",
        description: instantProfit
          ? `Successfully invested $${data.amount} in ${data.plan}. You earned ${profitPercentage} ($${instantProfit.toFixed(2)}) instant profit!`
          : `Successfully invested $${data.amount} in ${data.plan}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Investment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [showTradingSimulation, setShowTradingSimulation] = useState(false);
  const [simulationSteps, setSimulationSteps] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Handle starting a new investment
  const handleStartInvestment = async (plan: InvestmentPlan) => {
    // Check if user is in cooldown period
    if (timeRemaining !== null) {
      toast({
        title: "Trading Cooldown Period",
        description: `You can start a new investment in ${timeRemaining} hour${timeRemaining === 1 ? "" : "s"}. Only one trade is allowed every 24 hours.`,
        variant: "destructive",
      });
      return;
    }

    setShowTradingSimulation(true);
    setIsSimulating(true);
    setSimulationSteps([]);

    const steps = [
      "Initializing quantitative trading system...",
      "Analyzing market conditions...",
      "Checking BTC/USDT spread across exchanges...",
      "Found arbitrage opportunity: Binance (76,884.50) → Huobi (76,884.50)",
      "Executing trade...",
      "Trade successful! Profit: +18 USDT",
      "Optimizing position...",
      "Completing investment process...",
    ];

    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSimulationSteps((prev) => [...prev, step]);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSimulating(false);

    // Create the actual investment after simulation
    investmentMutation.mutate({
      amount: plan.minAmount,
      plan: plan.id,
      dailyRate: plan.dailyRate,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black pb-24">
        <header className="bg-[#1E1E1E] p-4 mb-4">
          <Skeleton className="h-10 w-full" />
        </header>
        <div className="px-4 space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

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

      {/* Time Remaining Alert */}
      {timeRemaining !== null && (
        <div className="px-4 mb-4">
          <Alert className="bg-amber-900/30 border-amber-700 text-amber-200">
            <Clock className="h-5 w-5 text-amber-400" />
            <AlertTitle className="ml-2 font-semibold text-amber-300">
              Trading Cooldown Period
            </AlertTitle>
            <AlertDescription className="ml-2 text-amber-200">
              You can start a new investment in {timeRemaining} hour
              {timeRemaining === 1 ? "" : "s"}. Only one quantitative trade is
              allowed every 24 hours.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Introduction to Quantitative Trading */}
      <div className="px-4 mb-6">
        <Card className="bg-[#1E1E1E] border-[#333333] overflow-hidden">
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 h-1" />
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-white text-lg">
                  Quantitative Trading
                </CardTitle>
                <CardDescription className="text-gray-400 text-xs">
                  Automatic algorithmic trading with daily profits
                </CardDescription>
              </div>
              <button
                onClick={() => setShowTibankInfo(true)}
                className="text-[#F2C94C] text-sm hover:text-amber-400 transition-colors"
              >
                Welcome To TIBANK Quantitative Trading
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-center mb-4 bg-[#252525] rounded-lg p-2">
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Investment</p>
                <p className="font-medium text-white">
                  {user?.totalAssets
                    ? parseFloat(user.totalAssets.toString()).toFixed(2)
                    : "0.00"}
                  $
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Quantitative Assets</p>
                <p className="font-medium text-white">
                  {user?.quantitativeAssets
                    ? parseFloat(user.quantitativeAssets.toString()).toFixed(2)
                    : "0.00"}
                  $
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Today's Earnings</p>
                <p className="font-medium text-white">
                  {user?.todayEarnings
                    ? parseFloat(user.todayEarnings.toString()).toFixed(2)
                    : "0.00"}
                  $
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Total Revenue</p>
                <p className="font-medium text-white">
                  {user?.profitAssets
                    ? parseFloat(user.profitAssets.toString()).toFixed(2)
                    : "0.00"}
                  $
                </p>
              </div>
            </div>

            <div className="bg-[#252525] rounded-lg p-2 mb-2">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <div className="bg-[#F2C94C]/10 p-1 rounded-md">
                    <svg
                      className="h-4 w-4 text-[#F2C94C]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <span className="text-gray-200 text-sm">
                    Quantitative Trend (24 Day)
                  </span>
                </div>
                <div>
                  <div className="w-6 h-6 rounded-full bg-[#333333] flex items-center justify-center">
                    <svg
                      className="h-3 w-3 text-[#F2C94C]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="h-32 flex items-center justify-center">
                <div className="h-24 w-full relative">
                  {/* SVG Chart Representation */}
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 300 100"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient
                        id="chartGradient"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="#F2C94C"
                          stopOpacity="0.4"
                        />
                        <stop
                          offset="100%"
                          stopColor="#F2C94C"
                          stopOpacity="0"
                        />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,80 C20,70 40,60 60,40 C80,20 100,30 120,40 C140,50 160,90 180,80 C200,70 220,20 240,30 C260,40 280,60 300,50"
                      fill="none"
                      stroke="#F2C94C"
                      strokeWidth="2"
                    />
                    <path
                      d="M0,80 C20,70 40,60 60,40 C80,20 100,30 120,40 C140,50 160,90 180,80 C200,70 220,20 240,30 C260,40 280,60 300,50 L300,100 L0,100 Z"
                      fill="url(#chartGradient)"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Status */}
      <div className="px-4 mb-6">
        <h2 className="text-white text-lg font-medium mb-4">
          Investment Status
        </h2>
        <div className="space-y-4">
          <VipCard
            level={1}
            name="Quantitative Trading"
            minInvestment={50}
            maxInvestment={500000}
            progress={
              user?.totalAssets
                ? Math.min(
                    100,
                    (parseFloat(user.totalAssets.toString()) / 500000) * 100,
                  )
                : 0
            }
          />
        </div>
      </div>

      {/* Investment Plans */}
      <div className="px-4 pb-20">
        <h2 className="text-white text-lg font-medium mb-4">
          Investment Plans
        </h2>
        <div className="space-y-4">
          {plans?.map((plan) => (
            <Card key={plan.id} className="bg-[#1E1E1E] border-[#333333]">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-white font-medium">{plan.name}</h3>
                    <p className="text-xs text-gray-400">{plan.description}</p>
                  </div>
                  <Badge className="bg-[#F2C94C] hover:bg-amber-500">
                    {plan.dailyRate}% Daily
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">
                      Min Investment
                    </span>
                    <span className="text-white font-medium">
                      ${plan.minAmount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">
                      Max Investment
                    </span>
                    <span className="text-white font-medium">
                      ${plan.maxAmount === 100000 ? "10,000+" : plan.maxAmount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-sm">Daily Profit</span>
                    <span className="text-[#4CAF50] font-medium">
                      {plan.dailyRate}%
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-[#F2C94C] to-[#FFCB8E] text-[#121212] hover:opacity-90 transition-opacity"
                  variant="default"
                  onClick={() => handleStartInvestment(plan)}
                >
                  Start Trading <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Trading Simulation Dialog */}
      <Dialog
        open={showTradingSimulation}
        onOpenChange={setShowTradingSimulation}
      >
        <DialogContent className="bg-[#1E1E1E] border-[#333333] text-white">
          <DialogHeader>
            <DialogTitle>Quantitative Trading Process</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {simulationSteps.map((step, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Check className="h-3 w-3 text-amber-500" />
                </div>
                <p className="text-sm">{step}</p>
              </div>
            ))}
            {isSimulating && (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4">
                  <svg
                    className="animate-spin h-4 w-4 text-amber-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <p className="text-sm text-amber-500">Processing...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* TIBANK Info Dialog */}
      <Dialog open={showTibankInfo} onOpenChange={setShowTibankInfo}>
        <DialogContent className="bg-[#1E1E1E] border-[#333333] text-white max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-white mb-4">
              Welcome To TIBANK Quantitative Trading
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <p>
              Taiwan Community Trading Bank(TIBANK) is a small community trading
              bank that helps people in Taiwan and around the world trade
              currencies. The bank was established in 2011 and is making inroads
              into the African market.
            </p>

            <h3 className="text-[#F2C94C] font-medium mt-4">
              TIBANK automatic quantitative money-making function
            </h3>
            <p>
              TIBANK can buy Bitcoin at a low price from Exchange A within 1
              second, and sell it at a high price on Exchange B to make a
              profit.
            </p>

            <div className="bg-[#252525] p-3 rounded-lg my-4">
              <p>
                Example: (BTC/USDT) is bought at 30743.32 USDT on Binance and
                sold at 30761.32 USDT on Huobi. This transaction can earn 18
                USDT.
              </p>
              <p className="text-amber-400 text-xs mt-2">
                Note: It is impossible for humans to buy at the lowest price and
                sell at the highest price almost at the same time within 1
                second.
              </p>
            </div>

            <h3 className="text-[#F2C94C] font-medium">Key Advantages:</h3>

            <div className="space-y-3">
              <div>
                <h4 className="font-medium mb-1">1. Speed and Accuracy</h4>
                <p className="text-gray-300">
                  TIBANK executes trades with unparalleled speed and accuracy,
                  operating 24/7 through automated algorithms.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">2. Emotion-Free Trading</h4>
                <p className="text-gray-300">
                  TIBANK uses computer programs and algorithms to ensure
                  consistent trading results without emotional bias.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">3. Advanced Backtesting</h4>
                <p className="text-gray-300">
                  Uses historical market data to customize and optimize trading
                  models for maximum profit.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">4. Strict Discipline</h4>
                <p className="text-gray-300">
                  Helps investors stick to established trading plans and avoid
                  human errors in volatile markets.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">5. Market Trend Analysis</h4>
                <p className="text-gray-300">
                  Real-time analysis of market prospects across multiple
                  cryptocurrency categories.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-1">6. Decentralized Trading</h4>
                <p className="text-gray-300">
                  Enables diversified trading across multiple exchanges and
                  trading types automatically.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-600/20 to-amber-500/20 p-4 rounded-lg mt-6">
              <p className="text-center">
                TIBANK has undergone its fourth transformation, expanding
                functionality while simplifying investor transactions. Profits
                can be realized with just one click and waiting for 1-2 minutes.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuantitativePage;