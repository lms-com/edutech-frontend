import axiosClient from './axiosClient';
import { unwrap, type ApiEnvelope } from './response';
import {
  mapInstructorAnalyticsOverview,
  mapRevenueChartPoint,
  mapCourseRevenueBreakdown,
  type InstructorAnalyticsOverviewDto,
  type RevenueChartPointDto,
  type CourseRevenueBreakdownDto,
} from './mappers/instructorAnalyticsMapper';
import type { InstructorAnalyticsOverview, RevenueChartPoint, CourseRevenueBreakdown } from '../types';

export const instructorAnalyticsApi = {
  /**
   * Lấy tổng quan các chỉ số KPI doanh thu, số học viên, số khóa học và số dư ví thực tế
   */
  getOverview: async (): Promise<InstructorAnalyticsOverview> => {
    try {
      const res = await axiosClient.get<ApiEnvelope<InstructorAnalyticsOverviewDto>>(
        '/finance-service/api/v1/instructor/analytics/overview'
      );
      const dto = unwrap(res);
      return mapInstructorAnalyticsOverview(dto);
    } catch {
      return mapInstructorAnalyticsOverview(null);
    }
  },

  /**
   * Lấy dữ liệu biểu đồ doanh thu theo 6 tháng gần nhất
   */
  getRevenueChart: async (): Promise<RevenueChartPoint[]> => {
    try {
      const res = await axiosClient.get<ApiEnvelope<RevenueChartPointDto[]>>(
        '/finance-service/api/v1/instructor/analytics/revenue-chart'
      );
      const dtoList = unwrap(res) || [];
      return dtoList.map(mapRevenueChartPoint);
    } catch {
      return [];
    }
  },

  /**
   * Lấy thống kê chi tiết doanh thu theo từng khóa học (Gross, Phí sàn, Net thực nhận, Lượt bán)
   */
  getCourseBreakdown: async (): Promise<CourseRevenueBreakdown[]> => {
    try {
      const res = await axiosClient.get<ApiEnvelope<CourseRevenueBreakdownDto[]>>(
        '/finance-service/api/v1/instructor/analytics/courses-breakdown'
      );
      const dtoList = unwrap(res) || [];
      return dtoList.map(mapCourseRevenueBreakdown);
    } catch {
      return [];
    }
  },
};

export default instructorAnalyticsApi;

