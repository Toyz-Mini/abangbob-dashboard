import React, { memo } from 'react';
import { CashPayout } from '@/lib/types'; // Need to ensure type defines createdAt/amount etc
import { useTranslation } from '@/lib/contexts/LanguageContext';

// Define the type explicitly if needed, assuming CashPayout matches usage
// Based on FinancePage usage: id, createdAt, amount, reason, performedByName, approvedByName, category
interface Props {
    payouts: CashPayout[];
    loading: boolean;
}

const MoneyOutTable = memo(({ payouts, loading }: Props) => {
    const { t } = useTranslation();

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                {/* Simple spinner or use LoadingSpinner component if imported */}
                <p>Loading...</p>
            </div>
        );
    }

    if (payouts.length === 0) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p>{t('finance.moneyOut.empty')}</p>
            </div>
        );
    }

    const totalAmount = payouts.reduce((sum, r) => sum + r.amount, 0);

    return (
        <>
            <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ minWidth: '700px' }}>
                    <thead>
                        <tr>
                            <th>{t('finance.moneyOut.table.dateTime')}</th>
                            <th>{t('finance.moneyOut.table.amount')}</th>
                            <th>{t('finance.moneyOut.table.category')}</th>
                            <th>{t('finance.moneyOut.table.reason')}</th>
                            <th>{t('finance.moneyOut.table.issuedBy')}</th>
                            <th>{t('finance.moneyOut.table.approvedBy')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payouts.map(record => (
                            <tr key={record.id}>
                                <td>{new Date(record.createdAt).toLocaleString('ms-MY')}</td>
                                <td style={{ fontWeight: 700, color: 'var(--danger)' }}>BND {record.amount.toFixed(2)}</td>
                                <td>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '999px',
                                        fontSize: '0.75rem',
                                        background: '#fee2e2',
                                        color: '#991b1b',
                                        fontWeight: 600
                                    }}>
                                        {t(`finance.expenseCategories.${record.category}`) !== `finance.expenseCategories.${record.category}` ? t(`finance.expenseCategories.${record.category}`) : record.category}
                                    </span>
                                </td>
                                <td>{record.reason}</td>
                                <td>{record.performedByName || '-'}</td>
                                <td>{record.approvedByName || '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ padding: '1rem', borderTop: '1px solid var(--gray-200)', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{t('finance.moneyOut.total')}</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>
                    BND {totalAmount.toFixed(2)}
                </span>
            </div>
        </>
    );
});

MoneyOutTable.displayName = 'MoneyOutTable';

export default MoneyOutTable;
