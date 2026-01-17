import React, { memo } from 'react';
import { Expense } from '@/lib/types';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, getCategoryColor } from '@/lib/finance-data';
import { Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from '@/lib/contexts/LanguageContext';

interface ExpensesTableProps {
    expenses: Expense[];
    onEdit: (expense: Expense) => void;
    onDelete: (expense: Expense) => void;
    totalAmount: number;
}

const ExpensesTable = memo(({ expenses, onEdit, onDelete, totalAmount }: ExpensesTableProps) => {
    const { t } = useTranslation();

    if (expenses.length === 0) {
        return (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                {t('finance.expenses.empty')}
            </p>
        );
    }

    return (
        <>
            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                <table className="table" style={{ minWidth: '600px' }}>
                    <thead>
                        <tr>
                            <th>{t('finance.expenses.table.date')}</th>
                            <th>{t('finance.expenses.table.category')}</th>
                            <th>{t('finance.expenses.table.description')}</th>
                            <th>{t('finance.expenses.table.amount')}</th>
                            <th>{t('finance.expenses.table.payment')}</th>
                            <th>{t('finance.expenses.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(expense => (
                            <tr key={expense.id}>
                                <td style={{ fontSize: '0.875rem' }}>
                                    {new Date(expense.date).toLocaleDateString('ms-MY')}
                                </td>
                                <td>
                                    <span
                                        style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: 'var(--radius-sm)',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            background: `${getCategoryColor(expense.category)}20`,
                                            color: getCategoryColor(expense.category),
                                        }}
                                    >
                                        {t(`finance.expenseCategories.${expense.category}`)}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 600 }}>{expense.description}</div>
                                    {expense.vendor && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {expense.vendor}
                                        </div>
                                    )}
                                </td>
                                <td style={{ fontWeight: 700, color: 'var(--danger)' }}>
                                    BND {expense.amount.toFixed(2)}
                                </td>
                                <td style={{ fontSize: '0.875rem', textTransform: 'capitalize' }}>
                                    {PAYMENT_METHODS.find(p => p.value === expense.paymentMethod)?.label}
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => onEdit(expense)}
                                            style={{ padding: '0.25rem 0.5rem' }}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline"
                                            onClick={() => onDelete(expense)}
                                            style={{ padding: '0.25rem 0.5rem', color: 'var(--danger)' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '2px solid var(--gray-200)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontWeight: 600 }}>{t('finance.expenses.total')}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>
                    BND {totalAmount.toFixed(2)}
                </span>
            </div>
        </>
    );
});

ExpensesTable.displayName = 'ExpensesTable';

export default ExpensesTable;
