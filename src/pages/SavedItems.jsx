import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Repeat } from "lucide-react";


export default function SavedItems({ user, setView }) {
    const [meals, setMeals] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingMeal, setEditingMeal] = useState(null);
    const [editingRecipe, setEditingRecipe] = useState(null);
    const [editDescription, setEditDescription] = useState("");
    const [editCalories, setEditCalories] = useState("");

    const handleEditMeal = async () => {
        try {
            const { data, error } = await supabase
                .from("meals")
                .update({
                    description: editDescription,
                    calories: parseInt(editCalories)
                })
                .eq("id", editingMeal.id)
                .select()
                .single();

            if (error) throw error;

            toast.success("Meal updated");
            setMeals((prev) =>
                prev.map((m) => (m.id === editingMeal.id ? data : m))
            );
            setEditingMeal(null);
        } catch (err) {
            console.error("Failed to update meal:", err);
            toast.error("Failed to update meal");
        }
    };

    const handleEditRecipe = async () => {
        try {
            const { data, error } = await supabase
                .from("recipes")
                .update({
                    name: editDescription,
                    calories: parseInt(editCalories)
                })
                .eq("id", editingRecipe.id)
                .select()
                .single();

            if (error) throw error;

            toast.success("Recipe updated");
            setRecipes((prev) =>
                prev.map((r) => (r.id === editingRecipe.id ? data : r))
            );
            setEditingRecipe(null);
        } catch (err) {
            console.error("Failed to update recipe:", err);
            toast.error("Failed to update recipe");
        }
    };


    const handleLogAgain = async (mealOrRecipe, isRecipe = false) => {
        const now = new Date();
        const today = now.toISOString().split("T")[0];

        const newMeal = {
            user_id: user.id,
            description: isRecipe ? mealOrRecipe.name : mealOrRecipe.description,
            calories: mealOrRecipe.calories,
            timestamp: now.toISOString(),
            date: today,
            is_custom_recipe: isRecipe,
            recipe_id: isRecipe ? mealOrRecipe.id : mealOrRecipe.recipe_id || null
        };

        console.log("Logging again with data:", newMeal);

        try {
            const { data, error } = await supabase
                .from("meals")
                .insert(newMeal)
                .select()
                .single();

            if (error) {
                console.error("❌ Supabase insert error:", error);
                toast.error("Failed to re-log this item", {
                    description: error.message || "Check console for details"
                });
                return;
            }

            console.log("✅ Meal re-logged:", data);
            toast.success(`Logged "${newMeal.description}" again!`);
        } catch (err) {
            console.error("💥 Unexpected insert error:", err);
            toast.error("Unexpected error occurred during log again");
        }
    };



    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const { data: mealsData, error: mealsError } = await supabase
                    .from("meals")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("timestamp", { ascending: false });

                const { data: recipesData, error: recipesError } = await supabase
                    .from("recipes")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                if (mealsError) throw mealsError;
                if (recipesError) throw recipesError;

                console.log("Fetched meals:", mealsData);
                console.log("Fetched recipes:", recipesData);
                setMeals(mealsData);
                setRecipes(recipesData);
            } catch (error) {
                console.error("Fetch error:", error);
                toast.error("Failed to load saved data");
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchData();
        }
    }, [user]);

    return (
        <div className="max-w-2xl mx-auto mt-6 px-4">
            <Button variant="outline" onClick={() => setView('home')} className="mb-4">
                ← Back to Home
            </Button>


            <Card>
                <CardHeader>
                    <CardTitle>📚 Saved Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="meals">
                        <TabsList className="grid grid-cols-2 mb-4">
                            <TabsTrigger value="meals">Meals</TabsTrigger>
                            <TabsTrigger value="recipes">Recipes</TabsTrigger>
                        </TabsList>

                        <TabsContent value="meals">
                            {meals.length === 0 ? (
                                <p className="text-sm text-slate-500">No meals saved yet.</p>
                            ) : (
                                meals.map((meal) => {
                                    return (
                                        <div key={meal.id} className="relative mb-3 p-3 border rounded bg-slate-50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{meal.description}</p>
                                                    <p className="text-sm text-slate-500">{meal.calories} kcal</p>
                                                    <p className="text-xs text-slate-400">
                                                        {meal.timestamp
                                                            ? new Date(meal.timestamp).toLocaleString(undefined, {
                                                                dateStyle: "medium",
                                                                timeStyle: "short",
                                                            })
                                                            : "No timestamp"}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Pencil
                                                        className="w-4 h-4 text-blue-600 cursor-pointer"
                                                        onClick={() => {
                                                            setEditingMeal(meal);
                                                            setEditDescription(meal.description);
                                                            setEditCalories(meal.calories.toString());
                                                        }}
                                                    />
                                                    <Trash2
                                                        className="w-4 h-4 text-red-500 cursor-pointer"
                                                        onClick={() => handleDeleteMeal(meal.id)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end mt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleLogAgain(meal, false)}
                                                >
                                                    <Repeat className="w-4 h-4 mr-1" />
                                                    Log Again
                                                </Button>
                                            </div>
                                        </div>

                                    );
                                })
                            )}
                        </TabsContent>
                        <TabsContent value="recipes">
                            {recipes.length === 0 ? (
                                <p className="text-sm text-slate-500">No recipes saved yet.</p>
                            ) : (
                                recipes.map((recipe) => (
                                    <div key={recipe.id} className="relative mb-3 p-3 border rounded bg-slate-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{recipe.name}</p>
                                                <p className="text-sm text-slate-500">{recipe.calories} kcal</p>
                                                <p className="text-xs text-slate-400">{recipe.ingredients.length} ingredients</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Pencil
                                                    className="w-4 h-4 text-blue-600 cursor-pointer"
                                                    onClick={() => {
                                                        setEditingRecipe(recipe);
                                                        setEditDescription(recipe.name);
                                                        setEditCalories(recipe.calories.toString());
                                                    }}
                                                />
                                                <Trash2
                                                    className="w-4 h-4 text-red-500 cursor-pointer"
                                                    onClick={() => handleDeleteRecipe(recipe.id)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end mt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleLogAgain(recipe, true)}
                                            >
                                                <Repeat className="w-4 h-4 mr-1" />
                                                Log Again
                                            </Button>
                                        </div>
                                    </div>

                                ))
                            )}
                        </TabsContent>

                    </Tabs>
                </CardContent>
            </Card>
            <Dialog open={!!(editingMeal || editingRecipe)} onOpenChange={() => {
                setEditingMeal(null);
                setEditingRecipe(null);
            }}>
                <DialogContent className="sm:max-w-md z-50">
                    <DialogHeader>
                        <DialogTitle>Edit {editingMeal ? "Meal" : "Recipe"}</DialogTitle>
                        <DialogDescription>
                            Change the name/description and calories.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Input
                            placeholder="Description / Name"
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                        />
                        <Input
                            type="number"
                            placeholder="Calories"
                            value={editCalories}
                            onChange={(e) => setEditCalories(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setEditingMeal(null);
                                    setEditingRecipe(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={editingMeal ? handleEditMeal : handleEditRecipe}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
