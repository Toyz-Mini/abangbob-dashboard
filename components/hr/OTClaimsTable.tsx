import React, { memo } from 'react';

// Define a minimal interface for the claim object if not importing the full type
// Assuming usage based on page.tsx
interface OTClaim {
    id: string;
    date: string;
    staffName: string;
    startTime: string;
    endTime: string;
    hoursWorked: number;
    hourlyRate: number;
    multiplier: number;
    totalAmount: number;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    reason?: string;
}

interface OTClaimsTableProps {
    claims: OTClaim[];
    monthName: string;
    year: number;
}

const OTClaimsTable = memo(({ claims, monthName, year }: OTClaimsTableProps) => {
    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Rekod Tuntutan Terperinci ({monthName} {year})</h3>
            </div>
            {claims.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    <p>Tiada rekod tuntutan untuk bulan ini</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Tarikh</th>
                                <th>Staf</th>
                                <th>Masa</th>
                                <th>Pengiraan</th>
                                <th>Jumlah (BND)</th>
                                <th>Sebab</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {claims.map(claim => (
                                <tr key={claim.id}>
                                    <td>{new Date(claim.date).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 600 }}>{claim.staffName}</td>
                                    <td style={{ fontSize: '0.875rem' }}>{claim.startTime} - {claim.endTime}</td>
                                    <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {claim.hoursWorked.toFixed(1)}j x ${claim.hourlyRate.toFixed(2)} ({claim.multiplier}x)
                                    </td>
                                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                        ${claim.totalAmount.toFixed(2)}
                                    </td>
                                    <td style={{ maxWidth: '200px', fontSize: '0.875rem' }} className="truncate">
                                        {claim.reason || '-'}
                                    </td>
                                    <td>
                                        <span className={`badge badge-${claim.status === 'pending' ? 'warning' :
                                            claim.status === 'approved' ? 'info' :
                                                claim.status === 'paid' ? 'success' : 'danger'
                                            }`}>
                                            {claim.status.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
});

OTClaimsTable.displayName = 'OTClaimsTable';

export default OTClaimsTable;
