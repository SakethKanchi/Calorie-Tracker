import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";
import { Loader2, PlusCircle, Calculator, ChefHat } from "lucide-react";
import { MdDelete } from "react-icons/md";

const MealInput = ({ user, onAdd }) => {
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [manualCalories, setManualCalories] = useState("");
    const [isCustomMeal, setIsCustomMeal] = useState(false);
    const [recipe, setRecipe] = useState("");
    const [recipeCalories, setRecipeCalories] = useState("");
    const [recipeName, setRecipeName] = useState("");
    const [ingredients, setIngredients] = useState([""]);
    const [instructions, setInstructions] = useState([""]);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const estimateCalories = async (retryCount = 0) => {
        const openaiKey = localStorage.getItem("openai_key");
        if (!openaiKey) {
            toast.error("OpenAI API key not found", {
                description: "Please add your API key in Settings"
            });
            return null;
        }

        // Validate API key format
        if (!openaiKey.startsWith("sk-")) {
            toast.error("Invalid OpenAI API key", {
                description: "Your API key should start with 'sk-'. Please update it in Settings."
            });
            return null;
        }

        const loadingToast = toast.loading("Connecting to OpenAI...");

        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openaiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: `Estimate calories in: ${description}` }],
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("OpenAI error:", response.status, errorData);

                // Handle rate limiting
                if (response.status === 429) {
                    if (retryCount < 3) {
                        const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
                        toast.dismiss(loadingToast);
                        const retryToast = toast.loading(`Rate limit reached. Retrying in ${backoffTime / 1000}s...`);
                        await sleep(backoffTime);
                        toast.dismiss(retryToast);
                        return estimateCalories(retryCount + 1);
                    } else {
                        toast.dismiss(loadingToast);
                        toast.error("Rate limit reached", {
                            description: "Please wait a few minutes before trying again."
                        });
                        return null;
                    }
                }

                if (response.status === 401) {
                    toast.dismiss(loadingToast);
                    toast.error("Invalid API key", {
                        description: "Please check your API key in Settings and make sure it's correct."
                    });
                    return null;
                }

                toast.dismiss(loadingToast);
                toast.error("OpenAI error", {
                    description: errorData.error?.message || "Failed to estimate calories"
                });
                return null;
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            // Extract number from AI output (e.g., "This meal has about 650 calories.")
            const match = aiResponse.match(/(\d+)\s*(kcal|calories)?/i);
            const estimatedCalories = match ? parseInt(match[1]) : 0;

            if (estimatedCalories === 0) {
                toast.dismiss(loadingToast);
                toast.error("Could not estimate calories", {
                    description: "Please try describing your meal more specifically."
                });
                return null;
            }

            toast.dismiss(loadingToast);
            toast.success("Calories estimated!", {
                description: `${estimatedCalories} kcal for your meal.`
            });

            return estimatedCalories;
        } catch (e) {
            console.error("Error fetching calories:", e);
            toast.dismiss(loadingToast);
            toast.error("Failed to estimate calories", {
                description: "Please check your internet connection and try again."
            });
            return null;
        }
    };

    const estimateRecipeCalories = async () => {
        const openaiKey = localStorage.getItem("openai_key");
        if (!openaiKey) {
            toast.error("OpenAI API key not found", {
                description: "Please add your API key in Settings"
            });
            return null;
        }

        if (!recipe.trim()) {
            toast.error("Recipe is required", {
                description: "Please enter your recipe ingredients and instructions."
            });
            return null;
        }

        const loadingToast = toast.loading("Calculating recipe calories...");

        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${openaiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{
                        role: "user",
                        content: `Calculate the total calories for this recipe. Consider all ingredients and their quantities:\n\n${recipe}`
                    }],
                    temperature: 0.7,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                toast.dismiss(loadingToast);
                toast.error("Failed to calculate calories", {
                    description: errorData.error?.message || "Please try again"
                });
                return null;
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            const match = aiResponse.match(/(\d+)\s*(kcal|calories)?/i);
            const estimatedCalories = match ? parseInt(match[1]) : 0;

            if (estimatedCalories === 0) {
                toast.dismiss(loadingToast);
                toast.error("Could not calculate calories", {
                    description: "Please provide more specific ingredient quantities."
                });
                return null;
            }

            toast.dismiss(loadingToast);
            toast.success("Calories calculated!", {
                description: `${estimatedCalories} kcal for your recipe.`
            });

            setRecipeCalories(estimatedCalories.toString());
            return estimatedCalories;
        } catch (e) {
            console.error("Error calculating calories:", e);
            toast.dismiss(loadingToast);
            toast.error("Failed to calculate calories", {
                description: "Please check your internet connection and try again."
            });
            return null;
        }
    };

    const addIngredient = () => {
        setIngredients([...ingredients, ""]);
    };

    const removeIngredient = (index) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const updateIngredient = (index, value) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = value;
        setIngredients(newIngredients);
    };

    const addInstruction = () => {
        setInstructions([...instructions, ""]);
    };

    const removeInstruction = (index) => {
        setInstructions(instructions.filter((_, i) => i !== index));
    };

    const updateInstruction = (index, value) => {
        const newInstructions = [...instructions];
        newInstructions[index] = value;
        setInstructions(newInstructions);
    };

    const saveRecipe = async () => {
        if (!recipeName.trim()) {
            toast.error("Recipe name is required");
            return;
        }
        if (!recipe.trim()) {
            toast.error("Recipe description is required");
            return;
        }
        if (!recipeCalories) {
            toast.error("Calories are required");
            return;
        }

        setLoading(true);
        try {
            // First save the recipe
            const { data: newRecipe, error: recipeError } = await supabase
                .from("recipes")
                .insert({
                    user_id: user.id,
                    name: recipeName,
                    description: recipe,
                    ingredients: ingredients.filter(i => i.trim()),
                    instructions: instructions.filter(i => i.trim()),
                    calories: parseInt(recipeCalories)
                })
                .select()
                .single();

            if (recipeError) {
                console.error("Recipe save error:", recipeError);
                toast.error("Failed to save recipe");
                setLoading(false);
                return;
            }

            // Then save the meal
            const now = new Date();
            const meal = {
                user_id: user.id,
                description: recipeName,
                calories: parseInt(recipeCalories),
                timestamp: now.toISOString(),
                date: now.toISOString().split("T")[0]
            };

            // Only add recipe-related fields if the recipe was saved successfully
            if (newRecipe) {
                meal.is_custom_recipe = true;
                meal.recipe_id = newRecipe.id;
            }

            const { data: newMeal, error: mealError } = await supabase
                .from("meals")
                .insert(meal)
                .select()
                .single();

            if (mealError) {
                console.error("Meal save error:", mealError);
                // If the error is due to missing columns, try saving without recipe fields
                if (mealError.code === 'PGRST204') {
                    const { data: fallbackMeal, error: fallbackError } = await supabase
                        .from("meals")
                        .insert({
                            user_id: user.id,
                            description: recipeName,
                            calories: parseInt(recipeCalories),
                            timestamp: now.toISOString(),
                            date: now.toISOString().split("T")[0]
                        })
                        .select()
                        .single();

                    if (fallbackError) {
                        toast.error("Failed to save meal");
                        setLoading(false);
                        return;
                    }

                    if (fallbackMeal) {
                        onAdd(fallbackMeal);
                        // Reset all form fields
                        setRecipeName("");
                        setRecipe("");
                        setRecipeCalories("");
                        setIngredients([""]);
                        setInstructions([""]);
                        setIsCustomMeal(false);
                        toast.success("Meal saved successfully!");
                        setLoading(false);
                        return;
                    }
                } else {
                    toast.error("Failed to save meal");
                    setLoading(false);
                    return;
                }
            }

            if (newMeal) {
                onAdd(newMeal);
                // Reset all form fields
                setRecipeName("");
                setRecipe("");
                setRecipeCalories("");
                setIngredients([""]);
                setInstructions([""]);
                setIsCustomMeal(false);
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (isCustomMeal) {
            if (!recipe.trim()) {
                toast.error("Recipe is required");
                return;
            }
            if (!recipeCalories) {
                toast.error("Calories are required");
                return;
            }
        } else {
            if (!description.trim()) return;
        }

        setLoading(true);
        try {
            let calories;
            if (isCustomMeal) {
                calories = parseInt(recipeCalories);
            } else {
                calories = await estimateCalories();
            }

            if (calories === null) {
                setLoading(false);
                return;
            }

            const now = new Date();
            const meal = {
                user_id: user.id,
                description: isCustomMeal ? recipe : description,
                calories,
                timestamp: now.toISOString(),
                date: now.toISOString().split("T")[0],
                is_custom_recipe: isCustomMeal
            };

            // First check if the user has the necessary permissions
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session) {
                toast.error("Authentication error", {
                    description: "Please log out and log back in to refresh your session."
                });
                setLoading(false);
                return;
            }

            // Try to insert the meal
            const { data: newMeal, error } = await supabase
                .from("meals")
                .insert(meal)
                .select()
                .single();

            if (error) {
                console.error("Database error:", error);
                if (error.code === "23505") { // Unique violation
                    toast.error("Duplicate meal entry", {
                        description: "This meal has already been logged."
                    });
                } else if (error.code === "42501") { // Insufficient privilege
                    toast.error("Permission denied", {
                        description: "You don't have permission to add meals. Please contact support."
                    });
                } else {
                    toast.error("Failed to save meal", {
                        description: "Please try again or contact support if the problem persists."
                    });
                }
                setLoading(false);
                return;
            }

            if (newMeal) {
                onAdd(newMeal);
                setDescription("");
                setRecipe("");
                setRecipeCalories("");
                setIsCustomMeal(false);
            } else {
                toast.error("Failed to add meal", {
                    description: "The meal was saved but couldn't be retrieved. Please refresh the page."
                });
            }
        } catch (err) {
            console.error("Unexpected error:", err);
            toast.error("An unexpected error occurred", {
                description: "Please try again or contact support if the problem persists."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Log a Meal</CardTitle>
                <CardDescription>
                    Choose between quick meal logging or custom recipe entry
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="quick" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="quick" onClick={() => setIsCustomMeal(false)} className="flex items-center justify-center gap-2">
                            <ChefHat className="w-4 h-4" />
                            Quick Log
                        </TabsTrigger>
                        <TabsTrigger value="custom" onClick={() => setIsCustomMeal(true)} className="flex items-center justify-center gap-2">
                            <Calculator className="w-4 h-4" />
                            Custom Recipe
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="quick" className="mt-0">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1">
                                <Input
                                    placeholder="e.g., chicken burrito bowl with rice, beans, and guacamole"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full"
                                    disabled={loading}
                                />
                            </div>
                            <Button
                                onClick={handleSubmit}
                                disabled={loading || !description.trim()}
                                className="min-w-[100px]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Estimating...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Meal
                                    </>
                                )}
                            </Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="custom">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="recipe-name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Recipe Name
                                </Label>
                                <Input
                                    id="recipe-name"
                                    placeholder="Enter recipe name..."
                                    value={recipeName}
                                    onChange={(e) => setRecipeName(e.target.value)}
                                    className="w-full"
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="recipe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Recipe Description
                                </Label>
                                <Input
                                    id="recipe"
                                    placeholder="Enter a brief description of your recipe..."
                                    value={recipe}
                                    onChange={(e) => setRecipe(e.target.value)}
                                    className="w-full"
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium leading-none">Ingredients</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addIngredient}
                                        disabled={loading}
                                    >
                                        Add Ingredient
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {ingredients.map((ingredient, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder={`Ingredient ${index + 1}`}
                                                value={ingredient}
                                                onChange={(e) => updateIngredient(index, e.target.value)}
                                                className="flex-1"
                                                disabled={loading}
                                            />
                                            {ingredients.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeIngredient(index)}
                                                    disabled={loading}
                                                >
                                                    <MdDelete className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium leading-none">Instructions</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addInstruction}
                                        disabled={loading}
                                    >
                                        Add Step
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {instructions.map((instruction, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder={`Step ${index + 1}`}
                                                value={instruction}
                                                onChange={(e) => updateInstruction(index, e.target.value)}
                                                className="flex-1"
                                                disabled={loading}
                                            />
                                            {instructions.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeInstruction(index)}
                                                    disabled={loading}
                                                >
                                                    <MdDelete className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="calories" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Calories
                                    </Label>
                                    <Switch
                                        id="ai-mode"
                                        checked={!loading}
                                        disabled={loading}
                                        onCheckedChange={(checked) => {
                                            if (!checked && recipeCalories === "") {
                                                estimateRecipeCalories();
                                            }
                                        }}
                                    />
                                </div>
                                <Input
                                    id="calories"
                                    type="number"
                                    placeholder="Enter calories"
                                    value={recipeCalories}
                                    onChange={(e) => setRecipeCalories(e.target.value)}
                                    className="w-full"
                                    disabled={loading}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button
                                    onClick={estimateRecipeCalories}
                                    disabled={loading || !recipe.trim()}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Calculating...
                                        </>
                                    ) : (
                                        <>
                                            <Calculator className="mr-2 h-4 w-4" />
                                            Calculate
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={saveRecipe}
                                    disabled={loading || !recipeName.trim() || !recipe.trim() || !recipeCalories}
                                    className="flex-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Save Recipe
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};

export default MealInput;
