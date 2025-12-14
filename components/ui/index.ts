/**
 * UI Components Index
 * Export all UI components for easy importing
 */

// Core Components
export { default as Tooltip, ShortcutTooltip, InfoTooltip } from '../Tooltip';
export { default as Modal } from '../Modal';
export { default as TopProgressBar, useProgress } from '../TopProgressBar';
export { default as CommandPalette, useCommandPalette, CommandPaletteTrigger } from '../CommandPalette';

// Layout Components
export { default as Breadcrumb } from '../Breadcrumb';
export { default as MainLayout } from '../MainLayout';
export { default as Sidebar } from '../Sidebar';
export { default as TopNav } from '../TopNav';

// Data Display
export { default as DataTable, type Column } from '../DataTable';
export { default as Timeline, SimpleTimeline } from '../Timeline';
export { StatCardSkeleton, ChartCardSkeleton, TableCardSkeleton, TableRowSkeleton, DashboardSkeleton } from '../Skeleton';
export { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton, SkeletonImage } from '../Skeleton';
export { default as ChartCard } from '../ChartCard';
export { default as StatCard } from '../StatCard';
export { default as EmptyState } from '../EmptyState';
export { default as LoadingSpinner } from '../LoadingSpinner';

// Navigation
export { default as Tabs, TabsList, TabTrigger, TabContent, SimpleTabs } from '../Tabs';
export { default as BottomNav, useBottomNav } from '../BottomNav';

// Overlays & Dialogs
export { default as ConfirmDialog, useConfirmDialog } from '../ConfirmDialog';
export { default as Popover, PopoverHeader, PopoverContent, PopoverFooter, DropdownMenu } from '../Popover';
export { default as Sheet, ActionSheet } from '../Sheet';

// Forms
export { FormField, ValidatedInput, ValidatedSelect, ValidatedTextarea, AutoSaveIndicator, validationRules, useAutoSave } from '../FormField';

// Actions
export { default as FloatingActionButton, SimpleFAB } from '../FloatingActionButton';

// Timer & Status
export { default as OrderTimer, CountdownTimer, TimerBadge } from '../OrderTimer';
export { default as OfflineIndicator, OnlineStatusProvider, useOnlineStatus, OfflineStatusBadge } from '../OfflineIndicator';

// Re-export contexts
export { useKeyboardShortcuts, useShortcut, KeyboardShortcutsHelp } from '../../lib/contexts/KeyboardShortcutsContext';
export { useEnhancedToast, useUndoableAction } from '../../lib/contexts/EnhancedToastContext';


