import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";
export const metadata = {
    title: "HealthBridge_Al",
    description: "Your Bridge to Better Health",
};
export default function RootLayout({ children, }) {
    return (<html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet"/>
      </head>
      <body className={cn("font-body antialiased")}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>);
}
