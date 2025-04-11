import { BsCreditCard2Back } from "react-icons/bs";
import { HiOutlineHome } from "react-icons/hi";
import { IoPersonOutline } from "react-icons/io5";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

export default function BottomNav() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-background">
      <div className="mx-auto flex h-full max-w-md items-center justify-around">
        <Link href="/">
          <div
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center",
              isActive("/") && "text-primary",
            )}
          >
            <HiOutlineHome className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </div>
        </Link>
        <Link href="/quantitative">
          <div
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center",
              isActive("/quantitative") && "text-primary",
            )}
          >
            <BsCreditCard2Back className="h-6 w-6" />
            <span className="text-xs">Quantitative</span>
          </div>
        </Link>

        <Link href="/invite">
          <div
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center",
              isActive("/invite") && "text-primary",
            )}
          >
            <BsCreditCard2Back className="h-6 w-6" />
            <span className="text-xs">Invite</span>
          </div>
        </Link>

        <Link href="/profile">
          <div
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center",
              isActive("/profile") && "text-primary",
            )}
          >
            <IoPersonOutline className="h-6 w-6" />
            <span className="text-xs">Profile</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
