"use client";
import Link from "next/link";
import Image from "next/image"; // 👈 Added Image import
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, User } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useLanguage } from "@/hooks/useLanguage";

export default function DashboardHeader({ role }) {
  const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar");
  const { t } = useLanguage();

  return (<header className="sticky top-0 z-30 flex h-auto py-4 items-center gap-4 border-b bg-background/80 backdrop-blur-lg px-4 md:px-6">
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="flex items-center gap-3 group/brand">
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-cyan-500 rounded-xl blur opacity-25 group-hover/brand:opacity-75 transition duration-500"></div>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-white/50 shadow-sm overflow-hidden p-1.5 ring-1 ring-black/5">
            <Image
              src="/icon.png"
              alt="HealthBridge_Al Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-black text-lg tracking-tighter text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text">
            HealthBridge_Al
          </span>
        </div>
      </Link>
      {role && (
        <Badge variant="secondary" className="hidden md:flex h-7 items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          {role} Dashboard
        </Badge>
      )}
    </div>
    <div className="ml-auto flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userAvatar?.imageUrl} alt="User avatar" data-ai-hint={userAvatar?.imageHint} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{t("dashboard.profile")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>{t("dashboard.profile")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>{t("dashboard.settings")}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => {
            import("@/lib/auth").then(({ logout }) => logout());
          }} className="cursor-pointer text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t("dashboard.logout")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>);
}
