
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle } from "lucide-react";
import BottomNav from "@/components/bottom-nav";

const VerificationPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await fetch('/api/verify/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Document uploaded successfully",
          description: "We will review your document and update your verification status",
        });
        setIsVerified(true);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      <div className="p-4">
        <Card className="bg-[#1E1E1E] border-[#333333]">
          <CardHeader>
            <CardTitle className="text-white">Identity Verification</CardTitle>
            <CardDescription>
              Upload a valid government-issued ID document to verify your identity
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isVerified ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-white text-lg font-medium mb-2">Verification Submitted</h3>
                <p className="text-gray-400">
                  Your document is under review. This usually takes 1-2 business days.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-[#333333] rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-[#F2C94C] mx-auto mb-4" />
                  <div className="space-y-2">
                    <h3 className="text-white font-medium">Upload your document</h3>
                    <p className="text-sm text-gray-400">
                      Supported formats: JPG, PNG, PDF (max 5MB)
                    </p>
                  </div>
                  <Input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Select File
                  </Button>
                </div>
                {file && (
                  <div className="bg-[#252525] p-3 rounded flex items-center justify-between">
                    <span className="text-white truncate">{file.name}</span>
                    <Button
                      type="submit"
                      className="bg-[#F2C94C] text-black hover:bg-[#E0B83C]"
                      disabled={isUploading}
                    >
                      {isUploading ? "Uploading..." : "Upload Document"}
                    </Button>
                  </div>
                )}
                <div className="mt-6 space-y-2">
                  <h4 className="text-white font-medium">Accepted Documents:</h4>
                  <ul className="list-disc list-inside text-gray-400 text-sm">
                    <li>International Passport</li>
                    <li>Driver's License</li>
                    <li>National ID Card</li>
                    <li>Government-issued Photo ID</li>
                  </ul>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
};

export default VerificationPage;
