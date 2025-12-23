import { getSupabaseClient } from './supabase/client';

export interface StaffXP {
    staffId: string;
    currentXP: number;
    currentLevel: number;
    totalPoints: number;
    nextLevelXP: number;
    progress: number; // 0-100
}

// Leveling Curve: Level N requires roughly N * 1000 XP total?
// Let's use a simple tier system:
// Lvl 1: 0 - 500
// Lvl 2: 501 - 1500
// Lvl 3: 1501 - 3000
// Lvl 4: 3001 - 5000
// Lvl 5: 5001+
const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5000, 8000, 12000, 17000, 23000, 30000];

export const calculateLevelInfo = (xp: number) => {
    let level = 1;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            level = i + 1;
        } else {
            break;
        }
    }

    const currentThreshold = LEVEL_THRESHOLDS[level - 1];
    const nextThreshold = LEVEL_THRESHOLDS[level] || (currentThreshold + 10000); // Cap fallback

    // XP within this level
    const xpInLevel = xp - currentThreshold;
    const xpNeededForLevel = nextThreshold - currentThreshold;
    const progress = Math.min(100, Math.floor((xpInLevel / xpNeededForLevel) * 100));

    return { level, nextLevelXP: nextThreshold, progress };
};

export const getStaffXP = async (staffId: string): Promise<StaffXP> => {
    const supabase = getSupabaseClient() as any;

    // Default fallback
    const defaultXP: StaffXP = {
        staffId,
        currentXP: 0,
        currentLevel: 1,
        totalPoints: 0,
        nextLevelXP: 500,
        progress: 0
    };

    if (!supabase) return defaultXP;

    try {
        const { data, error } = await supabase
            .from('staff_xp')
            .select('*')
            .eq('staff_id', staffId)
            .single();

        if (error || !data) {
            // If no record exists (new staff), return default
            return defaultXP;
        }

        const { level, nextLevelXP, progress } = calculateLevelInfo(data.current_xp);

        return {
            staffId,
            currentXP: data.current_xp,
            currentLevel: level, // Recalculate level dynamically to ensure sync with constants
            totalPoints: data.total_points_earned,
            nextLevelXP,
            progress
        };
    } catch (e) {
        console.error('Error fetching XP', e);
        return defaultXP;
    }
};

export const awardXP = async (staffId: string, points: number, reason: string, metadata?: any): Promise<StaffXP | null> => {
    const supabase = getSupabaseClient() as any;
    if (!supabase) return null;

    try {
        // 1. Log the transaction
        await supabase.from('xp_logs').insert({
            staff_id: staffId,
            points,
            reason,
            metadata
        });

        // 2. Fetch current XP to increment
        const { data: currentRecord } = await supabase
            .from('staff_xp')
            .select('current_xp, total_points_earned')
            .eq('staff_id', staffId)
            .single();

        let newXP = points;
        let newTotal = points;

        if (currentRecord) {
            newXP += currentRecord.current_xp;
            newTotal += currentRecord.total_points_earned;

            // Update
            await supabase.from('staff_xp').update({
                current_xp: newXP,
                total_points_earned: newTotal,
                current_level: calculateLevelInfo(newXP).level,
                updated_at: new Date().toISOString()
            }).eq('staff_id', staffId);
        } else {
            // Insert
            await supabase.from('staff_xp').insert({
                staff_id: staffId,
                current_xp: newXP,
                total_points_earned: newTotal,
                current_level: calculateLevelInfo(newXP).level
            });
        }

        // Return new state
        const levelInfo = calculateLevelInfo(newXP);
        return {
            staffId,
            currentXP: newXP,
            currentLevel: levelInfo.level,
            totalPoints: newTotal,
            nextLevelXP: levelInfo.nextLevelXP,
            progress: levelInfo.progress
        };

    } catch (e) {
        console.error('Error awarding XP', e);
        return null;
    }
};

export const getLeaderboard = async () => {
    const supabase = getSupabaseClient() as any;
    if (!supabase) return [];

    try {
        const { data, error } = await supabase
            .from('staff_xp')
            .select('*, staff:staff_id(name, role)') // Join to get name
            .order('current_xp', { ascending: false })
            .limit(10);

        if (error) throw error;

        return data.map((row: any) => ({
            staffId: row.staff_id,
            name: row.staff?.name || 'Unknown',
            role: row.staff?.role || 'Staff',
            xp: row.current_xp,
            level: row.current_level
        }));
    } catch (e) {
        console.error('Error fetching leaderboard', e);
        return [];
    }
};
