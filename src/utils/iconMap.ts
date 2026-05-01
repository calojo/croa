import {
  LayoutDashboard,
  FileText,
  FilePlus,
  List,
  FileX,
} from "lucide-react";

export const iconMap: Record<string, any> = {
  LayoutDashboard,
  FileText,
  FilePlus,
  List,
  FileX,
};

export const getIcon = (name: string) => {
  return iconMap[name] || null;
};