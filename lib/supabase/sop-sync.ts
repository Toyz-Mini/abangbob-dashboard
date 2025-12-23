import { getSupabaseClient } from './client';
import { SOPTemplate, SOPStep, SOPLog, SOPLogItem } from '../types';
import { MOCK_SOP_TEMPLATES, MOCK_SOP_STEPS } from '../staff-portal-data';
import { generateUUID } from '../utils';

// ==================== FETCHING ====================

export const getActiveSOPTemplate = async (shiftType: string): Promise<{ template: SOPTemplate | null, steps: SOPStep[] }> => {
    const supabase = getSupabaseClient() as any;
    if (!supabase) {
        console.warn('Supabase client not initialized, falling back to mock data');
        const mockTmpl = MOCK_SOP_TEMPLATES.find(t => t.shiftType === shiftType);
        if (mockTmpl) {
            return {
                template: mockTmpl,
                steps: MOCK_SOP_STEPS[mockTmpl.id] || []
            };
        }
        return { template: null, steps: [] };
    }

    try {
        // Try Supabase first
        const { data: templatesData, error } = await supabase
            .from('sop_templates')
            .select('*')
            .eq('is_active', true)
            .eq('shift_type', shiftType)
            .limit(1);

        if (error || !templatesData || templatesData.length === 0) {
            throw new Error('No template found');
        }

        const template = templatesData[0] as any;

        // Fetch steps
        const { data: stepsData, error: stepError } = await supabase
            .from('sop_steps')
            .select('*')
            .eq('template_id', template.id)
            .order('step_order', { ascending: true });

        if (stepError) throw stepError;

        const steps = (stepsData || []) as any[];

        // Map snake_case to camelCase
        return {
            template: {
                id: template.id,
                title: template.title,
                description: template.description,
                targetRole: template.target_role,
                shiftType: template.shift_type,
                isActive: template.is_active,
                createdAt: template.created_at
            },
            steps: steps.map((s: any) => ({
                id: s.id,
                templateId: s.template_id,
                title: s.title,
                description: s.description,
                stepOrder: s.step_order,
                isRequired: s.is_required,
                requiresPhoto: s.requires_photo,
                requiresValue: s.requires_value,
                valueType: s.value_type,
                minValue: s.min_value,
                maxValue: s.max_value,
                createdAt: s.created_at
            }))
        };

    } catch (error) {
        console.warn('Using Local Mock SOP Data', error);
        const mockTmpl = MOCK_SOP_TEMPLATES.find(t => t.shiftType === shiftType);
        if (mockTmpl) {
            return {
                template: mockTmpl,
                steps: MOCK_SOP_STEPS[mockTmpl.id] || []
            };
        }
        return { template: null, steps: [] };
    }
};

// ==================== SUBMISSION ====================

export const startSOPLog = async (templateId: string, staffId: string, outletId?: string): Promise<SOPLog> => {
    const supabase = getSupabaseClient() as any;
    // Determine active log or create new
    const id = generateUUID();
    const now = new Date().toISOString();

    const newLog: SOPLog = {
        id,
        templateId,
        staffId,
        startedAt: now,
        status: 'in_progress',
        totalSteps: 0,
        completedSteps: 0,
        outletId
    };

    if (!supabase) return newLog;

    try {
        const { error } = await supabase.from('sop_logs').insert({
            id: newLog.id,
            template_id: newLog.templateId,
            staff_id: newLog.staffId,
            started_at: newLog.startedAt,
            status: newLog.status,
            outlet_id: newLog.outletId
        });
        if (error) throw error;
        return newLog;
    } catch (e) {
        console.warn('Offline mode: SOP Log started locally', e);
        return newLog;
    }
};

export const submitSOPLogItem = async (logId: string, stepId: string, value: any, photoUrl?: string): Promise<boolean> => {
    const supabase = getSupabaseClient() as any;
    if (!supabase) return false;

    try {
        // Upsert item
        const { error } = await supabase.from('sop_log_items').insert({
            log_id: logId,
            step_id: stepId,
            is_checked: true,
            input_value: value?.toString(),
            photo_url: photoUrl,
            completed_at: new Date().toISOString()
        });

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Failed to submit step', e);
        return false;
    }
};

export const completeSOPLog = async (logId: string): Promise<boolean> => {
    const supabase = getSupabaseClient() as any;
    if (!supabase) return true; // Pretend success offline

    try {
        const { error } = await supabase.from('sop_logs').update({
            status: 'completed',
            completed_at: new Date().toISOString()
        }).eq('id', logId);

        if (error) throw error;
        return true;
    } catch (e) {
        console.error('Failed to complete SOP', e);
        return false;
    }
};

// ==================== AUDIT / MANAGER ====================

export const getSOPLogs = async (dateStr?: string) => {
    const supabase = getSupabaseClient() as any;
    if (!supabase) return [];

    try {
        let query = supabase
            .from('sop_logs')
            .select(`
                *,
                sop_templates (title, shift_type)
            `)
            .order('started_at', { ascending: false });

        if (dateStr) {
            // Filter by date (approximate based on started_at string)
            query = query.gte('started_at', `${dateStr}T00:00:00`).lte('started_at', `${dateStr}T23:59:59`);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map((log: any) => ({
            id: log.id,
            templateName: log.sop_templates?.title || 'Unknown',
            shiftType: log.sop_templates?.shift_type || 'any',
            staffId: log.staff_id,
            status: log.status,
            startedAt: log.started_at,
            completedAt: log.completed_at
        }));
    } catch (e) {
        console.error('Error fetching SOP logs', e);
        return [];
    }
};

export const getSOPLogDetails = async (logId: string) => {
    const supabase = getSupabaseClient() as any;
    if (!supabase) return null;

    try {
        // Fetch log + template info
        const { data: log, error: logError } = await supabase
            .from('sop_logs')
            .select(`*, sop_templates (*)`)
            .eq('id', logId)
            .single();

        if (logError) throw logError;

        // Fetch items + step details
        const { data: items, error: itemsError } = await supabase
            .from('sop_log_items')
            .select(`*, sop_steps (*)`)
            .eq('log_id', logId);

        if (itemsError) throw itemsError;

        return {
            log: {
                id: log.id,
                templateName: log.sop_templates?.title,
                staffId: log.staff_id,
                status: log.status,
                startedAt: log.started_at,
                completedAt: log.completed_at
            },
            items: items.map((item: any) => ({
                id: item.id,
                stepTitle: item.sop_steps?.title || 'Unknown Step',
                stepDescription: item.sop_steps?.description,
                isChecked: item.is_checked,
                inputValue: item.input_value,
                photoUrl: item.photo_url,
                completedAt: item.completed_at,
                requiresPhoto: item.sop_steps?.requires_photo
            }))
        };
    } catch (e) {
        console.error('Error fetching details', e);
        return null;
    }
};
