"use client";

import { useTelegram } from "@/components/providers/telegram-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  firstName: string;
  lastName?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackClassName?: string;
}

const sizeClasses = {
  xs: "h-5 w-5 text-[8px]",
  sm: "h-7 w-7 text-[10px]",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-lg",
};

export function UserAvatar({
  src,
  firstName,
  lastName,
  size = "md",
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const initials = `${firstName.charAt(0)}${lastName?.charAt(0) || ""}`.toUpperCase();
  
  // Градиент на основе имени
  const gradients = [
    "from-[#3BCEAC] to-[#2DD4BF]",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-emerald-500",
    "from-orange-500 to-amber-500",
    "from-rose-500 to-red-500",
    "from-indigo-500 to-violet-500",
  ];
  const gradientIndex = firstName.charCodeAt(0) % gradients.length;
  const gradient = gradients[gradientIndex];

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={src || undefined} alt={`${firstName} ${lastName || ""}`} />
      <AvatarFallback 
        className={cn(
          "bg-gradient-to-br text-white font-semibold",
          gradient,
          fallbackClassName
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

// Компонент для текущего пользователя из Telegram
export function TelegramUserAvatar({ size = "md", className }: { size?: UserAvatarProps["size"]; className?: string }) {
  const { user } = useTelegram();
  
  if (!user) {
    return (
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarFallback className="bg-gray-200 text-gray-500">?</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <UserAvatar
      src={user.photo_url}
      firstName={user.first_name}
      lastName={user.last_name}
      size={size}
      className={className}
    />
  );
}

// Компонент для стека аватаров (например, кто проголосовал)
interface AvatarStackProps {
  users: Array<{
    id: string;
    firstName: string;
    lastName?: string;
    photoUrl?: string | null;
  }>;
  max?: number;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export function AvatarStack({ users, max = 5, size = "sm", className }: AvatarStackProps) {
  const displayUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex -space-x-2">
        {displayUsers.map((user, index) => (
          <div
            key={user.id}
            className="relative inline-block"
            style={{ zIndex: displayUsers.length - index }}
          >
            <UserAvatar
              src={user.photoUrl}
              firstName={user.firstName}
              lastName={user.lastName}
              size={size}
              className="border-2 border-white ring-0"
            />
          </div>
        ))}
        {remaining > 0 && (
          <div
            className={cn(
              "flex items-center justify-center rounded-full border-2 border-white bg-gray-100 text-gray-600 font-medium",
              sizeClasses[size]
            )}
            style={{ zIndex: 0 }}
          >
            +{remaining}
          </div>
        )}
      </div>
    </div>
  );
}
