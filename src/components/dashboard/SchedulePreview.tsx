"use client";

import { Task } from "@/lib/firebase/firestore";
import { format } from "date-fns";

interface SchedulePreviewProps {
  tasks: Task[];
}

export default function SchedulePreview({ tasks }: SchedulePreviewProps) {
  // very light weekly buckets (Mon–Sun)
  const buckets: Record<string, number> = {};
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    buckets[format(d, "EEE")] = 0;
  }
  tasks.forEach((t) => {
    const due = (t as any).dueDate?.toDate ? (t as any).dueDate.toDate() : (t as any).dueDate;
    if (due instanceof Date) {
      const key = format(due, "EEE");
      if (key in buckets) buckets[key] += 1;
    }
  });

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="text-sm font-semibold mb-3">Próximos 7 días</div>
      <div className="grid grid-cols-7 gap-2">
        {Object.entries(buckets).map(([day, count]) => (
          <div key={day} className="text-center">
            <div className="text-xs text-gray-500 mb-1">{day}</div>
            <div className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-medium">
              {count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

