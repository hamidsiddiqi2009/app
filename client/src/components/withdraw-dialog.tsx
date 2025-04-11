import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { AlertTriangle } from "lucide-react";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WithdrawDialog: React.FC<WithdrawDialogProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [network, setNetwork] = useState<"tron" | "bsc">("tron");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");
  const [securityPassword, setSecurityPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Calculate maximum amount that can be withdrawn (total assets - 0.5 USDT fee)
  const maxAmount = user ? Math.max(0, parseFloat(user.totalAssets.toString()) - 0.5) : 0;

  const handleWithdraw = async () => {
    const amountNum = parseFloat(amount);
    
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to withdraw",
        variant: "destructive",
      });
      return;
    }

    // Check if today is Friday in UTC+8 timezone (Taiwan time)
    const now = new Date();
    const utc8Hours = now.getUTCHours() + 8;
    const utc8Day = now.getUTCDay();
    const taiwanDay = utc8Hours >= 24 ? (utc8Day + 1) % 7 : utc8Day;
    
    if (taiwanDay !== 5) { // 5 is Friday
      toast({
        title: "Withdrawal unavailable",
        description: "Withdrawals are only available on Fridays (UTC+8 Taiwan time)",
        variant: "destructive",
      });
      return;
    }
    
    if (amountNum < 3) {
      toast({
        title: "Amount too small",
        description: "Minimum withdrawal amount is 3 USDT",
        variant: "destructive",
      });
      return;
    }

    if (amountNum > maxAmount) {
      toast({
        title: "Insufficient balance",
        description: `Maximum withdrawal amount is ${maxAmount.toFixed(2)} USDT (including 0.5 USDT fee)`,
        variant: "destructive",
      });
      return;
    }

    if (!address) {
      toast({
        title: "Missing address",
        description: "Please enter your withdrawal address",
        variant: "destructive",
      });
      return;
    }

    if (!securityPassword) {
      toast({
        title: "Security verification required",
        description: "Please enter your security password",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    try {
      // First verify security password
      const verifyResponse = await apiRequest("POST", "/api/verify-security-password", {
        securityPassword
      });
      
      if (!verifyResponse.ok) {
        const errorData = await verifyResponse.json();
        throw new Error(errorData.message || "Invalid security password");
      }
      
      // Create withdrawal transaction
      const response = await apiRequest("POST", "/api/transactions", {
        type: "Withdrawal",
        amount: amountNum,
        status: "Pending",
        network: network.toUpperCase(),
        address: address,
        fee: 0.5 // USDT fee
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Withdrawal failed");
      }
      
      // Success
      toast({
        title: "Withdrawal Submitted",
        description: "Your withdrawal request has been received and is being processed.",
      });
      
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
      // Close dialog
      onOpenChange(false);
      
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetMaxAmount = () => {
    setAmount(maxAmount.toString());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1E1E1E] text-white border-[#333333]">
        <DialogHeader>
          <DialogTitle className="text-white">Withdraw USDT</DialogTitle>
          <DialogDescription className="text-gray-400">
            Withdraw funds from your account
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tron" className="w-full" onValueChange={(value) => setNetwork(value as "tron" | "bsc")}>
          <TabsList className="grid w-full grid-cols-2 bg-[#252525]">
            <TabsTrigger value="tron" className="data-[state=active]:bg-[#F2C94C] data-[state=active]:text-black">
              USDT-TRC20 (TRON)
            </TabsTrigger>
            <TabsTrigger value="bsc" className="data-[state=active]:bg-[#F2C94C] data-[state=active]:text-black">
              USDT-BEP20 (BSC)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tron" className="mt-4">
            <div className="space-y-4">
              <div className="bg-[#252525] p-3 rounded-lg">
                <p className="text-sm text-gray-300 mb-2">Withdrawal Information</p>
                <p className="text-xs text-gray-400">USDT on Tron Network (TRC20)</p>
                <p className="text-xs text-gray-400">Min withdrawal: 3 USDT</p>
                <p className="text-xs text-gray-400">Fee: 0.5 USDT</p>
                <p className="text-xs text-gray-400">Available on Fridays only (UTC+8)</p>
                <p className="text-xs text-gray-400">Processing time: 6-24 hours</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="tron-amount">Amount (USDT)</Label>
                  <button
                    type="button"
                    className="text-xs text-[#F2C94C] hover:text-[#E0B83C]"
                    onClick={handleSetMaxAmount}
                  >
                    MAX
                  </button>
                </div>
                <Input
                  id="tron-amount"
                  type="number"
                  min="3"
                  step="1"
                  placeholder="Minimum 3 USDT"
                  className="bg-[#252525] border-[#333333] text-white"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-gray-400 flex justify-between">
                  <span>Available: {parseFloat(user?.totalAssets?.toString() || "0").toFixed(2)} USDT</span>
                  <span>Fee: 0.5 USDT</span>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tron-address">TRON (TRC20) Address</Label>
                <Input
                  id="tron-address"
                  placeholder="Enter your TRON wallet address"
                  className="bg-[#252525] border-[#333333] text-white"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="bsc" className="mt-4">
            <div className="space-y-4">
              <div className="bg-[#252525] p-3 rounded-lg">
                <p className="text-sm text-gray-300 mb-2">Withdrawal Information</p>
                <p className="text-xs text-gray-400">USDT on Binance Smart Chain (BEP20)</p>
                <p className="text-xs text-gray-400">Min withdrawal: 3 USDT</p>
                <p className="text-xs text-gray-400">Fee: 0.5 USDT</p>
                <p className="text-xs text-gray-400">Available on Fridays only (UTC+8)</p>
                <p className="text-xs text-gray-400">Processing time: 6-24 hours</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="bsc-amount">Amount (USDT)</Label>
                  <button
                    type="button"
                    className="text-xs text-[#F2C94C] hover:text-[#E0B83C]"
                    onClick={handleSetMaxAmount}
                  >
                    MAX
                  </button>
                </div>
                <Input
                  id="bsc-amount"
                  type="number"
                  min="3"
                  step="1"
                  placeholder="Minimum 3 USDT"
                  className="bg-[#252525] border-[#333333] text-white"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-gray-400 flex justify-between">
                  <span>Available: {parseFloat(user?.totalAssets?.toString() || "0").toFixed(2)} USDT</span>
                  <span>Fee: 0.5 USDT</span>
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bsc-address">BSC (BEP20) Address</Label>
                <Input
                  id="bsc-address"
                  placeholder="Enter your BSC wallet address"
                  className="bg-[#252525] border-[#333333] text-white"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="security-password">Security Password</Label>
            <Input
              id="security-password"
              type="password"
              placeholder="Enter your security password"
              className="bg-[#252525] border-[#333333] text-white"
              value={securityPassword}
              onChange={(e) => setSecurityPassword(e.target.value)}
            />
          </div>
          
          <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-600/30 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-300 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm text-amber-300">Important:</p>
              <p className="text-xs text-amber-200">
                Make sure the address is correct and supports {network === "tron" ? "TRON (TRC20)" : "BSC (BEP20)"} network.
                Sending to the wrong network may result in permanent loss of funds.
              </p>
            </div>
          </div>
          
          <Button 
            className="w-full bg-[#F2C94C] hover:bg-[#E0B83C] text-black"
            onClick={handleWithdraw}
            disabled={submitting}
          >
            {submitting ? "Processing..." : "Withdraw"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawDialog;