import { LeaveType, ClaimType, RequestCategory } from '../types';

// Base URL for approval actions
const getBaseUrl = () => process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'https://www.abangbob.store';

// Common email wrapper with AbangBob branding
function emailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with AbangBob branding -->
        <tr>
          <td style="padding: 30px 30px 20px; text-align: center; background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%);">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">ABANGBOB</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 2px;">Dashboard</p>
          </td>
        </tr>
        
        <!-- Content -->
        ${content}
        
        <!-- Footer -->
        <tr>
          <td style="padding: 25px 30px; background-color: #f9fafb; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
              Email ini dijana secara automatik. Sila jangan balas email ini.
            </p>
            <p style="color: #999; font-size: 12px; margin: 10px 0 0; text-align: center;">
              © ${new Date().getFullYear()} AbangBob. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Take Action Button Component
function actionButton(url: string, text: string = 'Take Action'): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin: 25px auto;">
      <tr>
        <td style="background: linear-gradient(135deg, #CC1512 0%, #8B0000 100%); border-radius: 8px; box-shadow: 0 4px 15px rgba(204, 21, 18, 0.3);">
          <a href="${url}" style="display: inline-block; padding: 14px 40px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// Info Row Component
function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 8px 0; color: #666; font-size: 14px; border-bottom: 1px solid #f0f0f0;">
        <strong style="color: #333;">${label}:</strong>
        <span style="float: right; color: #666;">${value}</span>
      </td>
    </tr>
  `;
}

// Leave type labels in Malay
const leaveTypeLabels: Record<LeaveType, string> = {
  annual: 'Cuti Tahunan',
  medical: 'Cuti Sakit',
  emergency: 'Cuti Kecemasan',
  unpaid: 'Cuti Tanpa Gaji',
  maternity: 'Cuti Bersalin',
  paternity: 'Cuti Paterniti',
  compassionate: 'Cuti Ihsan',
  replacement: 'Cuti Gantian',
  study: 'Cuti Belajar',
};

// Claim type labels in Malay
const claimTypeLabels: Record<ClaimType, string> = {
  medical: 'Perubatan',
  transport: 'Pengangkutan',
  meal: 'Makan',
  training: 'Latihan',
  phone: 'Telefon',
  uniform: 'Uniform',
  equipment: 'Peralatan',
  mileage: 'Mileage',
  other: 'Lain-lain',
};

// Request category labels in Malay
const requestCategoryLabels: Record<RequestCategory, string> = {
  shift_swap: 'Tukar Shift',
  off_day: 'Hari Cuti',
  ot_request: 'Permintaan OT',
  schedule_change: 'Tukar Jadual',
  salary_advance: 'Pendahuluan Gaji',
  payslip: 'Slip Gaji',
  letter: 'Surat',
  training: 'Latihan',
  equipment: 'Peralatan',
  complaint: 'Aduan',
  resignation: 'Perletakan Jawatan',
  bank_change: 'Tukar Bank',
  other: 'Lain-lain',
};

// ==================== LEAVE REQUEST EMAIL ====================
export interface LeaveApprovalEmailParams {
  approverName: string;
  staffName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  duration: number;
  reason: string;
  isHalfDay?: boolean;
}

export function getLeaveApprovalEmailTemplate(params: LeaveApprovalEmailParams): string {
  const { approverName, staffName, leaveType, startDate, endDate, duration, reason, isHalfDay } = params;
  const approvalUrl = `${getBaseUrl()}/hr/approvals?tab=leave`;

  const content = `
    <tr>
      <td style="padding: 35px 30px;">
        <!-- Alert Badge -->
        <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 8px; padding: 12px 16px; margin-bottom: 25px; border-left: 4px solid #F59E0B;">
          <p style="margin: 0; color: #92400E; font-weight: 600; font-size: 14px;">
            ⏳ Permohonan Cuti Baru Memerlukan Kelulusan
          </p>
        </div>
        
        <p style="color: #333; line-height: 1.6; margin: 0 0 20px; font-size: 15px;">
          Assalamualaikum <strong>${approverName}</strong>,
        </p>
        
        <p style="color: #666; line-height: 1.7; margin: 0 0 25px; font-size: 15px;">
          <strong style="color: #CC1512;">${staffName}</strong> telah memohon cuti dan memerlukan kelulusan anda.
        </p>
        
        <!-- Details Card -->
        <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 15px; color: #1a1a1a; font-size: 16px; border-bottom: 2px solid #CC1512; padding-bottom: 10px;">
            📋 Butiran Permohonan
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${infoRow('Jenis Cuti', leaveTypeLabels[leaveType] || leaveType)}
            ${infoRow('Tarikh Mula', startDate)}
            ${infoRow('Tarikh Tamat', endDate)}
            ${infoRow('Tempoh', `${duration} hari${isHalfDay ? ' (Separuh Hari)' : ''}`)}
            ${infoRow('Sebab', reason || '-')}
          </table>
        </div>
        
        <p style="color: #666; font-size: 14px; margin: 0 0 10px; text-align: center;">
          Sila klik butang di bawah untuk meluluskan atau menolak permohonan ini.
        </p>
        
        ${actionButton(approvalUrl, 'Semak & Luluskan')}
      </td>
    </tr>
  `;

  return emailWrapper(content);
}

// ==================== OT CLAIM EMAIL ====================
export interface OTClaimApprovalEmailParams {
  approverName: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  totalAmount: number;
  reason: string;
}

export function getOTClaimApprovalEmailTemplate(params: OTClaimApprovalEmailParams): string {
  const { approverName, staffName, date, startTime, endTime, hoursWorked, totalAmount, reason } = params;
  const approvalUrl = `${getBaseUrl()}/hr/approvals?tab=ot`;

  const content = `
    <tr>
      <td style="padding: 35px 30px;">
        <!-- Alert Badge -->
        <div style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); border-radius: 8px; padding: 12px 16px; margin-bottom: 25px; border-left: 4px solid #3B82F6;">
          <p style="margin: 0; color: #1E40AF; font-weight: 600; font-size: 14px;">
            ⏰ Tuntutan OT Baru Memerlukan Kelulusan
          </p>
        </div>
        
        <p style="color: #333; line-height: 1.6; margin: 0 0 20px; font-size: 15px;">
          Assalamualaikum <strong>${approverName}</strong>,
        </p>
        
        <p style="color: #666; line-height: 1.7; margin: 0 0 25px; font-size: 15px;">
          <strong style="color: #CC1512;">${staffName}</strong> telah menghantar tuntutan kerja lebih masa (OT).
        </p>
        
        <!-- Details Card -->
        <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 15px; color: #1a1a1a; font-size: 16px; border-bottom: 2px solid #CC1512; padding-bottom: 10px;">
            📋 Butiran Tuntutan OT
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${infoRow('Tarikh', date)}
            ${infoRow('Masa', `${startTime} - ${endTime}`)}
            ${infoRow('Jam Bekerja', `${hoursWorked} jam`)}
            ${infoRow('Jumlah Tuntutan', `BND ${totalAmount.toFixed(2)}`)}
            ${infoRow('Sebab OT', reason || '-')}
          </table>
        </div>
        
        ${actionButton(approvalUrl, 'Semak & Luluskan')}
      </td>
    </tr>
  `;

  return emailWrapper(content);
}

// ==================== EXPENSE CLAIM EMAIL ====================
export interface ClaimApprovalEmailParams {
  approverName: string;
  staffName: string;
  claimType: ClaimType;
  amount: number;
  description: string;
  claimDate: string;
}

export function getClaimApprovalEmailTemplate(params: ClaimApprovalEmailParams): string {
  const { approverName, staffName, claimType, amount, description, claimDate } = params;
  const approvalUrl = `${getBaseUrl()}/hr/approvals?tab=claims`;

  const content = `
    <tr>
      <td style="padding: 35px 30px;">
        <!-- Alert Badge -->
        <div style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border-radius: 8px; padding: 12px 16px; margin-bottom: 25px; border-left: 4px solid #10B981;">
          <p style="margin: 0; color: #065F46; font-weight: 600; font-size: 14px;">
            💰 Tuntutan Perbelanjaan Baru Memerlukan Kelulusan
          </p>
        </div>
        
        <p style="color: #333; line-height: 1.6; margin: 0 0 20px; font-size: 15px;">
          Assalamualaikum <strong>${approverName}</strong>,
        </p>
        
        <p style="color: #666; line-height: 1.7; margin: 0 0 25px; font-size: 15px;">
          <strong style="color: #CC1512;">${staffName}</strong> telah menghantar tuntutan perbelanjaan.
        </p>
        
        <!-- Details Card -->
        <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 15px; color: #1a1a1a; font-size: 16px; border-bottom: 2px solid #CC1512; padding-bottom: 10px;">
            📋 Butiran Tuntutan
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${infoRow('Jenis Tuntutan', claimTypeLabels[claimType] || claimType)}
            ${infoRow('Jumlah', `BND ${amount.toFixed(2)}`)}
            ${infoRow('Tarikh', claimDate)}
            ${infoRow('Keterangan', description || '-')}
          </table>
        </div>
        
        ${actionButton(approvalUrl, 'Semak & Luluskan')}
      </td>
    </tr>
  `;

  return emailWrapper(content);
}

// ==================== SALARY ADVANCE EMAIL ====================
export interface SalaryAdvanceApprovalEmailParams {
  approverName: string;
  staffName: string;
  amount: number;
  reason: string;
}

export function getSalaryAdvanceApprovalEmailTemplate(params: SalaryAdvanceApprovalEmailParams): string {
  const { approverName, staffName, amount, reason } = params;
  const approvalUrl = `${getBaseUrl()}/hr/approvals?tab=advance`;

  const content = `
    <tr>
      <td style="padding: 35px 30px;">
        <!-- Alert Badge -->
        <div style="background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%); border-radius: 8px; padding: 12px 16px; margin-bottom: 25px; border-left: 4px solid #8B5CF6;">
          <p style="margin: 0; color: #5B21B6; font-weight: 600; font-size: 14px;">
            💵 Permohonan Pendahuluan Gaji Memerlukan Kelulusan
          </p>
        </div>
        
        <p style="color: #333; line-height: 1.6; margin: 0 0 20px; font-size: 15px;">
          Assalamualaikum <strong>${approverName}</strong>,
        </p>
        
        <p style="color: #666; line-height: 1.7; margin: 0 0 25px; font-size: 15px;">
          <strong style="color: #CC1512;">${staffName}</strong> telah memohon pendahuluan gaji.
        </p>
        
        <!-- Details Card -->
        <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 15px; color: #1a1a1a; font-size: 16px; border-bottom: 2px solid #CC1512; padding-bottom: 10px;">
            📋 Butiran Permohonan
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${infoRow('Jumlah Dimohon', `BND ${amount.toFixed(2)}`)}
            ${infoRow('Sebab', reason || '-')}
          </table>
        </div>
        
        <p style="color: #888; font-size: 13px; margin: 0 0 20px; text-align: center; font-style: italic;">
          ⚠️ Pendahuluan ini akan ditolak daripada gaji bulan hadapan.
        </p>
        
        ${actionButton(approvalUrl, 'Semak & Luluskan')}
      </td>
    </tr>
  `;

  return emailWrapper(content);
}

// ==================== STAFF REQUEST (SHIFT SWAP, ETC) EMAIL ====================
export interface StaffRequestApprovalEmailParams {
  approverName: string;
  staffName: string;
  category: RequestCategory;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export function getStaffRequestApprovalEmailTemplate(params: StaffRequestApprovalEmailParams): string {
  const { approverName, staffName, category, title, description, priority } = params;
  const approvalUrl = `${getBaseUrl()}/hr/approvals?tab=requests`;

  const priorityColors = {
    low: { bg: '#D1FAE5', border: '#10B981', text: '#065F46', label: 'Rendah' },
    medium: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', label: 'Sederhana' },
    high: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B', label: 'Tinggi' },
  };

  const p = priorityColors[priority];

  const content = `
    <tr>
      <td style="padding: 35px 30px;">
        <!-- Alert Badge -->
        <div style="background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); border-radius: 8px; padding: 12px 16px; margin-bottom: 25px; border-left: 4px solid #EF4444;">
          <p style="margin: 0; color: #991B1B; font-weight: 600; font-size: 14px;">
            📝 Permintaan Staff Baru Memerlukan Tindakan
          </p>
        </div>
        
        <p style="color: #333; line-height: 1.6; margin: 0 0 20px; font-size: 15px;">
          Assalamualaikum <strong>${approverName}</strong>,
        </p>
        
        <p style="color: #666; line-height: 1.7; margin: 0 0 25px; font-size: 15px;">
          <strong style="color: #CC1512;">${staffName}</strong> telah menghantar permintaan baru.
        </p>
        
        <!-- Details Card -->
        <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 15px; color: #1a1a1a; font-size: 16px; border-bottom: 2px solid #CC1512; padding-bottom: 10px;">
            📋 Butiran Permintaan
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${infoRow('Kategori', requestCategoryLabels[category] || category)}
            ${infoRow('Tajuk', title)}
            ${infoRow('Keterangan', description || '-')}
            <tr>
              <td style="padding: 8px 0; color: #666; font-size: 14px;">
                <strong style="color: #333;">Keutamaan:</strong>
                <span style="float: right; background: ${p.bg}; color: ${p.text}; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                  ${p.label}
                </span>
              </td>
            </tr>
          </table>
        </div>
        
        ${actionButton(approvalUrl, 'Semak & Ambil Tindakan')}
      </td>
    </tr>
  `;

  return emailWrapper(content);
}

// ==================== STAFF RESULT NOTIFICATION TEMPLATES ====================
// These are sent to staff when their requests are approved or rejected

export type RequestType = 'leave' | 'ot_claim' | 'claim' | 'salary_advance' | 'staff_request';

export interface StaffResultNotificationParams {
  staffName: string;
  requestType: RequestType;
  isApproved: boolean;
  approverName: string;
  rejectionReason?: string;
  details: string; // Brief description of the request
}

const requestTypeLabels: Record<RequestType, string> = {
  leave: 'Permohonan Cuti',
  ot_claim: 'Tuntutan OT',
  claim: 'Tuntutan Perbelanjaan',
  salary_advance: 'Permohonan Pendahuluan Gaji',
  staff_request: 'Permintaan Anda',
};

export function getStaffResultEmailTemplate(params: StaffResultNotificationParams): string {
  const { staffName, requestType, isApproved, approverName, rejectionReason, details } = params;
  const portalUrl = `${getBaseUrl()}/staff-portal`;

  const statusConfig = isApproved
    ? {
      icon: '✅',
      badge: { bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', border: '#10B981', text: '#065F46' },
      title: 'DILULUSKAN',
      message: 'Tahniah! Permohonan anda telah diluluskan.',
    }
    : {
      icon: '❌',
      badge: { bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', border: '#EF4444', text: '#991B1B' },
      title: 'DITOLAK',
      message: 'Maaf, permohonan anda telah ditolak.',
    };

  const content = `
    <tr>
      <td style="padding: 35px 30px;">
        <!-- Status Badge -->
        <div style="background: ${statusConfig.badge.bg}; border-radius: 8px; padding: 12px 16px; margin-bottom: 25px; border-left: 4px solid ${statusConfig.badge.border};">
          <p style="margin: 0; color: ${statusConfig.badge.text}; font-weight: 600; font-size: 14px;">
            ${statusConfig.icon} ${requestTypeLabels[requestType]} - ${statusConfig.title}
          </p>
        </div>
        
        <p style="color: #333; line-height: 1.6; margin: 0 0 20px; font-size: 15px;">
          Assalamualaikum <strong>${staffName}</strong>,
        </p>
        
        <p style="color: #666; line-height: 1.7; margin: 0 0 25px; font-size: 15px;">
          ${statusConfig.message}
        </p>
        
        <!-- Details Card -->
        <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 15px; color: #1a1a1a; font-size: 16px; border-bottom: 2px solid #CC1512; padding-bottom: 10px;">
            📋 Butiran
          </h3>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${infoRow('Jenis', requestTypeLabels[requestType])}
            ${infoRow('Butiran', details)}
            ${infoRow('Diproses oleh', approverName)}
            ${infoRow('Status', isApproved ? '✅ Diluluskan' : '❌ Ditolak')}
            ${!isApproved && rejectionReason ? infoRow('Sebab Penolakan', rejectionReason) : ''}
          </table>
        </div>
        
        ${isApproved ? `
          <p style="color: #666; font-size: 14px; margin: 0 0 10px; text-align: center;">
            ${requestType === 'leave' ? 'Cuti anda telah direkodkan dalam sistem.' :
        requestType === 'salary_advance' ? 'Pendahuluan gaji akan ditolak daripada gaji bulan hadapan.' :
          requestType === 'ot_claim' || requestType === 'claim' ? 'Pembayaran akan diproses.' :
            'Sila lihat status terkini di Staff Portal.'}
          </p>
        ` : `
          <p style="color: #666; font-size: 14px; margin: 0 0 10px; text-align: center;">
            Jika ada pertanyaan, sila hubungi pihak pengurusan.
          </p>
        `}
        
        ${actionButton(portalUrl, 'Lihat Staff Portal')}
      </td>
    </tr>
  `;

  return emailWrapper(content);
}

// Convenience functions for specific request types
export function getLeaveResultEmailTemplate(
  staffName: string,
  isApproved: boolean,
  approverName: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string,
  rejectionReason?: string
): string {
  return getStaffResultEmailTemplate({
    staffName,
    requestType: 'leave',
    isApproved,
    approverName,
    rejectionReason,
    details: `${leaveTypeLabels[leaveType]} (${startDate} - ${endDate})`,
  });
}

export function getOTClaimResultEmailTemplate(
  staffName: string,
  isApproved: boolean,
  approverName: string,
  date: string,
  totalAmount: number,
  rejectionReason?: string
): string {
  return getStaffResultEmailTemplate({
    staffName,
    requestType: 'ot_claim',
    isApproved,
    approverName,
    rejectionReason,
    details: `OT pada ${date} - BND ${totalAmount.toFixed(2)}`,
  });
}

export function getClaimResultEmailTemplate(
  staffName: string,
  isApproved: boolean,
  approverName: string,
  claimType: ClaimType,
  amount: number,
  rejectionReason?: string
): string {
  return getStaffResultEmailTemplate({
    staffName,
    requestType: 'claim',
    isApproved,
    approverName,
    rejectionReason,
    details: `${claimTypeLabels[claimType]} - BND ${amount.toFixed(2)}`,
  });
}

export function getSalaryAdvanceResultEmailTemplate(
  staffName: string,
  isApproved: boolean,
  approverName: string,
  amount: number,
  rejectionReason?: string
): string {
  return getStaffResultEmailTemplate({
    staffName,
    requestType: 'salary_advance',
    isApproved,
    approverName,
    rejectionReason,
    details: `Pendahuluan BND ${amount.toFixed(2)}`,
  });
}

export function getStaffRequestResultEmailTemplate(
  staffName: string,
  isApproved: boolean,
  approverName: string,
  category: RequestCategory,
  title: string,
  rejectionReason?: string
): string {
  return getStaffResultEmailTemplate({
    staffName,
    requestType: 'staff_request',
    isApproved,
    approverName,
    rejectionReason,
    details: `${requestCategoryLabels[category]} - ${title}`,
  });
}

