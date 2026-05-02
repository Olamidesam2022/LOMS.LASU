import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Scale
} from 'lucide-react';
import { LitigationCase } from '@/types/legal';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  cases: LitigationCase[];
  onViewCase: (caseItem: LitigationCase) => void;
}

export function CalendarView({ cases, onViewCase }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDay }, (_, i) => i);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getCasesForDay = (day: number) => {
    return cases.filter(c => {
      const hearingDate = c.nextHearing;
      return (
        hearingDate.getDate() === day &&
        hearingDate.getMonth() === currentDate.getMonth() &&
        hearingDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const upcomingHearings = cases
    .filter(c => c.nextHearing >= new Date())
    .sort((a, b) => a.nextHearing.getTime() - b.nextHearing.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Court Calendar</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">View and manage hearing schedules</p>
        </div>
        <div className="flex items-center">
          <div className="flex rounded-lg border border-border bg-card overflow-hidden">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium capitalize transition-colors",
                  view === v 
                    ? "bg-accent text-accent-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 overflow-hidden">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between border-b border-border p-3 sm:p-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="rounded-lg p-1.5 sm:p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <h3 className="text-sm sm:text-lg font-semibold text-foreground">
                {currentDate.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => navigateMonth('next')}
                className="rounded-lg p-1.5 sm:p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 border-b border-border">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="p-2 sm:p-3 text-center text-xs sm:text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7">
              {emptyDays.map(i => (
                <div key={`empty-${i}`} className="min-h-[60px] sm:min-h-[80px] border-b border-r border-border p-1 sm:p-2" />
              ))}
              {days.map(day => {
                const dayCases = getCasesForDay(day);
                const hasHearing = dayCases.length > 0;
                
                return (
                  <div
                    key={day}
                    className={cn(
                      "min-h-[60px] sm:min-h-[80px] border-b border-r border-border p-1 sm:p-2 transition-colors hover:bg-muted/30",
                      isToday(day) && "bg-accent/10"
                    )}
                  >
                    <span className={cn(
                      "inline-flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full text-xs sm:text-sm",
                      isToday(day) && "bg-accent text-accent-foreground font-bold",
                      hasHearing && !isToday(day) && "bg-destructive/10 text-destructive font-medium"
                    )}>
                      {day}
                    </span>
                    {dayCases.slice(0, 1).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => onViewCase(c)}
                        className="mt-0.5 sm:mt-1 block w-full truncate rounded bg-accent/20 px-1 py-0.5 text-left text-[9px] sm:text-xs font-medium text-accent-foreground hover:bg-accent/30"
                      >
                        {c.suitNumber}
                      </button>
                    ))}
                    {dayCases.length > 1 && (
                      <span className="mt-0.5 block text-[9px] sm:text-xs text-muted-foreground">
                        +{dayCases.length - 1} more
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Hearings Sidebar */}
        <div className="space-y-3 sm:space-y-4">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-accent-foreground flex-shrink-0" />
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Upcoming Hearings</h3>
              </div>
            </div>
            <div className="divide-y divide-border max-h-[40vh] sm:max-h-[50vh] overflow-y-auto scrollbar-thin">
              {upcomingHearings.map((caseItem, index) => (
                <button
                  key={caseItem.id}
                  onClick={() => onViewCase(caseItem)}
                  className="w-full p-3 sm:p-4 text-left transition-colors hover:bg-muted/30 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-accent/10 text-accent-foreground">
                      <span className="text-[8px] sm:text-[10px] font-medium">
                        {caseItem.nextHearing.toLocaleDateString('en-NG', { month: 'short' })}
                      </span>
                      <span className="text-xs sm:text-sm font-bold">
                        {caseItem.nextHearing.getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground text-xs sm:text-sm">
                        {caseItem.suitNumber}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {caseItem.caseTitle}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 text-[10px] sm:text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {caseItem.nextHearing.toLocaleTimeString('en-NG', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          <span className="truncate max-w-[80px] sm:max-w-none">{caseItem.court.split(' ').slice(0, 2).join(' ')}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {upcomingHearings.length === 0 && (
                <div className="p-4 sm:p-6 text-center text-muted-foreground">
                  <CalendarIcon className="mx-auto h-6 w-6 sm:h-8 sm:w-8 opacity-50" />
                  <p className="mt-2 text-xs sm:text-sm">No upcoming hearings</p>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
            <h4 className="mb-2 sm:mb-3 text-xs sm:text-sm font-medium text-foreground">Legend</h4>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-accent flex-shrink-0" />
                <span className="text-muted-foreground">Today</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-destructive/50 flex-shrink-0" />
                <span className="text-muted-foreground">Has Hearing</span>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded bg-accent/20 flex-shrink-0" />
                <span className="text-muted-foreground">Case Event</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
