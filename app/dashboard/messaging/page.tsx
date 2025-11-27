"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Bot } from "lucide-react";
import { messagingAPI } from "@/lib/api";
import { toast } from "sonner";
import { MessageFlowForm } from "@/components/message-flow-form";

export default function MessagingPage() {
  const [flows, setFlows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<any | null>(null);

  const fetchFlows = async () => {
    setIsLoading(true);
    try {
      const response = await messagingAPI.getMessageFlows();
      if (response.success) {
        setFlows(response.data || []);
      } else {
        toast.error("Failed to fetch message flows.");
      }
    } catch (error) {
      toast.error("An error occurred while fetching message flows.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  const handleSave = () => {
    setIsDialogOpen(false);
    fetchFlows(); // Refresh the list
  };

  const handleOpenDialog = (flow: any | null = null) => {
    setSelectedFlow(flow);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Messaging Flows</h3>
          <p className="text-sm text-muted-foreground">
            Manage your automated outreach sequences.
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Flow
        </Button>
      </div>

      {isLoading ? (
        <p>Loading flows...</p>
      ) : flows.length === 0 ? (
        <div className="p-6 border rounded-lg bg-card text-card-foreground text-center">
          <p className="text-muted-foreground">
            You haven't created any messaging flows yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows.map((flow) => (
            <div key={flow.id} className="p-4 border rounded-lg bg-card flex flex-col justify-between">
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <Bot className="h-5 w-5 text-primary"/>
                        <h4 className="font-semibold">{flow.name}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {flow.welcome_message || "No welcome message set."}
                    </p>
                </div>
                <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(flow)}>
                        Edit
                    </Button>
                </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedFlow ? "Edit Flow" : "Create New Flow"}</DialogTitle>
          </DialogHeader>
          <MessageFlowForm
            flow={selectedFlow}
            onSave={handleSave}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
