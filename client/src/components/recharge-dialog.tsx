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
import { Copy } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface RechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RechargeDialog: React.FC<RechargeDialogProps> = ({ open, onOpenChange }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [network, setNetwork] = useState<"tron" | "bsc">("tron");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"amount" | "address">("amount");
  
  // These would typically come from your backend in a real implementation
  const addresses = {
    tron: "TBMnamBQLj3Cy9aC1eZm2hfBT8u7odsgfr",
    bsc: "0xf0d3b31fe7dddf2cde60497e8e94b8187a68cbe2"
  };

  const handleRecharge = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to recharge",
        variant: "destructive",
      });
      return;
    }

    setStep("address");
    
    // In a real implementation, you would create a transaction record on your backend
    try {
      await apiRequest("POST", "/api/transactions", {
        type: "Deposit",
        amount: parseFloat(amount),
        status: "Pending",
        network: network.toUpperCase()
      });
      
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      
    } catch (error) {
      console.error("Error creating transaction record:", error);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address).then(
      () => {
        toast({
          title: "Copied!",
          description: "Address copied to clipboard",
        });
      },
      (err) => {
        toast({
          title: "Failed to copy",
          description: "Could not copy address to clipboard",
          variant: "destructive",
        });
      }
    );
  };

  const resetDialog = () => {
    setStep("amount");
    setAmount("");
  };

  return (
    <Dialog open={open} onOpenChange={(value) => {
      if (!value) resetDialog();
      onOpenChange(value);
    }}>
      <DialogContent className="bg-[#1E1E1E] text-white border-[#333333]">
        <DialogHeader>
          <DialogTitle className="text-white">Recharge USDT</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add funds to your account using USDT
          </DialogDescription>
        </DialogHeader>

        {step === "amount" ? (
          <>
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
                    <p className="text-sm text-gray-300 mb-2">Network Information</p>
                    <p className="text-xs text-gray-400">USDT on Tron Network (TRC20)</p>
                    <p className="text-xs text-gray-400">Min deposit: 50 USDT</p>
                    <p className="text-xs text-gray-400">10% welcome bonus on first deposit</p>
                    <p className="text-xs text-gray-400">Processing time: 1-5 minutes</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tron-amount">Enter Amount (USDT)</Label>
                    <Input
                      id="tron-amount"
                      type="number"
                      min="50"
                      step="1"
                      placeholder="Minimum 50 USDT"
                      className="bg-[#252525] border-[#333333] text-white"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="bsc" className="mt-4">
                <div className="space-y-4">
                  <div className="bg-[#252525] p-3 rounded-lg">
                    <p className="text-sm text-gray-300 mb-2">Network Information</p>
                    <p className="text-xs text-gray-400">USDT on Binance Smart Chain (BEP20)</p>
                    <p className="text-xs text-gray-400">Min deposit: 50 USDT</p>
                    <p className="text-xs text-gray-400">10% welcome bonus on first deposit</p>
                    <p className="text-xs text-gray-400">Processing time: 3-10 minutes</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bsc-amount">Enter Amount (USDT)</Label>
                    <Input
                      id="bsc-amount"
                      type="number"
                      min="50"
                      step="1"
                      placeholder="Minimum 50 USDT"
                      className="bg-[#252525] border-[#333333] text-white"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <Button 
              className="w-full bg-[#F2C94C] hover:bg-[#E0B83C] text-black"
              onClick={handleRecharge}
            >
              Continue
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#252525] p-4 rounded-lg text-center">
              <p className="text-sm text-gray-300 mb-2">Send exactly</p>
              <p className="text-2xl font-bold text-[#F2C94C] mb-2">{amount} USDT</p>
              <p className="text-xs text-gray-400">
                on {network === "tron" ? "TRON (TRC20)" : "BSC (BEP20)"} network
              </p>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">To this address:</Label>
              <div className="flex items-center bg-[#252525] p-3 rounded-lg">
                <p className="text-xs text-gray-300 flex-1 font-mono break-all">
                  {network === "tron" ? addresses.tron : addresses.bsc}
                </p>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-[#F2C94C] hover:text-[#E0B83C] hover:bg-transparent ml-2"
                  onClick={() => copyAddress(network === "tron" ? addresses.tron : addresses.bsc)}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 bg-amber-900/20 p-3 rounded-lg border border-amber-600/30">
              <p className="text-sm text-amber-300">Important:</p>
              <ul className="list-disc list-inside text-xs text-amber-200 space-y-1">
                <li>Only send USDT on the {network === "tron" ? "TRON (TRC20)" : "BSC (BEP20)"} network</li>
                <li>Sending any other token may result in permanent loss</li>
                <li>Include your user ID: {user?.id} in the memo/description if possible</li>
              </ul>
            </div>
            
            <Button 
              className="w-full bg-[#F2C94C] hover:bg-[#E0B83C] text-black"
              onClick={() => onOpenChange(false)}
            >
              I've made the payment
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RechargeDialog;