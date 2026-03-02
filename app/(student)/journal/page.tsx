"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { BookX, Calendar, Clock, CheckCircle2, XCircle, FileText } from "lucide-react";
import { ErrorFallbackInline } from "@/components/ui/error-fallback";
import { useUser } from "@/src/hooks/use-user-context";

interface AttendanceRecord {
  id: string;
  status: 'ATTENDED' | 'NO_SHOW' | 'CANCELLED';
  notes: string | null;
  createdAt: string;
  booking: {
    id: string;
    class: {
      id: string;
      date: string;
      schedule: {
        id: string;
        dayOfWeek: number;
        time: string;
        group: {
          id: string;
          name: string;
          description: string | null;
        };
      };
    };
  };
}

export default function StudentJournalPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    async function fetchAttendance() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch bookings with status ATTENDED
        const response = await fetch(`/api/bookings?userId=${user!.id}&status=ATTENDED`);
        const data = await response.json();
        
        if (data.success) {
          // Transform bookings to attendance records format
          interface BookingWithAttendance {
            id: string;
            attendance?: {
              id: string;
              status: "ATTENDED" | "NO_SHOW" | "CANCELLED";
              notes: string | null;
              createdAt: string;
            };
            class: {
              id: string;
              date: string;
              schedule: {
                id: string;
                dayOfWeek: number;
                time: string;
                group: {
                  id: string;
                  name: string;
                  description: string | null;
                };
              };
            };
          }
          const records: AttendanceRecord[] = (data.data as BookingWithAttendance[] || [])
            .filter((booking): booking is BookingWithAttendance & { attendance: NonNullable<BookingWithAttendance["attendance"]> } => !!booking.attendance)
            .map((booking) => ({
              id: booking.attendance.id,
              status: booking.attendance.status,
              notes: booking.attendance.notes,
              createdAt: booking.attendance.createdAt,
              booking: {
                id: booking.id,
                class: booking.class
              }
            }));
          setAttendanceRecords(records);
        } else {
          setError(data.error || "Failed to fetch attendance");
        }
      } catch (err) {
        console.error("Error fetching attendance:", err);
        setError("Failed to load attendance records");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAttendance();
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT':
      case 'ATTENDED':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'ABSENT':
      case 'NO_SHOW':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Calendar className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'PRESENT': 'Посещено',
      'ATTENDED': 'Посещено',
      'ABSENT': 'Неявка',
      'NO_SHOW': 'Неявка',
      'CANCELLED': 'Отменено',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PRESENT': 'bg-green-100 text-green-700',
      'ATTENDED': 'bg-green-100 text-green-700',
      'ABSENT': 'bg-red-100 text-red-700',
      'NO_SHOW': 'bg-red-100 text-red-700',
      'CANCELLED': 'bg-gray-100 text-gray-600',
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <PageHeader title="Журнал" />
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-200 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PageHeader title="Журнал" />

      <div className="p-4 space-y-3">
        {error ? (
          <ErrorFallbackInline 
            error={error} 
            onRetry={() => window.location.reload()} 
          />
        ) : attendanceRecords.length > 0 ? (
          attendanceRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      record.status === 'ATTENDED' 
                        ? 'bg-green-100' 
                        : record.status === 'NO_SHOW' 
                          ? 'bg-red-100' 
                          : 'bg-gray-100'
                    }`}>
                      {getStatusIcon(record.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 text-lg leading-snug">
                          {record.booking.class.schedule.group.name}
                        </h3>
                        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${getStatusColor(record.status)}`}>
                          {getStatusLabel(record.status)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2 text-base text-gray-500 leading-relaxed">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(record.booking.class.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(record.booking.class.schedule.time)}
                        </span>
                      </div>

                      {record.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <p className="text-base text-gray-600 leading-relaxed">{record.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <EmptyState
            icon={BookX}
            title="Нет записей"
            description="История посещений появится после первого занятия"
          />
        )}
      </div>
    </div>
  );
}
