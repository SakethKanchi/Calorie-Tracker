import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const Settings = ({ user, open, onClose }) => {
    const [goal, setGoal] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from("user_settings")
                    .select("calorie_goal, openai_key, created_at")
                    .eq("user_id", user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle(); // ✅ allows zero results without error


                if (error) {
                    console.error("Error loading settings:", error);
                    toast.error("Failed to load settings");
                    return;
                }

                if (data) {
                    setGoal(data.calorie_goal || "");
                    // Only show first 4 and last 4 characters of API key
                    const maskedKey = data.openai_key
                        ? `${data.openai_key.slice(0, 4)}...${data.openai_key.slice(-4)}`
                        : "";
                    setApiKey(maskedKey);
                }
            } catch (err) {
                console.error("Error in loadSettings:", err);
                toast.error("Failed to load settings");
            }
        };

        if (user?.id) {
            loadSettings();
        }
    }, [user]);

    const handleSave = async () => {
        if (!user?.id) {
            toast.error("You must be logged in to save settings");
            return;
        }

        // Validate API key format
        if (apiKey && !apiKey.startsWith("sk-")) {
            toast.error("Invalid OpenAI API key format. It should start with 'sk-'");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from("user_settings")
                .upsert({
                    user_id: user.id,
                    calorie_goal: parseInt(goal) || 2000,
                    openai_key: apiKey,
                    created_at: new Date().toISOString()
                });

            if (error) {
                console.error("Error saving settings:", error);
                toast.error("Failed to save settings");
                return;
            }

            // Store in localStorage for immediate use
            if (apiKey) {
                localStorage.setItem("openai_key", apiKey);
            } else {
                localStorage.removeItem("openai_key");
            }
            localStorage.setItem("calorie_goal", goal);
            toast.success("Settings saved successfully!");
            onClose();
        } catch (err) {
            console.error("Error in handleSave:", err);
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-white sm:max-w-md rounded-lg shadow-xl z-[999]">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                        Update your OpenAI API key and calorie goal. Your API key should start with 'sk-'.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div>
                        <Input
                            type="password"
                            placeholder="OpenAI API Key (starts with sk-)"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Get your API key from{" "}
                            <a
                                href="https://platform.openai.com/account/api-keys"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                OpenAI Dashboard
                            </a>
                        </p>
                    </div>
                    <Input
                        type="number"
                        placeholder="Calorie Goal"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                    />
                </div>


                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default Settings;