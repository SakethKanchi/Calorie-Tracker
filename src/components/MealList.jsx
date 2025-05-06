import { useState, useEffect, useRef } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MdEdit, MdDelete, MdSave } from "react-icons/md";
import { Loader2, Utensils } from "lucide-react";
import toast from "react-hot-toast";

const MealList = ({ meals, onDelete, onEdit, isLoading, hasMore, onLoadMore }) => {
    const [editingId, setEditingId] = useState(null);
    const [editedDescription, setEditedDescription] = useState("");
    const [editedCalories, setEditedCalories] = useState("");
    const [loading, setLoading] = useState(false);
    const observerRef = useRef(null);
    const lastMealRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    onLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (lastMealRef.current) {
            observer.observe(lastMealRef.current);
        }

        observerRef.current = observer;

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [hasMore, isLoading, onLoadMore]);

    const startEdit = (meal) => {
        setEditingId(meal.id);
        setEditedDescription(meal.description);
        setEditedCalories(meal.calories);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditedDescription("");
        setEditedCalories("");
    };

    const saveEdit = async () => {
        if (!editedDescription.trim()) {
            toast.error("Description cannot be empty");
            return;
        }

        if (!editedCalories || editedCalories < 0) {
            toast.error("Calories must be a positive number");
            return;
            console.log("Edit payload:", { mealId, newDescription, newCalories });
        }

        setLoading(true);
        try {
            await onEdit(editingId, editedDescription, parseInt(editedCalories));
            setEditingId(null);
            setEditedDescription("");
            setEditedCalories("");
        } catch (error) {
            console.error("Error updating meal:", error);
            toast.error("Failed to update meal");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (mealId) => {
        try {
            await onDelete(mealId);
            toast.success("Meal deleted successfully");
        } catch (error) {
            toast.error("Failed to delete meal");
        }
    };

    if (meals.length === 0 && !isLoading) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Utensils className="h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 text-lg">No meals logged for this day</p>
                    <p className="text-slate-400 text-sm mt-1">
                        Start by adding a meal above
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Meals</CardTitle>
                <CardDescription>
                    {meals.length} meal{meals.length !== 1 ? 's' : ''} logged
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {meals.map((meal, index) => (
                        <div
                            key={meal.id}
                            ref={index === meals.length - 1 ? lastMealRef : null}
                            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                        >
                            {editingId === meal.id ? (
                                <div className="flex-1 flex gap-2">
                                    <Input
                                        value={editedDescription}
                                        onChange={(e) => setEditedDescription(e.target.value)}
                                        className="flex-1"
                                        disabled={loading}
                                        placeholder="Meal description"
                                    />
                                    <Input
                                        type="number"
                                        value={editedCalories}
                                        onChange={(e) => setEditedCalories(e.target.value)}
                                        className="w-24"
                                        disabled={loading}
                                        placeholder="Calories"
                                    />
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={saveEdit}
                                            disabled={loading}
                                            size="sm"
                                            className="min-w-[80px]"
                                        >
                                            {loading ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <MdSave className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            onClick={cancelEdit}
                                            disabled={loading}
                                            size="sm"
                                            variant="outline"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1">
                                        <p className="font-medium">{meal.description}</p>
                                        <p className="text-sm text-slate-500">
                                            {new Date(meal.timestamp + 'Z').toLocaleTimeString([], {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                            })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-slate-700">
                                            {meal.calories} kcal
                                        </p>
                                        <div className="flex gap-1">
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => startEdit(meal)}
                                                    >
                                                        <MdEdit className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Edit meal</TooltipContent>
                                            </Tooltip>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(meal.id)}
                                                    >
                                                        <MdDelete className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Delete meal</TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default MealList;
