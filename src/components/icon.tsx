import {
  Award,
  Crown,
  Trophy,
  Rocket,
  CalendarCheck,
  ClipboardCheck,
  Users,
  Medal,
  TrendingUp,
  Handshake,
  Flame,
  GraduationCap,
  Target,
  LayoutDashboard,
  BookOpen,
  Swords,
  Megaphone,
  LineChart,
  Settings,
  ScrollText,
  Star,
  Zap,
  Heart,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated icon registry — maps the string `icon` stored on achievements /
 * nav items to a lucide component. Curated (rather than importing all icons)
 * to keep the client bundle small.
 */
const ICONS: Record<string, LucideIcon> = {
  Award,
  Crown,
  Trophy,
  Rocket,
  CalendarCheck,
  ClipboardCheck,
  Users,
  Medal,
  TrendingUp,
  Handshake,
  Flame,
  GraduationCap,
  Target,
  LayoutDashboard,
  BookOpen,
  Swords,
  Megaphone,
  LineChart,
  Settings,
  ScrollText,
  Star,
  Zap,
  Heart,
  ShieldCheck,
};

export const ACHIEVEMENT_ICON_NAMES = [
  "Award", "Crown", "Trophy", "Rocket", "CalendarCheck", "ClipboardCheck",
  "Users", "Medal", "TrendingUp", "Handshake", "Flame", "GraduationCap",
  "Target", "Star", "Zap", "Heart", "ShieldCheck",
];

export function Icon({
  name,
  className,
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Cmp = ICONS[name] ?? Award;
  return <Cmp className={className} size={size} />;
}
