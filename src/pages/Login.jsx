import { useState } from "react";
import { supabase } from "../supabaseClient";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function Login({ onLogin, switchToSignup }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        const { error, data } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            toast.error("Login failed", {
                description: error.message
            });
        } else {
            toast.success("Welcome back! 🎉");
            onLogin(data.user);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-2xl">🔐 Login</CardTitle>
                </CardHeader>

                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {error && (
                            <p className="text-sm text-red-500 text-center">{error}</p>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col gap-2">
                        <Button type="submit" className="w-full">
                            Log In
                        </Button>
                        <p className="text-sm text-slate-500 text-center">
                            Don't have an account?{" "}
                            <button
                                type="button"
                                onClick={switchToSignup}
                                className="text-blue-600 hover:underline"
                            >
                                Sign up
                            </button>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
