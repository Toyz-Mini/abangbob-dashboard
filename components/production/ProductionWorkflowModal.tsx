'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';
import { useToast } from '@/lib/contexts/ToastContext';
import {
    Package,
    ChefHat,
    ArrowRight,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Minus,
    Plus,
    Info
} from 'lucide-react';
import { Recipe, RecipeIngredient } from '@/lib/types';
import {
    getProductionRecipesAction,
    calculateProductionCapacityAction,
    executeProductionAction
} from '@/lib/actions/production-actions';
import { useAuth } from '@/lib/contexts/AuthContext';

interface ProductionWorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProductionComplete?: () => void;
}

type Step = 'select' | 'quantity' | 'preview' | 'result';

interface IngredientStatus {
    stockItemId: string;
    stockItemName: string;
    requiredPerBatch: number;
    currentStock: number;
    unit: string;
    maxBatches: number;
    isLimiting: boolean;
}

interface ProductionResult {
    success: boolean;
    outputQuantity: number;
    totalCost: number;
    ingredientsDeducted: Array<{
        stockItemName: string;
        quantity: number;
        unit: string;
    }>;
}

export default function ProductionWorkflowModal({
    isOpen,
    onClose,
    onProductionComplete
}: ProductionWorkflowModalProps) {
    const { showToast } = useToast();
    const { currentStaff } = useAuth();

    // State
    const [step, setStep] = useState<Step>('select');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [batchQuantity, setBatchQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Capacity calculation
    const [maxBatches, setMaxBatches] = useState(0);
    const [limitingIngredient, setLimitingIngredient] = useState<string | null>(null);
    const [ingredientStatus, setIngredientStatus] = useState<IngredientStatus[]>([]);

    // Result
    const [productionResult, setProductionResult] = useState<ProductionResult | null>(null);

    // Load recipes on open
    useEffect(() => {
        if (isOpen) {
            loadRecipes();
        }
    }, [isOpen]);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setStep('select');
            setSelectedRecipe(null);
            setBatchQuantity(1);
            setNotes('');
            setProductionResult(null);
            setIngredientStatus([]);
        }
    }, [isOpen]);

    const loadRecipes = async () => {
        setIsLoading(true);
        try {
            const data = await getProductionRecipesAction();
            setRecipes(data);
        } catch (error) {
            console.error('Error loading recipes:', error);
            showToast('Gagal memuatkan recipe', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectRecipe = async (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setIsLoading(true);

        try {
            const capacity = await calculateProductionCapacityAction(recipe.id);
            setMaxBatches(capacity.maxBatches);
            setLimitingIngredient(capacity.limitingIngredient);
            setIngredientStatus(capacity.ingredientStatus);
            setBatchQuantity(Math.min(1, capacity.maxBatches));
            setStep('quantity');
        } catch (error) {
            console.error('Error calculating capacity:', error);
            showToast('Gagal mengira kapasiti', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuantityConfirm = () => {
        if (batchQuantity <= 0) {
            showToast('Sila masukkan kuantiti yang sah', 'warning');
            return;
        }
        setStep('preview');
    };

    const handleExecuteProduction = async () => {
        if (!selectedRecipe) return;

        setIsProcessing(true);
        try {
            const result = await executeProductionAction({
                recipeId: selectedRecipe.id,
                batchQuantity,
                notes: notes || undefined,
                staffId: currentStaff?.id,
                staffName: currentStaff?.name
            });

            setProductionResult({
                success: result.success,
                outputQuantity: result.outputQuantity,
                totalCost: result.totalCost,
                ingredientsDeducted: result.ingredientsDeducted.map(i => ({
                    stockItemName: i.stockItemName,
                    quantity: i.quantity,
                    unit: i.unit
                }))
            });

            setStep('result');
            showToast('Production berjaya!', 'success');
            onProductionComplete?.();

        } catch (error) {
            console.error('Error executing production:', error);
            showToast('Gagal menjalankan production', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStockStatusColor = (current: number, required: number) => {
        if (current < required) return 'var(--danger)';
        if (current < required * 2) return 'var(--warning)';
        return 'var(--success)';
    };

    const getStockStatusIcon = (current: number, required: number) => {
        if (current < required) return <XCircle size={16} style={{ color: 'var(--danger)' }} />;
        if (current < required * 2) return <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />;
        return <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />;
    };

    // Calculate total for preview
    const totalRequired = ingredientStatus.map(ing => ({
        ...ing,
        totalRequired: ing.requiredPerBatch * batchQuantity
    }));

    const outputQuantity = selectedRecipe
        ? (selectedRecipe.outputQuantity || selectedRecipe.yieldQuantity || 1) * batchQuantity
        : 0;

    const estimatedCost = selectedRecipe
        ? (selectedRecipe.totalCost || 0) * batchQuantity
        : 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => !isProcessing && onClose()}
            title={step === 'result' ? 'Production Selesai!' : 'Production Baru'}
            subtitle={
                step === 'select' ? 'Pilih recipe untuk production' :
                    step === 'quantity' ? 'Tetapkan kuantiti batch' :
                        step === 'preview' ? 'Semak sebelum confirm' :
                            'Hasil production'
            }
            maxWidth="550px"
        >
            {/* Step Indicator */}
            {step !== 'result' && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    marginBottom: '1.5rem',
                    padding: '0.75rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-lg)'
                }}>
                    {['select', 'quantity', 'preview'].map((s, i) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                background: step === s
                                    ? 'var(--primary)'
                                    : ['select', 'quantity', 'preview'].indexOf(step) > i
                                        ? 'var(--success)'
                                        : 'var(--bg-tertiary)',
                                color: step === s || ['select', 'quantity', 'preview'].indexOf(step) > i
                                    ? 'white'
                                    : 'var(--text-secondary)',
                                transition: 'all 0.3s ease'
                            }}>
                                {['select', 'quantity', 'preview'].indexOf(step) > i ? '✓' : i + 1}
                            </div>
                            {i < 2 && (
                                <ArrowRight size={14} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Step 1: Select Recipe */}
            {step === 'select' && (
                <div>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <LoadingSpinner />
                            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Memuatkan recipe...</p>
                        </div>
                    ) : recipes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                            <ChefHat size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <p>Tiada production recipe dijumpai.</p>
                            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                Sila buat recipe dengan jenis "Production" dahulu.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {recipes.map(recipe => (
                                <button
                                    key={recipe.id}
                                    onClick={() => handleSelectRecipe(recipe)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-light)',
                                        borderRadius: 'var(--radius-lg)',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseOver={e => {
                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                        e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.05)';
                                    }}
                                    onMouseOut={e => {
                                        e.currentTarget.style.borderColor = 'var(--border-light)';
                                        e.currentTarget.style.background = 'var(--bg-secondary)';
                                    }}
                                >
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white'
                                    }}>
                                        <Package size={24} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '1rem' }}>{recipe.menuItemName}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {recipe.ingredients?.length || 0} bahan •
                                            Output: {recipe.outputQuantity || recipe.yieldQuantity} {recipe.outputUnit || recipe.yieldUnit}
                                        </div>
                                    </div>
                                    <ArrowRight size={18} style={{ color: 'var(--text-secondary)' }} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Step 2: Quantity */}
            {step === 'quantity' && selectedRecipe && (
                <div>
                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                            <LoadingSpinner />
                            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Mengira kapasiti...</p>
                        </div>
                    ) : (
                        <>
                            {/* Recipe Info */}
                            <div style={{
                                padding: '1rem',
                                background: 'var(--bg-secondary)',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{selectedRecipe.menuItemName}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    1 batch = {selectedRecipe.outputQuantity || selectedRecipe.yieldQuantity} {selectedRecipe.outputUnit || selectedRecipe.yieldUnit}
                                </div>
                            </div>

                            {/* Capacity Info */}
                            {maxBatches > 0 ? (
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}>
                                    <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                                    <div>
                                        <div style={{ fontWeight: 500, color: 'var(--success)' }}>
                                            Boleh buat sehingga {maxBatches} batch
                                        </div>
                                        {limitingIngredient && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                Dihadkan oleh: {limitingIngredient}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{
                                    padding: '0.75rem 1rem',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem'
                                }}>
                                    <XCircle size={20} style={{ color: 'var(--danger)' }} />
                                    <div>
                                        <div style={{ fontWeight: 500, color: 'var(--danger)' }}>
                                            Stok tidak mencukupi
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            Sila restock bahan-bahan dahulu
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Quantity Input */}
                            <div className="form-group">
                                <label className="form-label">Kuantiti Batch</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <button
                                        className="btn btn-icon"
                                        onClick={() => setBatchQuantity(Math.max(1, batchQuantity - 1))}
                                        disabled={batchQuantity <= 1}
                                        style={{ width: '44px', height: '44px' }}
                                    >
                                        <Minus size={20} />
                                    </button>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={batchQuantity}
                                        onChange={(e) => setBatchQuantity(Math.max(1, Math.min(maxBatches, Number(e.target.value))))}
                                        min={1}
                                        max={maxBatches}
                                        style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 600, width: '100px' }}
                                    />
                                    <button
                                        className="btn btn-icon"
                                        onClick={() => setBatchQuantity(Math.min(maxBatches, batchQuantity + 1))}
                                        disabled={batchQuantity >= maxBatches}
                                        style={{ width: '44px', height: '44px' }}
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Quick select */}
                            {maxBatches > 1 && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                    {[1, 5, 10, maxBatches].filter((v, i, arr) => v <= maxBatches && arr.indexOf(v) === i).map(num => (
                                        <button
                                            key={num}
                                            className="btn btn-sm btn-outline"
                                            onClick={() => setBatchQuantity(num)}
                                            style={{
                                                borderColor: batchQuantity === num ? 'var(--primary)' : 'var(--border-light)',
                                                background: batchQuantity === num ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent'
                                            }}
                                        >
                                            {num === maxBatches ? `Max (${num})` : num}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Output Preview */}
                            <div style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                background: 'linear-gradient(135deg, rgba(var(--primary-rgb), 0.1), rgba(var(--secondary-rgb), 0.1))',
                                borderRadius: 'var(--radius-lg)',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                    Output
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                                    {outputQuantity} {selectedRecipe.outputUnit || selectedRecipe.yieldUnit}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    {selectedRecipe.menuItemName}
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="form-group" style={{ marginTop: '1.5rem' }}>
                                <label className="form-label">Catatan (Optional)</label>
                                <textarea
                                    className="form-input"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Contoh: Batch pagi, untuk stok Sabtu"
                                    rows={2}
                                    style={{ resize: 'vertical' }}
                                />
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                <button className="btn btn-ghost" onClick={() => setStep('select')}>
                                    ← Kembali
                                </button>
                                <PremiumButton
                                    onClick={handleQuantityConfirm}
                                    disabled={batchQuantity <= 0 || batchQuantity > maxBatches}
                                >
                                    Seterusnya →
                                </PremiumButton>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Step 3: Preview */}
            {step === 'preview' && selectedRecipe && (
                <div>
                    {/* Summary */}
                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Recipe</span>
                            <span style={{ fontWeight: 600 }}>{selectedRecipe.menuItemName}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Batch</span>
                            <span style={{ fontWeight: 600 }}>{batchQuantity}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Output</span>
                            <span style={{ fontWeight: 600, color: 'var(--success)' }}>
                                +{outputQuantity} {selectedRecipe.outputUnit || selectedRecipe.yieldUnit}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Anggaran Kos</span>
                            <span style={{ fontWeight: 600 }}>RM {estimatedCost.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Ingredients to be deducted */}
                    <div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '1rem',
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem'
                        }}>
                            <Info size={16} />
                            <span>Bahan yang akan ditolak:</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {totalRequired.map(ing => {
                                const hasEnough = ing.currentStock >= ing.totalRequired;
                                return (
                                    <div
                                        key={ing.stockItemId}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem 1rem',
                                            background: hasEnough ? 'var(--bg-secondary)' : 'rgba(239, 68, 68, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            borderLeft: `3px solid ${hasEnough ? 'var(--success)' : 'var(--danger)'}`
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {getStockStatusIcon(ing.currentStock, ing.totalRequired)}
                                            <span>{ing.stockItemName}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                fontWeight: 600,
                                                color: hasEnough ? 'var(--danger)' : 'var(--danger)'
                                            }}>
                                                -{ing.totalRequired} {ing.unit}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                Stok: {ing.currentStock} {ing.unit}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Warning if any ingredient is insufficient */}
                    {totalRequired.some(ing => ing.currentStock < ing.totalRequired) && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem'
                        }}>
                            <AlertTriangle size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
                            <div style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>
                                <strong>Amaran:</strong> Sebahagian bahan tidak mencukupi.
                                Production masih boleh diteruskan tetapi stok akan menjadi negatif.
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                        <button className="btn btn-ghost" onClick={() => setStep('quantity')} disabled={isProcessing}>
                            ← Kembali
                        </button>
                        <PremiumButton
                            onClick={handleExecuteProduction}
                            disabled={isProcessing}
                            style={{ minWidth: '150px' }}
                        >
                            {isProcessing ? (
                                <>
                                    <LoadingSpinner size="sm" />
                                    Memproses...
                                </>
                            ) : (
                                '✓ Confirm Production'
                            )}
                        </PremiumButton>
                    </div>
                </div>
            )}

            {/* Step 4: Result */}
            {step === 'result' && productionResult && (
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--success), #059669)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem'
                    }}>
                        <CheckCircle2 size={40} color="white" />
                    </div>

                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Production Berjaya!
                    </h3>

                    <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
                        borderRadius: 'var(--radius-lg)',
                        margin: '1.5rem 0'
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success)' }}>
                            +{productionResult.outputQuantity}
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                            {selectedRecipe?.outputUnit || selectedRecipe?.yieldUnit} {selectedRecipe?.menuItemName}
                        </div>
                    </div>

                    <div style={{
                        padding: '1rem',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-lg)',
                        marginBottom: '1.5rem',
                        textAlign: 'left'
                    }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                            Bahan yang telah ditolak:
                        </div>
                        {productionResult.ingredientsDeducted.map((ing, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '0.5rem 0',
                                borderBottom: i < productionResult.ingredientsDeducted.length - 1 ? '1px solid var(--border-light)' : 'none'
                            }}>
                                <span>{ing.stockItemName}</span>
                                <span style={{ color: 'var(--danger)', fontWeight: 500 }}>
                                    -{ing.quantity} {ing.unit}
                                </span>
                            </div>
                        ))}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '0.75rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px solid var(--border-light)',
                            fontWeight: 600
                        }}>
                            <span>Jumlah Kos</span>
                            <span>RM {productionResult.totalCost.toFixed(2)}</span>
                        </div>
                    </div>

                    <PremiumButton onClick={onClose} style={{ width: '100%' }}>
                        Selesai
                    </PremiumButton>
                </div>
            )}
        </Modal>
    );
}
