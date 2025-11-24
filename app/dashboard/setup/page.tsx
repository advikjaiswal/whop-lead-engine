"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CheckCircle, AlertCircle, Loader2, Zap, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { workspaceAPI } from "@/lib/api"

// Schema matching the checklist requirements
const setupSchema = z.object({
    whopApiKey: z.string().min(1, "Whop API Key is required"),
    workspaceType: z.enum(["discord", "telegram", "slack"]),
    botToken: z.string().min(1, "Bot Token is required"),
    stripeSecretKey: z.string().min(1, "Stripe Secret Key is required"),
    paidProductId: z.string().min(1, "Paid Product ID is required"),
    brandName: z.string().min(1, "Brand Name is required"),
    communityName: z.string().min(1, "Community Name is required"),
    primaryOffer: z.string().min(1, "Primary Offer URL/ID is required"),
    // Optional
    messagingTone: z.enum(["aggressive", "friendly", "neutral"]).default("neutral"),
    guildId: z.string().optional().describe("Required for Discord"),
})

type SetupForm = z.infer<typeof setupSchema>

export default function SetupPage() {
    const router = useRouter()
    const [step, setStep] = React.useState<"form" | "validating" | "activating" | "success">("form")
    const [validationResults, setValidationResults] = React.useState<any[]>([])
    const [error, setError] = React.useState("")

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<SetupForm>({
        resolver: zodResolver(setupSchema),
        defaultValues: {
            workspaceType: "discord",
            messagingTone: "neutral",
        },
    })

    const workspaceType = watch("workspaceType")

    const onSubmit = async (data: SetupForm) => {
        setError("")
        setStep("validating")

        try {
            // 1. Validate Keys
            const validationRes = await workspaceAPI.validateWorkspaceKeys({
                whop_api_key: data.whopApiKey,
                stripe_secret_key: data.stripeSecretKey,
                bot_token: data.botToken,
                workspace_type: data.workspaceType
            })

            if (validationRes.success && validationRes.data) {
                setValidationResults(validationRes.data)

                const allValid = validationRes.data.every((r: any) => r.is_valid)
                if (!allValid) {
                    setStep("form")
                    toast.error("Some keys are invalid. Please check the errors.")
                    return
                }
            } else {
                throw new Error(validationRes.error || "Validation failed")
            }

            // 2. Create Workspace Record
            await workspaceAPI.createWorkspace({
                whop_api_key: data.whopApiKey,
                workspace_type: data.workspaceType,
                bot_token: data.botToken,
                stripe_secret_key: data.stripeSecretKey,
                paid_product_id: data.paidProductId,
                brand_name: data.brandName,
                community_name: data.communityName,
                primary_offer: data.primaryOffer,
                messaging_tone: data.messagingTone,
                guild_id: data.guildId
            })

            // 3. Activate Engine
            setStep("activating")
            const activationRes = await workspaceAPI.activateWorkspace()

            if (activationRes.success) {
                setStep("success")
                toast.success("Growth Engine Activated!")
            } else {
                throw new Error(activationRes.message || "Activation failed")
            }

        } catch (err: any) {
            console.error(err)
            setError(err.message || "An error occurred during setup.")
            setStep("form")
        }
    }

    if (step === "success") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-full bg-green-100 p-6 dark:bg-green-900/20"
                >
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </motion.div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Your Growth Engine Is Now Live</h1>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        We've successfully connected to your workspace, installed the bot, and initialized your lead harvesting pipelines.
                    </p>
                </div>
                <Button size="lg" onClick={() => router.push("/dashboard")}>
                    Go to Dashboard
                </Button>
            </div>
        )
    }

    if (step === "activating" || step === "validating") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-semibold">
                        {step === "validating" ? "Validating Credentials..." : "Activating Growth Engine..."}
                    </h2>
                    <p className="text-muted-foreground">
                        {step === "validating"
                            ? "Checking your API keys and permissions."
                            : "Installing bot, creating channels, and loading sequences."}
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Workspace Setup</h1>
                    <p className="text-muted-foreground">
                        Configure your growth engine to start generating leads.
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {validationResults.length > 0 && (
                    <div className="space-y-2">
                        {validationResults.map((res, idx) => (
                            <Alert key={idx} variant={res.is_valid ? "default" : "destructive"}>
                                {res.is_valid ? <ShieldCheck className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                <AlertTitle>{res.key_name}</AlertTitle>
                                <AlertDescription>{res.is_valid ? "Valid" : res.error}</AlertDescription>
                            </Alert>
                        ))}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                        <CardDescription>
                            Enter your platform details to connect the engine.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                            {/* Workspace Type */}
                            <div className="space-y-2">
                                <Label htmlFor="workspaceType">Workspace Type</Label>
                                <select
                                    id="workspaceType"
                                    {...register("workspaceType")}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="discord">Discord</option>
                                    <option value="telegram">Telegram</option>
                                    <option value="slack">Slack</option>
                                </select>
                            </div>

                            {/* Discord Specific */}
                            {workspaceType === "discord" && (
                                <div className="space-y-2">
                                    <Label htmlFor="guildId">Discord Server ID (Guild ID)</Label>
                                    <Input
                                        id="guildId"
                                        placeholder="e.g. 123456789012345678"
                                        {...register("guildId")}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enable Developer Mode in Discord to copy your Server ID.
                                    </p>
                                </div>
                            )}

                            {/* API Keys Section */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="whopApiKey">Whop API Key</Label>
                                    <Input
                                        id="whopApiKey"
                                        type="password"
                                        placeholder="whop_..."
                                        {...register("whopApiKey")}
                                    />
                                    {errors.whopApiKey && <p className="text-sm text-red-500">{errors.whopApiKey.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="botToken">Bot Token</Label>
                                    <Input
                                        id="botToken"
                                        type="password"
                                        placeholder="Token from Developer Portal"
                                        {...register("botToken")}
                                    />
                                    {errors.botToken && <p className="text-sm text-red-500">{errors.botToken.message}</p>}
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label>Stripe Connection</Label>
                                    <div className="flex items-center space-x-4 p-4 border rounded-md bg-muted/50">
                                        <div className="flex-1">
                                            <h4 className="font-medium">Connect with Stripe</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Required to enable revenue sharing and automated payouts.
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://whop-lead-engine-production.up.railway.app'}/api/webhooks/connect/oauth`, {
                                                        headers: {
                                                            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                                                        }
                                                    });
                                                    const data = await res.json();

                                                    if (!res.ok) {
                                                        throw new Error(data.detail || data.message || "Server error");
                                                    }

                                                    if (data.url) {
                                                        window.location.href = data.url;
                                                    } else {
                                                        toast.error("Invalid response from server");
                                                    }
                                                } catch (e: any) {
                                                    console.error(e);
                                                    toast.error(`Stripe Connection Error: ${e.message}`);
                                                }
                                            }}
                                        >
                                            Connect Stripe
                                        </Button>
                                    </div>
                                    {/* Hidden input to satisfy schema if needed, or update schema */}
                                    <input type="hidden" {...register("stripeSecretKey")} value="connected_via_oauth" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="paidProductId">Paid Product ID</Label>
                                    <Input
                                        id="paidProductId"
                                        placeholder="prod_..."
                                        {...register("paidProductId")}
                                    />
                                    {errors.paidProductId && <p className="text-sm text-red-500">{errors.paidProductId.message}</p>}
                                </div>
                            </div>

                            {/* Branding Section */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="brandName">Brand Name</Label>
                                    <Input
                                        id="brandName"
                                        placeholder="My Awesome Brand"
                                        {...register("brandName")}
                                    />
                                    {errors.brandName && <p className="text-sm text-red-500">{errors.brandName.message}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="communityName">Community Name</Label>
                                    <Input
                                        id="communityName"
                                        placeholder="The Founders Club"
                                        {...register("communityName")}
                                    />
                                    {errors.communityName && <p className="text-sm text-red-500">{errors.communityName.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="primaryOffer">Primary Offer URL</Label>
                                <Input
                                    id="primaryOffer"
                                    placeholder="https://whop.com/..."
                                    {...register("primaryOffer")}
                                />
                                {errors.primaryOffer && <p className="text-sm text-red-500">{errors.primaryOffer.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="messagingTone">Messaging Tone</Label>
                                <select
                                    id="messagingTone"
                                    {...register("messagingTone")}
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="aggressive">Aggressive (High Urgency)</option>
                                    <option value="friendly">Friendly (Relationship First)</option>
                                    <option value="neutral">Neutral (Professional)</option>
                                </select>
                            </div>

                            <Button type="submit" className="w-full" size="lg">
                                <Zap className="mr-2 h-4 w-4" />
                                Activate Engine
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    )
}
