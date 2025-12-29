import { Invoice } from '@/types';

export function mapBackendInvoice(i: any): Invoice {
    let t = i.invoiceType ?? i.invoice_type ?? i.type ?? 'TC Hire';
    if (t === 'Hire') t = 'TC Hire';
    if (t === 'Freight') t = 'VC Freight';

    return {
        id: String(i.invoiceId ?? i.id ?? i.invoice_id ?? i.id),
        number: i.invoiceNumber ?? i.invoice_number ?? i.number ?? 'UNKNOWN',
        type: t,
        date: i.invoiceDate ?? i.invoice_date ?? i.date ?? new Date().toISOString(),
        dueDate: i.periodTo ?? i.dueDate ?? i.due_date,
        amount: Number(i.totalAmount ?? i.total_amount ?? i.amount ?? 0),
        currency: i.currency ?? 'USD',
        status: i.paymentStatus ?? i.payment_status ?? i.status ?? 'Pending',
        pdfUrl: i.fileUrl ?? i.pdfUrl ?? null,
        pdfReady: !!(i.pdfReady ?? i.pdf_ready ?? i.fileUrl)
    };
}
