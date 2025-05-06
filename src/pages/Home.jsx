import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import Navbar from '../components/Navbar';
import MealInput from '../components/MealInput';
import MealList from '../components/MealList';
import Settings from '../components/Settings';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";


const Home = ({ user, onLogout, setView, theme, setTheme }) => {
    const [meals, setMeals] = useState([]);
    const [calorieGoal, setCalorieGoal] = useState(2000);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const MEALS_PER_PAGE = 10;

    // Helper function to get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const today = getTodayDate();
    const [selectedDate, setSelectedDate] = useState(today);

    // Helper function to format date for display
    const formatDate = (dateString) => {
        return dateString; // Already in YYYY-MM-DD format
    };

    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
        setMeals([]); // Reset meals when date changes
        setHasMore(true);
    };

    const fetchMeals = async (page = 0) => {
        if (!user?.id || !hasMore) return;

        setIsLoading(true);
        try {
            const formattedDate = formatDate(selectedDate);
            const { data: mealsData, error: mealError } = await supabase
                .from('meals')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', formattedDate)
                .order('timestamp', { ascending: false })
                .range(page * MEALS_PER_PAGE, (page + 1) * MEALS_PER_PAGE - 1);

            if (mealError) {
                console.error('Meal fetch error:', mealError);
                toast.error('Failed to load meals');
                return;
            }

            if (mealsData.length < MEALS_PER_PAGE) {
                setHasMore(false);
            }

            if (page === 0) {
                setMeals(mealsData);
            } else {
                setMeals(prev => [...prev, ...mealsData]);
            }
        } catch (error) {
            console.error('Error fetching meals:', error);
            toast.error('Failed to load meals');
        } finally {
            setIsLoading(false);
        }
    };

    const loadMoreMeals = () => {
        if (!isLoading && hasMore) {
            const nextPage = Math.floor(meals.length / MEALS_PER_PAGE);
            fetchMeals(nextPage);
        }
    };

    const deleteMeal = async (mealId) => {
        try {
            const { error } = await supabase
                .from('meals')
                .delete()
                .eq('id', mealId)
                .eq('user_id', user.id);

            if (error) {
                console.error('Failed to delete meal:', error);
                toast.error('Failed to delete meal');
                return;
            }

            setMeals((prev) => prev.filter((m) => m.id !== mealId));
            toast.success('Meal deleted successfully');
        } catch (error) {
            console.error('Error deleting meal:', error);
            toast.error('Failed to delete meal');
        }
    };

    const updateMeal = async (mealId, newDescription, newCalories) => {
        console.log("⏳ Updating meal:", mealId, newDescription, newCalories);

        if (!mealId || !newDescription || !newCalories || newCalories < 0) {
            toast.error("Invalid update data");
            return;
        }

        try {
            const sessionCheck = await supabase.auth.getSession();
            console.log("🧾 Supabase session user ID:", sessionCheck.data.session?.user.id);

            const { data, error } = await supabase
                .from('meals')
                .update({
                    description: newDescription,
                    calories: newCalories
                })
                .eq('id', mealId)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) {
                console.error('❌ Failed to update meal:', error);
                toast.error('Failed to update meal');
                return;
            }

            if (!data) {
                toast.error('Meal not found or permission denied');
                return;
            }

            console.log("✅ Updated meal:", data);

            setMeals((prev) =>
                prev.map((m) =>
                    m.id === mealId
                        ? { ...m, description: newDescription, calories: newCalories }
                        : m
                )
            );
            toast.success('Meal updated successfully');
        } catch (error) {
            console.error('💥 Error updating meal:', error);
            toast.error('Unexpected error during update');
        }
    };


    useEffect(() => {
        const fetchMealsAndSettings = async () => {
            if (!user?.id) return;

            try {
                // Fetch settings first
                const { data: settingsData, error: settingsError } = await supabase
                    .from('user_settings')
                    .select('calorie_goal, openai_key')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!settingsError && settingsData) {
                    setCalorieGoal(settingsData.calorie_goal || 2000);
                    localStorage.setItem('openai_key', settingsData.openai_key || '');
                }

                // Then fetch initial meals
                await fetchMeals(0);
            } catch (error) {
                console.error('Error in fetchMealsAndSettings:', error);
                toast.error('Failed to load data');
            }
        };

        fetchMealsAndSettings();
    }, [user?.id, selectedDate]);

    // Add effect to update document theme when theme prop changes
    useEffect(() => {
        if (typeof document !== "undefined") {
            document.documentElement.classList.remove("light", "dark");
            document.documentElement.classList.add(theme);
        }
    }, [theme]);

    const addMeal = (meal) => {
        setMeals((prev) => [meal, ...prev]);
        toast.success('Meal added successfully');
    };

    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-900 py-8 px-4 text-slate-800 dark:text-white">
            <div className="max-w-xl mx-auto space-y-6">
                <Navbar
                    user={user}
                    onLogout={onLogout}
                    onSettingsClick={() => setIsSettingsOpen(true)}
                    onTodayClick={() => setSelectedDate(today)}
                    selectedDate={selectedDate}
                    onDateChange={handleDateChange}
                    setView={setView}
                    theme={theme}
                    setTheme={setTheme}
                />
                <Settings user={user} open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

                {/* Daily Summary Card */}
                <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-200 dark:bg-zinc-800">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-2xl">🔥</span>
                            Daily Summary
                        </CardTitle>
                        <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                            {selectedDate === today ? (
                                "Today's Summary"
                            ) : (
                                new Date(selectedDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-baseline justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-slate-800 dark:text-white">
                                        {totalCalories} / {calorieGoal} kcal
                                    </p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {Math.max(0, calorieGoal - totalCalories)} kcal remaining
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p
                                        className={cn(
                                            "text-sm font-medium px-3 py-1 rounded-full",
                                            totalCalories > calorieGoal
                                                ? "text-red-600 bg-red-50 dark:bg-red-900/30"
                                                : "text-green-600 bg-green-50 dark:bg-green-900/30"
                                        )}
                                    >
                                        {totalCalories > calorieGoal ? "Over" : "Under"} by{" "}
                                        {Math.abs(totalCalories - calorieGoal)} kcal
                                    </p>
                                </div>
                            </div>

                            <div className="relative h-3 bg-slate-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                                <div
                                    className={cn(
                                        "absolute h-full rounded-full transition-all duration-500",
                                        totalCalories > calorieGoal
                                            ? "bg-red-500"
                                            : "bg-green-500"
                                    )}
                                    style={{
                                        width: `${Math.min(
                                            100,
                                            (totalCalories / calorieGoal) * 100
                                        )}%`
                                    }}
                                />
                            </div>

                            {selectedDate === today && (
                                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                                    Logging meals for <strong>today</strong>
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Meal Input Card */}
                {selectedDate === today ? (
                    <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-200 dark:bg-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="text-2xl">🍽️</span>
                                Log a Meal
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MealInput onAdd={addMeal} user={user} />
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-none shadow-md bg-slate-50 dark:bg-zinc-800">
                        <CardContent className="py-6">
                            <p className="text-sm text-slate-500 dark:text-slate-400 italic text-center flex items-center justify-center gap-2">
                                <span className="text-lg">🔒</span>
                                Meal logging is only available for today
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Meal List Card */}
                <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-200 dark:bg-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <span className="text-2xl">📝</span>
                            Meal Log
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MealList
                            meals={meals}
                            onDelete={deleteMeal}
                            onEdit={updateMeal}
                            isLoading={isLoading}
                            hasMore={hasMore}
                            onLoadMore={loadMoreMeals}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Home;