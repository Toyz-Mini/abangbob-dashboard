import React from 'react';

interface BentoGridProps {
    className?: string;
    children: React.ReactNode;
}

export const BentoGrid = ({ className, children }: BentoGridProps) => {
    return (
        <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto ${className}`}
        >
            {children}
        </div>
    );
};

interface BentoCardProps {
    className?: string;
    title: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    colSpan?: 1 | 2 | 3;
}

export const BentoCard = ({
    className,
    title,
    description,
    header,
    icon,
    children,
    colSpan = 1,
}: BentoCardProps) => {
    const colSpanClass = {
        1: 'md:col-span-1',
        2: 'md:col-span-2',
        3: 'md:col-span-3',
    }[colSpan];

    return (
        <div
            className={`
        glass-panel p-8 rounded-2xl flex flex-col justify-between space-y-4 hover-lift
        ${colSpanClass}
        ${className}
      `}
        >
            {header}
            <div className="group-hover/bento:translate-x-2 transition duration-200">
                {icon}
                <div className="font-bold text-gray-900 dark:text-gray-100 mb-1 mt-2 tracking-tight text-lg">
                    {title}
                </div>
                {description && (
                    <div className="font-normal text-gray-600 dark:text-gray-400 text-xs">
                        {description}
                    </div>
                )}
            </div>
            {children}
        </div>
    );
};
