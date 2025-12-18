'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, addMonths, subMonths, isWithinInterval } from 'date-fns';
import { ms } from 'date-fns/locale';

export type DateRange = {
    from: Date;
    to: Date;
};

interface DateRangePickerProps {
    date?: DateRange;
    onSelect: (range: DateRange) => void;
    className?: string;
}

export function DateRangePicker({ date, onSelect, className = '' }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [tempRange, setTempRange] = useState<DateRange | undefined>(date);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync prop changes
    useEffect(() => {
        setTempRange(date);
    }, [date]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const presets = [
        { label: 'Hari Ini', range: { from: new Date(), to: new Date() } },
        { label: 'Semalam', range: { from: subDays(new Date(), 1), to: subDays(new Date(), 1) } },
        { label: 'Minggu Ini', range: { from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) } },
        { label: 'Bulan Ini', range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
        { label: '30 Hari Lepas', range: { from: subDays(new Date(), 30), to: new Date() } },
    ];

    const handlePresetClick = (range: DateRange) => {
        onSelect(range);
        setIsOpen(false);
    };

    const handleApply = () => {
        if (tempRange) {
            onSelect(tempRange);
            setIsOpen(false);
        }
    };

    // Helper to render calendar days
    const renderCalendar = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = '';

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd');
                const cloneDay = day;

                let isSelected = false;
                let isInRange = false;
                let isStart = false;
                let isEnd = false;

                if (tempRange) {
                    isStart = isSameDay(day, tempRange.from);
                    isEnd = isSameDay(day, tempRange.to);
                    isSelected = isStart || isEnd;

                    if (day > tempRange.from && day < tempRange.to) {
                        isInRange = true;
                    }
                }

                const isCurrentMonth = isSameDay(day, new Date()) || format(currentMonth, 'M') === format(day, 'M');

                days.push(
                    <div
                        key={day.toISOString()}
                        className={`
              w-9 h-9 flex items-center justify-center text-sm cursor-pointer rounded-full transition-colors
              ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700 dark:text-gray-200'}
              ${isSelected ? 'bg-primary text-white hover:bg-primary-dark' : ''}
              ${isInRange ? 'bg-primary-50 text-gray-900 rounded-none' : ''}
              ${isStart && isInRange ? 'rounded-l-full' : ''}
              ${isEnd && isInRange ? 'rounded-r-full' : ''}
              ${!isSelected && !isInRange ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : ''}
            `}
                        onClick={() => {
                            if (!tempRange || (tempRange.from && tempRange.to)) {
                                // Start new selection
                                setTempRange({ from: cloneDay, to: cloneDay });
                            } else {
                                // Complete selection
                                if (cloneDay < tempRange.from) {
                                    setTempRange({ from: cloneDay, to: tempRange.from });
                                } else {
                                    setTempRange({ from: tempRange.from, to: cloneDay });
                                }
                            }
                        }}
                    >
                        {formattedDate}
                    </div>
                );
                day = subDays(addMonths(day, 0), -1); // Bug fix for addDays? Just use JS date math or date-fns addDays properly
                // Actually simpler:
                // day = addDays(day, 1); // But I need to import it. Let's rely on loop increment
                // Re-implement correctly below loop
            }
            rows.push(
                <div className="flex justify-between mb-1" key={day.toISOString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <>{rows}</>;
    };

    // Correct calendar loop logic (the above loop had increment issue)
    // Let's rewrite renderDays properly
    const renderDays = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const dateFormat = "d";
        const weeks = [];
        let days = [];
        let day = startDate;
        let loopDate = startDate;

        while (loopDate <= endDate) {
            for (let i = 0; i < 7; i++) {
                const currentDate = loopDate;

                let isSelected = false;
                let isInRange = false;
                let isStart = false;
                let isEnd = false;

                if (tempRange) {
                    isStart = isSameDay(currentDate, tempRange.from);
                    isEnd = isSameDay(currentDate, tempRange.to);
                    isSelected = isStart || isEnd;

                    if (tempRange.to && currentDate > tempRange.from && currentDate < tempRange.to) {
                        isInRange = true;
                    }
                }

                const isThisMonth = format(currentDate, 'M') === format(currentMonth, 'M');

                days.push(
                    <div
                        key={currentDate.toString()}
                        className={`
              relative w-9 h-9 flex items-center justify-center text-sm cursor-pointer z-10
              ${!isThisMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200'}
              ${isSelected ? 'bg-primary text-white rounded-full' : ''}
              ${isInRange ? 'bg-red-50 dark:bg-red-900/20' : ''}
              ${!isSelected && !isInRange && isThisMonth ? 'hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full' : ''}
            `}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!tempRange || (tempRange.from && tempRange.to && !isSameDay(tempRange.from, tempRange.to))) {
                                // Start fresh
                                setTempRange({ from: currentDate, to: currentDate });
                            } else {
                                // Second click
                                if (currentDate < tempRange.from) {
                                    setTempRange({ from: currentDate, to: tempRange.from });
                                } else {
                                    setTempRange({ from: tempRange.from, to: currentDate });
                                }
                            }
                        }}
                    >
                        {format(currentDate, dateFormat)}
                    </div>
                );

                // Add 1 day
                const nextDate = new Date(currentDate);
                nextDate.setDate(currentDate.getDate() + 1);
                loopDate = nextDate;
            }
            weeks.push(
                <div className="flex justify-between mb-1" key={loopDate.toString() + '-row'}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="p-2">{weeks}</div>;
    };


    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <CalendarIcon size={18} className="text-gray-500" />
                <span className="text-sm font-medium">
                    {date ? (
                        <>
                            {format(date.from, 'dd MMM')} - {format(date.to, 'dd MMM, yyyy')}
                        </>
                    ) : (
                        'Pilih Tarikh'
                    )}
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {/* Presets Sidebar */}
                    <div className="p-2 w-full md:w-40 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-2 mb-1">Presets</div>
                        <div className="space-y-1">
                            {presets.map((preset, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePresetClick(preset.range)}
                                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calendar Area */}
                    <div className="p-4 w-72">
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="text-sm font-bold">
                                {format(currentMonth, 'MMMM yyyy')}
                            </div>
                            <button
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 mb-2 text-xs text-center text-gray-400 font-medium">
                            <div>Is</div><div>Se</div><div>Ra</div><div>Kh</div><div>Ju</div><div>Sa</div><div>Ah</div>
                        </div>

                        {renderDays()}

                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-3 py-1.5 text-sm btn-ghost"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleApply}
                                className="px-3 py-1.5 text-sm btn-primary rounded-md"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
