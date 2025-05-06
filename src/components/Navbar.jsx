import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Settings,
    LogOut,
    Calendar,
    ChevronDown,
    Home,
    Bookmark,
    Sun,
    Moon
} from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = ({
    user,
    onLogout,
    onSettingsClick,
    onTodayClick,
    selectedDate,
    onDateChange,
    setView,
    theme,
    setTheme,
}) => {
    const getInitials = (email) =>
        email
            .split("@")[0]
            .split(/[^a-zA-Z]/)
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

    const getTodayDate = () => {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
            .toISOString()
            .split("T")[0];
    };

    const today = getTodayDate();
    const isToday = selectedDate === today;

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    const formatDate = (date) => {
        return new Date(date + "T00:00:00").toLocaleDateString(
            "en-US",
            { weekday: 'short', month: "short", day: "numeric" }
        );
    };

    return (
        <div className="sticky top-0 z-50 w-full border-b bg-white dark:bg-zinc-900 dark:border-zinc-700 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-zinc-900/80">
            <div className="container flex h-14 items-center justify-between px-4 flex-wrap">

                {/* Left: App Title and Navigation */}
                <div className="flex items-center space-x-4">
                    <a
                        className="flex items-center space-x-2"
                        href="#"
                        onClick={() => setView("home")}
                    >
                        <span className="font-bold text-xl whitespace-nowrap truncate">
                            🍽️ Calorie Tracker
                        </span>
                    </a>

                    {/* Desktop Navigation (only Saved Items) */}
                    <nav className="hidden md:flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setView("saved")}
                            className={cn(
                                "text-slate-700 dark:text-slate-200",
                                "hover:bg-slate-100 dark:hover:bg-zinc-800"
                            )}
                        >
                            <Bookmark className="mr-2 h-4 w-4" />
                            Saved Items
                        </Button>
                    </nav>
                </div>

                {/* Right: Date Picker, Theme Toggle, Avatar */}
                <div className="flex items-center space-x-2 ml-auto">
                    {/* Date Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "text-slate-600 dark:text-white hidden sm:flex",
                                    isToday && "bg-slate-100 dark:bg-zinc-800 dark:border-zinc-700"
                                )}
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                {isToday ? "Today" : formatDate(selectedDate)}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                        >
                            <div className="flex flex-col gap-3 p-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onTodayClick}
                                    className={cn(
                                        "justify-start hover:bg-slate-100 dark:hover:bg-zinc-800",
                                        isToday &&
                                        "bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white"
                                    )}
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Today
                                </Button>
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200 dark:border-zinc-700"></div>
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-white dark:bg-zinc-900 px-2 text-xs text-slate-500 dark:text-slate-400">
                                            Or pick a date
                                        </span>
                                    </div>
                                </div>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => onDateChange(e.target.value)}
                                    className="text-sm p-2 border rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white hover:border-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 dark:focus:ring-zinc-600 outline-none transition-colors"
                                />
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={toggleTheme}
                        title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    >
                        {theme === "dark" ? (
                            <Sun className="h-5 w-5 text-yellow-400" />
                        ) : (
                            <Moon className="h-5 w-5 text-slate-700" />
                        )}
                    </Button>

                    {/* Avatar Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8 transition-all hover:ring-2 hover:ring-slate-300 dark:hover:ring-zinc-700">
                                    <AvatarImage
                                        src={`https://avatar.vercel.sh/${user.email}.png`}
                                        alt={user.email}
                                    />
                                    <AvatarFallback className="bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-slate-300">
                                        {getInitials(user.email)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 w-56"
                            align="end"
                            forceMount
                        >
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none text-slate-900 dark:text-white">
                                        {user.email}
                                    </p>
                                    <p className="text-xs leading-none text-slate-500 dark:text-slate-400">
                                        {user.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-slate-200 dark:bg-zinc-700" />
                            <DropdownMenuItem
                                onClick={onSettingsClick}
                                className="text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-200 dark:bg-zinc-700" />
                            <DropdownMenuItem
                                onClick={onLogout}
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 cursor-pointer"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-5 w-5"
                                >
                                    <line x1="4" x2="20" y1="12" y2="12" />
                                    <line x1="4" x2="20" y1="6" y2="6" />
                                    <line x1="4" x2="20" y1="18" y2="18" />
                                </svg>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                        >
                            <DropdownMenuItem
                                onClick={() => setView("saved")}
                                className="cursor-pointer text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-zinc-800"
                            >
                                <Bookmark className="mr-2 h-4 w-4" />
                                Saved Items
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>

    );
};

export default Navbar;