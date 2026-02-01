'use client';

import { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { StockTransferRequest, TransferStatus, StockItem } from '@/lib/types'; // Import types
import Modal from '@/components/Modal';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import {
    ArrowRightLeft,
    ArrowRight,
    Check,
    X,
    Plus,
    Clock,
    CheckCircle,
    FileText,
    Truck,
    Building
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

const supabase = getSupabaseClient();

export default function StockTransferView() {
    const { user, currentStaff } = useAuth();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('outgoing');
    const [requests, setRequests] = useState<StockTransferRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [availableStockItems, setAvailableStockItems] = useState<StockItem[]>([]); // Items to request
    const [outlets, setOutlets] = useState<{ id: string, name: string, is_warehouse: boolean }[]>([]);

    const [formData, setFormData] = useState({
        stockItemId: '',
        quantity: 0,
        toOutletId: '', // Requesting FROM this outlet (usually Warehouse)
        notes: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // My Outlet ID - assume staff is assigned to one.
    // Ideally this should come from context or staff assignment.
    // For now, I'll fetch it or use a placeholder if not found.
    // Admin sees all? Let's implement for specific outlet view first.
    const [myOutletId, setMyOutletId] = useState<string | null>(null);

    useEffect(() => {
        // Determine my outlet
        const fetchMyOutlet = async () => {
            // If staff, get assignment. 
            // For simplified v1, let's assume `user` puts us in Main or we find assignment.
            // Actually, let's look at `staff_outlet_assignments` for today.
            if (currentStaff) {
                const today = new Date().toISOString().split('T')[0];
                const { data } = await supabase
                    .from('staff_outlet_assignments')
                    .select('outlet_id')
                    .eq('staff_id', currentStaff.id)
                    .eq('assignment_date', today)
                    .maybeSingle(); // Use maybeSingle to avoid error if none

                if (data) {
                    setMyOutletId(data.outlet_id);
                } else {
                    // Fallback or Admin view?
                    // If Admin, maybe select *?
                }
            } else if (user?.role === 'Admin') {
                // Admin sees all? Or toggle?
                // For now, let's set to 'MAIN' or Warehouse for testing
                // or fetch the first active outlet
                const { data } = await supabase.from('outlets').select('id').eq('is_warehouse', true).single();
                if (data) setMyOutletId(data.id);
            }
        };

        fetchMyOutlet();
        fetchOutlets();
        fetchStockItems();
    }, [user, currentStaff]);

    useEffect(() => {
        if (myOutletId) {
            fetchRequests();
        }
    }, [myOutletId, activeTab]);

    const fetchOutlets = async () => {
        const { data } = await supabase.from('outlets').select('id, name, is_warehouse').eq('status', 'active');
        if (data) setOutlets(data);
    };

    const fetchStockItems = async () => {
        // Fetch generic list of items to request
        // Actually we should fetch items available in the *Source* outlet?
        // Or just all known stock items defined in system?
        // Typically request depends on what *I* need, so I select from central item list.
        const { data } = await supabase.from('stock_items').select('*').limit(500); // Simple fetch
        if (data) {
            // Deduplicate by name if multiple outlets have same items?
            // Stock items are per outlet. We need detailed "Product" list.
            // But we only have `stock_items` (which are per outlet).
            // So likely we list unique names?
            // Or we list items from the Warehouse to request?
            // Let's list unique items by name for selection.
            const unique = (data as any[]).reduce<StockItem[]>((acc, current) => {
                if (!acc.find(item => item.name === current.name)) {
                    acc.push(current as StockItem);
                }
                return acc;
            }, []);
            setAvailableStockItems(unique);
        }
    };

    const fetchRequests = async () => {
        if (!myOutletId) return;
        setLoading(true);

        // Query depends on tab
        // Outgoing: Request FROM my_outlet TO somewhere
        // Incoming: Request FROM somewhere TO my_outlet

        let query = supabase.from('stock_transfer_requests')
            .select(`
            id, 
            from_outlet_id, 
            to_outlet_id, 
            stock_item_id, 
            requested_quantity, 
            status, 
            created_at,
            notes,
            from_outlet:from_outlet_id(name),
            to_outlet:to_outlet_id(name),
            requester:requested_by(name)
        `);
        // Need to join stock_items to get name, but `stock_item_id` links to specific row.
        // We can get name via another join or fetch.

        if (activeTab === 'outgoing') {
            // I am the requester (from_outlet_id is ME)
            // Wait, "Stock Transfer Request":
            // Does "from_outlet_id" mean Source of stock (Warehouse) or Requester?
            // Usually: "Request from Warehouse" means Warehouse is Source (from), I am Destination (to).
            // Let's clarify convention.
            // If I "Request Stock", I want stock TO come TO me.
            // So `to_outlet_id` = ME. `from_outlet_id` = WAREHOUSE.

            // So "My Requests" (Outgoing request, incoming stock) => to_outlet_id = myOutletId
            // "Incoming Requests" (Someone asking ME for stock) => from_outlet_id = myOutletId

            // Let's stick to this:
            // Tab "My Requests" (Requests I made) -> to_outlet_id = myOutletId
            // Tab "To Fulfill" (Requests others made to me) -> from_outlet_id = myOutletId

            query = query.eq('to_outlet_id', myOutletId); // I requested it
        } else {
            // Incoming Request (Active Tab = 'incoming') -> To Fulfill
            query = query.eq('from_outlet_id', myOutletId); // They want stock FROM me
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching transfers:', error);
            showToast('Gagal memuatkan rekues', 'error');
        } else {
            // Map to our type
            // Note: stock_item_id is raw. We need names.
            // For MVP, we'll fetch map of stock_item_id -> Name separately or just display ID if join fails.
            // Actually, let's fetch item names based on ID.

            // Optimize: Get all stock item IDs and fetch details
            const itemIds = data.map((r: any) => r.stock_item_id);
            const { data: itemData } = await supabase.from('stock_items').select('id, name, unit').in('id', itemIds);
            const itemMap = new Map<string, { name: string, unit: string }>(itemData?.map((i: any) => [i.id, i]) || []);

            const mapped: StockTransferRequest[] = data.map((r: any) => ({
                id: r.id,
                fromOutletId: r.from_outlet_id,
                toOutletId: r.to_outlet_id,
                stockItemId: r.stock_item_id,
                requestedQuantity: r.requested_quantity,
                status: r.status,
                requestedBy: r.requested_by,
                notes: r.notes,
                createdAt: r.created_at,

                // UI fields
                stockItemName: itemMap.get(r.stock_item_id)?.name || 'Unknown Item',
                stockItemUnit: itemMap.get(r.stock_item_id)?.unit || 'unit',
                fromOutletName: r.from_outlet?.name,
                toOutletName: r.to_outlet?.name,
                requesterName: r.requester?.name
            }));

            setRequests(mapped);
        }
        setLoading(false);
    };

    const handleCreateRequest = async () => {
        if (!formData.stockItemId || formData.quantity <= 0 || !formData.toOutletId) {
            showToast('Sila isi semua maklumat', 'warning');
            return;
        }
        if (!myOutletId) return;

        setIsSubmitting(true);

        // We need to find the specific stock_item_id in the *Source* outlet corresponding to the name selected.
        // But `availableStockItems` is a mix.
        // Actually, if I request "Chicken" from "Warehouse", I need "Chicken" item ID in "Warehouse".
        // OR, does the system link them?
        // Design: "ingredient_id NOT NULL REFERENCES ingredients(id)"?
        // If it refs `ingredients` (central list), that's easy.
        // If it refs `stock_items` (per outlet), we need to find the target item ID.

        // Let's assume we request based on *Ingredient Name*, and backend resolves?
        // Or we look up: Find 'Chicken' in 'Warehouse'. Get that ID.

        // 1. Get selected item name
        const selectedItemName = availableStockItems.find(i => i.id === formData.stockItemId)?.name;
        if (!selectedItemName) return;

        // 2. Find matching item in Source Outlet (toOutletId in form means source)
        const { data: targetItem, error: findError } = await supabase
            .from('stock_items')
            .select('id')
            .eq('outlet_id', formData.toOutletId) // The outlet we are requesting FROM
            .eq('name', selectedItemName)
            .single();

        if (findError || !targetItem) {
            showToast('Item tidak dijumpai di outlet pilihan', 'error');
            setIsSubmitting(false);
            return;
        }

        // 3. Create Request
        // Note: `from_outlet_id` = Source of Stock = formData.toOutletId (Warehouse)
        // `to_outlet_id` = Destination (Me) = myOutletId
        // WAIT. In my `fetchRequests`:
        // "Outgoing" = I requested it. `to_outlet_id` = myOutletId.
        // So `from_outlet_id` is where it comes FROM.

        const { error } = await supabase.from('stock_transfer_requests').insert({
            from_outlet_id: formData.toOutletId, // Source
            to_outlet_id: myOutletId,   // Dest (Me)
            stock_item_id: targetItem.id, // The item record ID in the SOURCE outlet
            requested_quantity: formData.quantity,
            requested_by: user?.id || currentStaff?.id,
            status: 'pending',
            notes: formData.notes
        });

        if (error) {
            showToast('Gagal mencipta rekues: ' + error.message, 'error');
        } else {
            showToast('Rekues berjaya dihantar', 'success');
            setIsCreateModalOpen(false);
            fetchRequests();
            // Reset form
            setFormData(prev => ({ ...prev, quantity: 0, notes: '' }));
        }
        setIsSubmitting(false);
    };

    const handleApprove = async (request: StockTransferRequest) => {
        // Logic for approving (if I am the warehouse/source)
        // Update status to 'approved'
        setIsSubmitting(true);
        const { error } = await supabase
            .from('stock_transfer_requests')
            .update({
                status: 'approved',
                approved_by: user?.id || currentStaff?.id,
                approved_at: new Date().toISOString(),
                approved_quantity: request.requestedQuantity // Default to full approval
            })
            .eq('id', request.id);

        if (error) {
            showToast('Gagal approve: ' + error.message, 'error');
        } else {
            showToast('Rekues diluluskan', 'success');
            fetchRequests();
        }
        setIsSubmitting(false);
    };

    if (!myOutletId) {
        return (
            <div className="p-8 text-center text-gray-500">
                <Building size={48} className="mx-auto mb-4 opacity-50" />
                <p>Sila pilih outlet atau login sebagai staf untuk melihat transfer.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Controls */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('outgoing')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'outgoing' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        My Requests
                    </button>
                    <button
                        onClick={() => setActiveTab('incoming')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'incoming' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        To Fulfill ({requests.filter(r => r.status === 'pending' && activeTab === 'incoming').length})
                    </button>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn btn-primary"
                >
                    <Plus size={18} />
                    Request Stock
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-12"><LoadingSpinner /></div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <Truck size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Tiada rekues dijumpai</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map(req => (
                        <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                                    req.status === 'approved' ? 'bg-blue-100 text-blue-600' :
                                        req.status === 'fulfilled' ? 'bg-green-100 text-green-600' :
                                            'bg-red-100 text-red-600'
                                    }`}>
                                    {req.status === 'pending' ? <Clock size={20} /> :
                                        req.status === 'approved' ? <Check size={20} /> :
                                            req.status === 'fulfilled' ? <Truck size={20} /> : <X size={20} />}
                                </div>
                                <div>
                                    <div className="font-bold text-lg mb-1">{req.stockItemName}</div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="font-semibold text-gray-700">{req.requestedQuantity} {req.stockItemUnit}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            {activeTab === 'outgoing' ? req.fromOutletName : req.requesterName}
                                            <ArrowRight size={12} />
                                            {activeTab === 'outgoing' ? 'Me' : 'Me'}
                                        </span>
                                        <span>•</span>
                                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {req.notes && <div className="text-xs text-gray-400 mt-1 italic">&quot;{req.notes}&quot;</div>}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Actions for Incoming Requests (Pending) */}
                                {activeTab === 'incoming' && req.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleApprove(req)}
                                            disabled={isSubmitting}
                                            className="btn btn-sm btn-success"
                                        >
                                            Approve
                                        </button>
                                        <button className="btn btn-sm btn-outline text-red-500 border-red-200 hover:bg-red-50">
                                            Reject
                                        </button>
                                    </>
                                )}

                                {/* Status Badge */}
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    req.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                                        req.status === 'fulfilled' ? 'bg-green-100 text-green-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {req.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Request Stock Transfer"
            >
                <div className="space-y-4">
                    <div>
                        <label className="form-label">Source Outlet (Request From)</label>
                        <select
                            className="form-select w-full"
                            value={formData.toOutletId}
                            onChange={e => setFormData(prev => ({ ...prev, toOutletId: e.target.value }))}
                        >
                            <option value="">-- Pilih Outlet / Warehouse --</option>
                            {outlets.filter(o => o.id !== myOutletId).map(o => (
                                <option key={o.id} value={o.id}>
                                    {o.name} {o.is_warehouse ? '(Warehouse)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="form-label">Item to Request</label>
                        <select
                            className="form-select w-full"
                            value={formData.stockItemId}
                            onChange={e => setFormData(prev => ({ ...prev, stockItemId: e.target.value }))}
                        >
                            <option value="">-- Pilih Item --</option>
                            {availableStockItems.map(item => (
                                <option key={item.id} value={item.id}>
                                    {item.name} ({item.unit})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="form-label">Quantity</label>
                        <input
                            type="number"
                            className="form-input w-full"
                            min="0.1"
                            step="0.1"
                            value={formData.quantity}
                            onChange={e => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                        />
                    </div>

                    <div>
                        <label className="form-label">Notes</label>
                        <textarea
                            className="form-input w-full"
                            rows={2}
                            value={formData.notes}
                            onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Optional notes..."
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="btn btn-outline"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateRequest}
                            disabled={isSubmitting}
                            className="btn btn-primary"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Request'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
