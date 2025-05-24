import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStatusColor(statusId: number, statuses: any[] = []) {
  // Get status name
  const status = statuses?.find(s => s.statusId === statusId);
  const statusName = status?.statusName?.toLowerCase() || '';
  
  // Return appropriate color based on status
  if (statusName.includes('closed') || statusName.includes('completed')) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  } else if (statusName.includes('progress') || statusName.includes('pending') || statusName.includes('submitted')) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  } else if (statusName.includes('escalated') || statusName.includes('overdue')) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  } else if (statusName.includes('awaiting') || statusName.includes('hold')) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  } else if (statusName.includes('rejected')) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  } else {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
}
