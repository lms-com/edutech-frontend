import axiosClient from './axiosClient';
import { unwrap, type ApiEnvelope } from './response';
import {
  mapInstructorAnalyticsOverview,
  mapRevenueChartPoint,
  type InstructorAnalyticsOverviewDto,
  type RevenueChartPointDto,
} from './mappers/instructorAnalyticsMapper';
import type { InstructorAnalyticsOverview, RevenueChartPoint } from '../types';

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
};

export default instructorAnalyticsApi;
