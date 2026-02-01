import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PayrollEntry, getMonthLabel } from './payroll-data';
import { PayslipConfig } from './types';

const COMPANY_INFO = {
    name: 'ABANG BOB BWN ENTERPRISE',
    regNo: '(P30012447)',
    address: 'Lot No. G77, Door B, Rimba Point, Jalan 18, Perumahan Negara Rimba, BE 3119, Bandar Seri Begawan, Brunei Darussalam',
    contact: 'Tel: 6738848845'
};

// Helper to load image
function getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.setAttribute("crossOrigin", "anonymous");
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
        };
        img.onerror = error => reject(error);
        img.src = url;
    });
}

export const generatePayslipPDF = async (entry: PayrollEntry, config?: PayslipConfig) => {
    // Default config if not provided
    const safeConfig: PayslipConfig = config || {
        template: 'professional',
        showLogo: true,
        showCompanyInfo: true,
        showEmployerContributions: false,
        customNote: ''
    };

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- PROFESSIONAL TEMPLATE ---
    if (safeConfig.template === 'professional') {
        const imgData = safeConfig.showLogo ? await getBase64ImageFromURL('/logo.png').catch(() => null) : null;

        // Header
        let yPos = 15;
        if (imgData) {
            doc.addImage(imgData, 'PNG', 15, 10, 25, 25);
        }

        const headerX = safeConfig.showLogo ? 50 : 15;

        // Company Info
        if (safeConfig.showCompanyInfo) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(COMPANY_INFO.name, headerX, yPos);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(COMPANY_INFO.regNo, headerX, yPos + 5);

            const splitAddress = doc.splitTextToSize(COMPANY_INFO.address, pageWidth - headerX - 15);
            doc.text(splitAddress, headerX, yPos + 10);

            // Calculate new Y based on address lines
            const addressLineCount = splitAddress.length;
            doc.text(COMPANY_INFO.contact, headerX, yPos + 10 + (addressLineCount * 4) + 4);
        } else {
            // If info hidden, at least show Name
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(COMPANY_INFO.name, headerX, yPos);
        }

        // Title Box
        doc.setFillColor(240, 240, 240);
        doc.rect(14, 48, pageWidth - 28, 8, 'F');
        doc.rect(14, 48, pageWidth - 28, 8, 'S'); // Border
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`SALARY SLIP - ${getMonthLabel(entry.month).toUpperCase()}`, pageWidth / 2, 53, { align: 'center' });

        // Staff Details
        let detailY = 65;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        const leftColX = 14;
        const rightColX = 110;

        doc.text(`Employee Name: ${entry.staffName}`, leftColX, detailY);
        doc.text(`Payroll Date: ${entry.paidAt ? entry.paidAt.split('T')[0] : new Date().toISOString().split('T')[0]}`, rightColX, detailY);
        detailY += 5;
        doc.text(`Employee ID: ${entry.staffId}`, leftColX, detailY);

        detailY += 15;

        // Tables using Headers
        const earnings = [
            { label: 'Basic Salary', amount: entry.baseSalary },
            { label: 'Overtime', amount: entry.overtimePay },
            { label: 'Allowances', amount: entry.allowances },
            { label: 'Bonus', amount: entry.bonus },
        ].filter(e => e.amount > 0);

        const deductions = [
            { label: `TAP (Employee ${entry.tapEnabled ? '5%' : '0%'})`, amount: entry.tapEmployee },
            { label: `SCP (Employee ${entry.scpEnabled ? '3.5%' : '0%'})`, amount: entry.scpEmployee },
            { label: 'Unpaid Leave', amount: entry.unpaidLeaveDeduction },
            { label: 'Other Deductions', amount: entry.otherDeductions },
        ].filter(d => d.amount > 0);

        const maxRows = Math.max(earnings.length, deductions.length);
        const tableBody = [];

        for (let i = 0; i < maxRows; i++) {
            const earn = earnings[i] || { label: '', amount: '' };
            const ded = deductions[i] || { label: '', amount: '' };

            tableBody.push([
                earn.label,
                typeof earn.amount === 'number' ? earn.amount.toFixed(2) : '',
                ded.label,
                typeof ded.amount === 'number' ? ded.amount.toFixed(2) : ''
            ]);
        }

        autoTable(doc, {
            startY: detailY,
            head: [['Payment', 'Amount (BND)', 'Deduction', 'Amount (BND)']],
            body: tableBody,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: {
                fontStyle: 'bold',
                lineWidth: { bottom: 0.5, top: 0.5 },
                lineColor: [0, 0, 0],
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0]
            },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { cellWidth: 25, halign: 'right' },
                2: { cellWidth: 70 },
                3: { cellWidth: 25, halign: 'right' }
            },
            tableLineColor: [0, 0, 0],
            tableLineWidth: 0,
        });

        // Summary Line
        const finalY = (doc as any).lastAutoTable.finalY + 2;

        doc.setLineWidth(0.5);
        doc.line(14, finalY, pageWidth - 14, finalY); // Top line

        doc.setFont('helvetica', 'italic');
        doc.text('Total Gross Salary', 14, finalY + 6);
        doc.setFont('helvetica', 'bold');
        doc.text(entry.grossSalary.toFixed(2), 109, finalY + 6, { align: 'right' });

        doc.setFont('helvetica', 'italic');
        doc.text('Total Deduction', 110, finalY + 6);
        doc.setFont('helvetica', 'bold');
        doc.text(entry.totalDeductions.toFixed(2), pageWidth - 14, finalY + 6, { align: 'right' });

        doc.line(14, finalY + 8, pageWidth - 14, finalY + 8); // Middle line

        // Net Pay
        doc.setFontSize(11);
        doc.text('NET PAY : BND', 14, finalY + 14);
        doc.text(entry.netPay.toFixed(2), pageWidth - 14, finalY + 14, { align: 'right' });

        doc.line(14, finalY + 16, pageWidth - 14, finalY + 16);
        doc.line(14, finalY + 17, pageWidth - 14, finalY + 17);

        // Employer Contributions Section
        let footerStartY = finalY + 25;
        if (safeConfig.showEmployerContributions) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('Employer Contributions (Reference):', 14, footerStartY);
            footerStartY += 5;
            doc.setFont('helvetica', 'normal');
            doc.text(`TAP Employer: ${entry.tapEmployer.toFixed(2)}`, 14, footerStartY);
            doc.text(`SCP Employer: ${entry.scpEmployer.toFixed(2)}`, 60, footerStartY);
            footerStartY += 10;
        }

        // Footer
        const footerY = 270;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        if (safeConfig.showCompanyInfo) {
            doc.text(`${COMPANY_INFO.name} ${COMPANY_INFO.regNo}`, pageWidth / 2, footerY, { align: 'center' });
        }
        doc.text('This is a computer generated payslip.', pageWidth / 2, footerY + 5, { align: 'center' });

    } else {
        // --- SIMPLE TEMPLATE ---
        // Minimalist layout

        let yPos = 20;

        if (safeConfig.showLogo) {
            const imgData = await getBase64ImageFromURL('/logo.png').catch(() => null);
            if (imgData) {
                doc.addImage(imgData, 'PNG', pageWidth / 2 - 15, yPos, 30, 30);
                yPos += 35;
            }
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(entry.staffName, pageWidth / 2, yPos, { align: 'center' });
        yPos += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`Payslip for ${getMonthLabel(entry.month)}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Divider
        doc.setDrawColor(200);
        doc.line(40, yPos, pageWidth - 40, yPos);
        yPos += 10;

        // Simple List
        const earnings = [
            { label: 'Basic Salary', amount: entry.baseSalary },
            { label: 'Overtime', amount: entry.overtimePay },
            { label: 'Allowances', amount: entry.allowances },
            { label: 'Bonus', amount: entry.bonus },
        ].filter(e => e.amount > 0);

        const deductions = [
            { label: 'TAP (5%)', amount: entry.tapEmployee },
            { label: 'SCP (3.5%)', amount: entry.scpEmployee },
            { label: 'Unpaid Leave', amount: entry.unpaidLeaveDeduction },
        ].filter(d => d.amount > 0);

        doc.setTextColor(0);
        doc.setFontSize(11);
        doc.text('Earnings', 40, yPos);
        yPos += 7;

        earnings.forEach(e => {
            doc.setFont('helvetica', 'normal');
            doc.text(e.label, 40, yPos);
            doc.setFont('helvetica', 'bold');
            doc.text(e.amount.toFixed(2), pageWidth - 40, yPos, { align: 'right' });
            yPos += 6;
        });

        yPos += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Deductions', 40, yPos);
        yPos += 7;

        deductions.forEach(d => {
            doc.setFont('helvetica', 'normal');
            doc.text(d.label, 40, yPos);
            doc.setFont('helvetica', 'bold');
            doc.text(`(${d.amount.toFixed(2)})`, pageWidth - 40, yPos, { align: 'right' });
            yPos += 6;
        });

        // Net Pay Box
        yPos += 10;
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(40, yPos, pageWidth - 80, 25, 3, 3, 'F');

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('NET PAY (BND)', pageWidth / 2, yPos + 8, { align: 'center' });

        doc.setFontSize(22);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(entry.netPay.toFixed(2), pageWidth / 2, yPos + 20, { align: 'center' });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Generated by Abang Bob System', pageWidth / 2, 280, { align: 'center' });
    }

    doc.save(`Payslip_${entry.staffName}_${entry.month}.pdf`);
};
