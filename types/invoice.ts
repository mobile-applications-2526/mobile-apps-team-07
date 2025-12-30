export interface Invoice {
    id: string;
    number: string;
    type: 'TC Hire' | 'VC Freight' | string;
    date: string; // ISO string
    dueDate?: string; // optional ISO
    amount: number;
    currency: string;
    status: 'Paid' | 'Pending' | 'Overdue';
    pdfUrl?: string | null;
    fileUrl?: string | null;  // Alternative field name for PDF URL
    pdfReady?: boolean;
}
