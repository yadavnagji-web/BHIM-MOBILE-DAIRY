export interface Village {
  id: string;
  name: string;
  createdAt: number;
  contactCount?: number;
}

export interface Contact {
  id: string;
  villageId: string;
  villageName: string;
  name: string;
  fatherName?: string;
  mobile: string;
  alternateMobile?: string;
  category: string;
  address?: string;
  remark?: string;
  createdAt: number;
  updatedAt?: number;
  status?: 'approved' | 'pending' | 'rejected';
  addedWithOtp?: boolean;
}

export type ApprovalRequestType = 'new_contact' | 'edit_contact' | 'delete_contact';
export type ApprovalRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  type: ApprovalRequestType;
  status: ApprovalRequestStatus;
  contactData: {
    villageId: string;
    villageName: string;
    name: string;
    fatherName?: string;
    mobile: string;
    alternateMobile?: string;
    category: string;
    address?: string;
    remark?: string;
  };
  targetContactId?: string;
  existingContactData?: Partial<Contact>;
  requesterName?: string;
  requesterPhone?: string;
  reason?: string;
  createdAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}

export type ActiveTab = 'home' | 'villages' | 'favorites' | 'add' | 'help' | 'admin';

export interface CsvImportResult {
  total: number;
  successCount: number;
  failedCount: number;
  failedRows: { rowNumber: number; reason: string; data: Partial<Contact> }[];
}
