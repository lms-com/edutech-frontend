import axiosClient from './axiosClient';
import type { ApiResponse } from '../types/auth';

export interface InstructorApplicationDto {
  id: string;
  userId: string;
  applicantName: string;
  applicantEmail: string;
  bio: string;
  expertise: string;
  experienceYears: number;
  portfolioUrl?: string;
  cvUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitInstructorApplicationRequest {
  bio: string;
  expertise: string;
  experienceYears?: number;
  portfolioUrl?: string;
  cvUrl?: string;
}

export interface ReviewInstructorApplicationRequest {
  approved: boolean;
  rejectionReason?: string;
  defaultCommissionRate?: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const instructorApplicationApi = {
  // Học viên nộp đơn
  submitApplication: async (data: SubmitInstructorApplicationRequest): Promise<InstructorApplicationDto> => {
    const res: any = await axiosClient.post('/iam-service/api/v1/user/me/instructor-applications', data);
    return res.data || res;
  },

  // Học viên xem các đơn của mình
  getMyApplications: async (): Promise<InstructorApplicationDto[]> => {
    const res: any = await axiosClient.get('/iam-service/api/v1/user/me/instructor-applications');
    return res.data || [];
  },

  // Admin xem danh sách đơn
  getApplicationsForAdmin: async (status?: string, page = 0, size = 10): Promise<PageResponse<InstructorApplicationDto>> => {
    const params: any = { page, size };
    if (status && status !== 'ALL') {
      params.status = status;
    }
    const res: any = await axiosClient.get('/iam-service/api/v1/admin/instructor-applications', { params });
    return res.data || { content: [], totalElements: 0, totalPages: 0, size, number: page };
  },

  // Admin duyệt đơn
  reviewApplication: async (applicationId: string, data: ReviewInstructorApplicationRequest): Promise<InstructorApplicationDto> => {
    const res: any = await axiosClient.put(`/iam-service/api/v1/admin/instructor-applications/${applicationId}/review`, data);
    return res.data || res;
  },
};

export default instructorApplicationApi;
