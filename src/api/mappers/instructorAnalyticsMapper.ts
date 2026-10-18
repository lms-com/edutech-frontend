import type { InstructorAnalyticsOverview, RevenueChartPoint } from '../../types';

export interface InstructorAnalyticsOverviewDto {
  totalStudents?: number;
  totalCourses?: number;
  thisMonthRevenue?: number;
  lastMonthRevenue?: number;
  growthRate?: number;
  thisMonthSales?: number;
  availableBalance?: number;
  pendingBalance?: number;
  actualBalance?: number;
  allTimeRevenue?: number;
}

export interface RevenueChartPointDto {
  period?: string;
  label?: string;
  revenue?: number;
  grossSales?: number;
  orderCount?: number;
}

export interface CourseRevenueBreakdownDto {
  courseId?: string;
  courseTitle?: string;
  basePrice?: number;
  grossRevenue?: number;
  netRevenue?: number;
  platformFee?: number;
  commissionRate?: number;
  salesCount?: number;
}

export const mapInstructorAnalyticsOverview = (
  dto?: InstructorAnalyticsOverviewDto | null
): InstructorAnalyticsOverview => ({
  totalStudents: Number(dto?.totalStudents) || 0,
  totalCourses: Number(dto?.totalCourses) || 0,
  thisMonthRevenue: Number(dto?.thisMonthRevenue) || 0,
  lastMonthRevenue: Number(dto?.lastMonthRevenue) || 0,
  growthRate: Number(dto?.growthRate) || 0,
  thisMonthSales: Number(dto?.thisMonthSales) || 0,
  availableBalance: Number(dto?.availableBalance) || 0,
  pendingBalance: Number(dto?.pendingBalance) || 0,
  actualBalance: Number(dto?.actualBalance) || 0,
  allTimeRevenue: Number(dto?.allTimeRevenue) || 0,
});

export const mapRevenueChartPoint = (dto: RevenueChartPointDto): RevenueChartPoint => ({
  period: dto.period || '',
  label: dto.label || '',
  revenue: Number(dto.revenue) || 0,
  grossSales: Number(dto.grossSales) || 0,
  orderCount: Number(dto.orderCount) || 0,
});

export const mapCourseRevenueBreakdown = (
  dto: CourseRevenueBreakdownDto
): import('../../types').CourseRevenueBreakdown => ({
  courseId: dto.courseId || '',
  courseTitle: dto.courseTitle || 'Khóa học',
  basePrice: Number(dto.basePrice) || 0,
  grossRevenue: Number(dto.grossRevenue) || 0,
  netRevenue: Number(dto.netRevenue) || 0,
  platformFee: Number(dto.platformFee) || 0,
  commissionRate: Number(dto.commissionRate) || 0.7,
  salesCount: Number(dto.salesCount) || 0,
});

