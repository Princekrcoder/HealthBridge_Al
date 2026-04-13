
"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { MedicalLoader } from "@/components/ui/medical-loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { roles, roleRoutes, roleDisplayNames, frontendRoles } from "@/lib/types";
import { useEffect, useState } from "react";
import { setRole } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
import { getTranslation } from "@/lib/translations"; // 👈 Added import
const formSchema = z.object({
  role: z.enum(roles),
  userId: z.string().min(1, { message: "User ID is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});
export function LoginModal({ open, onOpenChange, role }) {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false); // 👈 New state for redirect loader
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: role,
      userId: "",
      password: "",
    },
  });
  useEffect(() => {
    if (role) {
      form.setValue("role", role);
    }
  }, [role, form]);
  const onSubmit = async (values) => {
    try {
      // Map userId to email (User enters ID/Mobile, we send as email for now)
      // TODO: Ask user if they want to change input label to Email or handle logic on backend
      const payload = {
        email: values.userId, // Assuming user types email in userId field for now
        password: values.password,
      };

      const user = await login(payload);

      // Success
      // Backend returns role in user object (e.g., "asha", "citizen").
      // Convert to frontend display name (e.g., "ASHA Worker", "Citizen")
      const backendRole = user.role;
      const displayRole = frontendRoles[backendRole] || backendRole;
      setRole(displayRole);

      toast({
        title: "Login Successful",
        description: `Redirecting to ${roleDisplayNames[displayRole] || displayRole} dashboard...`,
      });

      setIsRedirecting(true); // 👈 Show loader immediately

      // ⚠️ IMPORTANT: Navigate based on ACTUAL role from backend, not selected role
      // This prevents errors when user selects wrong role but enters valid credentials
      const path = roleRoutes[displayRole];
      router.push(path);

    } catch (error) {
      console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
    }
  };
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLang = localStorage.getItem("app-language");
      if (storedLang) {
        setLanguage(storedLang);
      }
    }
  }, [open]); // Re-check on open

  const t = (key) => getTranslation(language, key);

  // 🔴 Show Medical Loader if redirecting
  if (isRedirecting) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background">
        <MedicalLoader />
      </div>
    );
  }

  return (<Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl p-0 rounded-[30px] grid grid-cols-1 md:grid-cols-2 overflow-hidden w-[95vw] md:w-full">
      <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-gray-900 to-primary/90 text-white">
        <h2 className="text-3xl font-bold">{t(`roles.${role} `) || roleDisplayNames[role]} Login</h2>
        <p className="mt-4 text-white/80">{t("login.privacyText")}</p>
        <div className="mt-8 text-xs font-bold tracking-widest text-accent uppercase">
          ● {t("login.secureServer")}
        </div>
      </div>
      <div className="p-5 sm:p-8 md:p-12">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-3xl font-bold">
            {t("login.signIn")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="role" render={({ field }) => (<FormItem>
              <FormLabel className="font-bold text-gray-900">{t("login.selectedRole")}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!role}>
                <FormControl>
                  <SelectTrigger className="py-6 rounded-xl border-2 focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)] disabled:opacity-100 disabled:text-black">
                    <SelectValue placeholder="Select a role">
                      {t(`roles.${field.value} `) || roleDisplayNames[field.value]}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roles.map((r) => (<SelectItem key={r} value={r}>
                    {t(`roles.${r} `) || roleDisplayNames[r]}
                  </SelectItem>))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>)} />
            <FormField control={form.control} name="userId" render={({ field }) => (<FormItem>
              <FormLabel className="font-bold text-muted-foreground">{t("login.userIdLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("login.userIdPlaceholder")} {...field} className="py-6 rounded-xl border-2 focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)]" />
              </FormControl>
              <FormMessage />
            </FormItem>)} />
            <FormField control={form.control} name="password" render={({ field }) => (<FormItem>
              <FormLabel className="font-bold text-muted-foreground">{t("login.passwordLabel")}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} className="py-6 rounded-xl border-2 focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)]" />
              </FormControl>
              <FormMessage />
            </FormItem>)} />
            <Button type="submit" className="w-full py-6 mt-4 rounded-xl text-base font-bold bg-gray-900 hover:bg-primary/90">
              {t("actions.authorizeAndLogin")}
            </Button>
            <div className="text-center pt-2">
              <Button variant="link" size="sm" className="text-primary font-bold">{t("actions.forgotCredentials")}</Button>
            </div>
          </form>
        </Form>
      </div>
    </DialogContent>
  </Dialog>);
}
