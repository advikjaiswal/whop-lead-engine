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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { workspaceAPI } from "@/lib/api";

// Define the form schema using Zod
const formSchema = z.object({
  whop_api_key: z.string().min(1, "Whop API Key is required."),
  workspace_type: z.enum(["discord", "telegram", "slack"]),
  bot_token: z.string().min(1, "Bot Token is required."),
  stripe_secret_key: z.string().min(1, "Stripe Secret Key is required."),
  paid_product_id: z.string().min(1, "Paid Product ID is required."),
  brand_name: z.string().min(1, "Brand Name is required."),
  community_name: z.string().min(1, "Community Name is required."),
  primary_offer: z.string().min(1, "Primary Offer URL or ID is required."),
  guild_id: z.string().optional(),
  custom_welcome_script: z.string().optional(),
  messaging_tone: z.enum(["aggressive", "friendly", "neutral"]).default("neutral"),
  creator_profile_pic_url: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  discount_code: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function WorkspaceForm() {
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        messaging_tone: "neutral",
    },
  });

  useEffect(() => {
    async function fetchWorkspace() {
      setIsLoading(true);
      try {
        const response = await workspaceAPI.getWorkspace();
        if (response.success && response.data) {
          form.reset(response.data);
          setWorkspaceId(response.data.id);
        }
      } catch (error: any) {
        // It's okay if it fails with a 404, means we need to create one
        if (error.status !== 404) {
            toast.error("Failed to fetch workspace settings.");
        }
        console.error("No workspace found or error fetching:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchWorkspace();
  }, [form]);

  const { setError } = form;

  async function handleValidate(values: FormValues) {
    const promise = () => new Promise(async (resolve, reject) => {
        try {
            const response = await workspaceAPI.validateWorkspaceKeys(values);
            if (response.success && response.data) {
                let allValid = true;
                response.data.forEach((result: any) => {
                    if (!result.is_valid) {
                        allValid = false;
                        setError(result.key_name as keyof FormValues, {
                            type: "manual",
                            message: result.error || "Invalid key.",
                        });
                    }
                });
                if (allValid) {
                    resolve("All keys are valid!");
                } else {
                    reject(new Error("Some keys are invalid. Please check the errors below."));
                }
            } else {
                reject(new Error(response.error || "Validation failed."));
            }
        } catch (error: any) {
            reject(error);
        }
    });

    toast.promise(promise(), {
        loading: "Validating keys...",
        success: (message) => `${message}`,
        error: (err) => `Error: ${err.message}`,
    });
  }

  async function onSubmit(values: FormValues) {
    // Clear previous errors
    form.clearErrors();

    // First, validate keys
    const validationResponse = await workspaceAPI.validateWorkspaceKeys(values);
    if (!validationResponse.success || !validationResponse.data) {
        toast.error("Failed to validate keys. Please try again.");
        return;
    }

    let allValid = true;
    validationResponse.data.forEach((result: any) => {
        if (!result.is_valid) {
            allValid = false;
            setError(result.key_name as keyof FormValues, {
                type: "manual",
                message: result.error || "Invalid key.",
            });
        }
    });

    if (!allValid) {
        toast.error("Some keys are invalid. Please fix them before saving.");
        return;
    }

    // If all keys are valid, proceed with saving
    const promise = () =>
      new Promise(async (resolve, reject) => {
        try {
          let response;
          if (workspaceId) {
            response = await workspaceAPI.updateWorkspace(values);
          } else {
            response = await workspaceAPI.createWorkspace(values);
          }

          if (response.success && response.data) {
            if (!workspaceId) {
                setWorkspaceId(response.data.id);
            }
            resolve(response.data);
          } else {
            reject(new Error(response.error || "An unknown error occurred."));
          }
        } catch (error: any) {
          reject(error);
        }
      });

    toast.promise(promise(), {
      loading: workspaceId ? "Updating workspace..." : "Creating workspace...",
      success: (data) => `Workspace successfully ${workspaceId ? 'updated' : 'created'}!`,
      error: (err) => `Error: ${err.message || "Something went wrong."}`,
    });
  }

  async function handleActivate() {
    const promise = () => new Promise(async (resolve, reject) => {
        try {
            const response = await workspaceAPI.activateWorkspace();
            if (response.success) {
                resolve(response.data);
            } else {
                reject(new Error(response.error || "Activation failed."));
            }
        } catch (error: any) {
            reject(error);
        }
    });

    toast.promise(promise(), {
        loading: "Activating engine...",
        success: (data: unknown) => {
          const response = data as { message?: string };
          return response.message || "Engine activated successfully!";
        },
        error: (err) => `Error: ${err.message}`,
    });
  }

  if (isLoading) {
    return <p>Loading workspace...</p>;
  }

  return (
      <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Column 1 */}
            <div className="space-y-6">
                <FormField
                    control={form.control}
                    name="brand_name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Brand Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., My Awesome Community" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="community_name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Community Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., The Winner's Circle" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="workspace_type"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Workspace Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a platform" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="discord">Discord</SelectItem>
                                <SelectItem value="telegram">Telegram</SelectItem>
                                <SelectItem value="slack">Slack</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                {form.watch("workspace_type") === 'discord' && (
                    <FormField
                        control={form.control}
                        name="guild_id"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Discord Server ID (Guild ID)</FormLabel>
                            <FormControl>
                                <Input placeholder="Your server's unique ID" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                <FormField
                    control={form.control}
                    name="primary_offer"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Primary Offer (URL or ID)</FormLabel>
                        <FormControl>
                            <Input placeholder="https://whop.com/..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="paid_product_id"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Paid Product ID / Plan ID</FormLabel>
                        <FormControl>
                            <Input placeholder="prod_..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Column 2 */}
            <div className="space-y-6">
                <FormField
                    control={form.control}
                    name="whop_api_key"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Whop API Key</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="whop_..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="bot_token"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Bot Token</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="Your bot's secret token" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="stripe_secret_key"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Stripe Secret Key</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="sk_live_..." {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="creator_profile_pic_url"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Creator Profile Pic URL</FormLabel>
                        <FormControl>
                            <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormDescription>Optional: For branding in automated messages.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="discount_code"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Discount Code</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., SAVE10" {...field} />
                        </FormControl>
                        <FormDescription>Optional: A discount code to offer in automations.</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>

        {/* Full-width fields */}
        <div className="space-y-6">
            <FormField
                control={form.control}
                name="custom_welcome_script"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Custom Welcome Script</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="e.g., Hey {username}! Welcome to the community. Ready to level up?"
                        className="resize-y"
                        {...field}
                        />
                    </FormControl>
                    <FormDescription>
                        Use {'{username}'} as a placeholder for the lead's name.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="messaging_tone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Custom DM Tone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a tone" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="aggressive">Aggressive</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormDescription>Set the tone for automated outreach messages.</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button type="submit" className="flex-grow" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : (workspaceId ? 'Update Workspace' : 'Save Configuration')}
            </Button>
            <Button
                type="button"
                variant="outline"
                onClick={() => handleValidate(form.getValues())}
                className="flex-grow"
            >
                Validate Keys
            </Button>
            {workspaceId && (
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleActivate}
                    className="flex-grow bg-green-500 hover:bg-green-600 text-white"
                >
                    Activate Engine
                </Button>
            )}
        </div>
      </form>
    </Form>
  );
}
