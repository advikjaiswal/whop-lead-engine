"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { messagingAPI } from "@/lib/api";
import { MessageFlow } from "@/types";

const formSchema = z.object({
  name: z.string().min(1, "Flow name is required."),
  welcome_message: z.string().optional(),
  follow_up_sequence: z.string().optional(),
  offer_push: z.string().optional(),
  abandoned_funnel_ping: z.string().optional(),
  winback_attempt: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface MessageFlowFormProps {
  flow?: MessageFlow; // The flow object to edit, if any
  onSave: () => void; // Callback to refresh the list after saving
  onCancel: () => void;
}

export function MessageFlowForm({ flow, onSave, onCancel }: MessageFlowFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: flow || {
      name: "",
      welcome_message: "Hey {{user}}! Saw you were interested in {{niche}}. Welcome to the community!",
    },
  });

  async function onSubmit(values: FormValues) {
    const promise = () =>
      new Promise(async (resolve, reject) => {
        try {
          let response;
          if (flow?.id) {
            response = await messagingAPI.updateMessageFlow(flow.id, values);
          } else {
            response = await messagingAPI.createMessageFlow(values);
          }

          if (response.success) {
            resolve(response.data);
            onSave(); // Trigger refresh
          } else {
            reject(new Error(response.error || "An unknown error occurred."));
          }
        } catch (error: any) {
          reject(error);
        }
      });

    toast.promise(promise(), {
      loading: flow?.id ? "Updating flow..." : "Creating flow...",
      success: `Flow successfully ${flow?.id ? 'updated' : 'created'}!`,
      error: (err) => `Error: ${err.message}`,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Flow Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Default Welcome Sequence" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="welcome_message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Welcome Message</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="The first message sent to a new lead." {...field} />
              </FormControl>
              <FormDescription>Use variables like {'{{user}}'}, {'{{niche}}'}, etc.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="follow_up_sequence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Follow-up Sequence</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="e.g., 24h: Hey {{user}}, just checking in!" {...field} />
              </FormControl>
              <FormDescription>Define follow-ups, e.g., one per line with a time offset.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Flow"}
            </Button>
        </div>
      </form>
    </Form>
  );
}