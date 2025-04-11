
import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only allow user with ID 1 (admin) to access this page
  if (!user || user.id !== 1) {
    return <Redirect to="/" />;
  }

  const { data: pendingTransactions, isError } = useQuery({
    queryKey: ["admin", "transactions", "pending"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/transactions/pending");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch pending transactions');
      }
      const data = await res.json();
      return data;
    },
    enabled: !!user && user.id === 1
  });

  const handleApprove = async (txId: number) => {
    try {
      const res = await apiRequest("POST", `/api/admin/transactions/${txId}/approve`, undefined, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to approve transaction');
      
      queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
      toast({
        title: "Success",
        description: "Transaction approved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve transaction",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (txId: number) => {
    try {
      const res = await apiRequest("POST", `/api/admin/transactions/${txId}/reject`, undefined, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to reject transaction');

      queryClient.invalidateQueries({ queryKey: ["admin", "transactions"] });
      toast({
        title: "Success",
        description: "Transaction rejected successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject transaction",
        variant: "destructive",
      });
    }
  };

  if (isError) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
        <div className="text-red-500">Failed to load pending transactions</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <h2 className="text-xl mb-4">Pending Transactions</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!pendingTransactions || pendingTransactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No pending transactions
              </TableCell>
            </TableRow>
          ) : (
            pendingTransactions.map((tx: any) => (
              <TableRow key={tx.id}>
                <TableCell>{tx.userId}</TableCell>
                <TableCell>{tx.type}</TableCell>
                <TableCell>${parseFloat(tx.amount).toFixed(2)}</TableCell>
                <TableCell>{tx.status}</TableCell>
                <TableCell>
                  <button 
                    className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                    onClick={() => handleApprove(tx.id)}
                  >
                    Approve
                  </button>
                  <button 
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => handleReject(tx.id)}
                  >
                    Reject
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
