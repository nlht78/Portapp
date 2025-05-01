import cron from 'node-cron';
import { KPIModel } from '../models/kpi.model';
import { KPIInstanceModel } from '../models/kpi-instance.model';
import { createKPIInstance, calculateEndDate } from '../services/kpi.service';

// Kiểm tra xem có nên tạo instance mới cho KPI dựa trên interval type và ngày bắt đầu
const shouldCreateNewInstance = async (kpi: any): Promise<boolean> => {
  try {
    // Lấy instance mới nhất của KPI
    const latestInstance = await KPIInstanceModel.findOne({
      kpiId: kpi._id
    }).sort({ createdAt: -1 });

    // Nếu không có instance nào, tạo mới
    if (!latestInstance) {
      return true;
    }

    const now = new Date();
    const instanceStartDate = new Date(latestInstance.startDate);
    
    switch (kpi.intervalType) {
      case 'daily': 
        // Hàng ngày vào lúc 0h
        const dayDiff = Math.floor((now.getTime() - instanceStartDate.getTime()) / (1000 * 60 * 60 * 24));
        return dayDiff >= 1;
      
      case 'weekly': 
        // Cùng thứ trong tuần với ngày bắt đầu
        return now.getDay() === instanceStartDate.getDay() && 
               Math.floor((now.getTime() - instanceStartDate.getTime()) / (1000 * 60 * 60 * 24)) >= 7;
      
      case 'monthly': 
        // Cùng ngày trong tháng với ngày bắt đầu
        const startDay = instanceStartDate.getDate();
        const currentDay = now.getDate();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const instanceMonth = instanceStartDate.getMonth();
        const instanceYear = instanceStartDate.getFullYear();

        // Nếu hiện tại là cùng ngày, và đã qua ít nhất 1 tháng
        const monthsPassed = (currentYear - instanceYear) * 12 + (currentMonth - instanceMonth);
        
        if (monthsPassed < 1) return false;
        
        // Kiểm tra xem đã đến ngày đúng chưa
        const monthLastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Nếu startDay > monthLastDay, sử dụng ngày cuối cùng của tháng, nếu không sử dụng startDay
        return currentDay === Math.min(startDay, monthLastDay);
      
      case 'quarterly': 
        // Cùng ngày trong quý với ngày bắt đầu
        const quarterStartDay = instanceStartDate.getDate();
        const quarterStartMonth = instanceStartDate.getMonth();
        const quarterMonthMod = quarterStartMonth % 3; // 0, 1 hoặc 2
        
        // Xác định tháng bắt đầu của quý
        const thisQuarterStartMonth = now.getMonth() - (now.getMonth() % 3);
        
        // Kiểm tra xem có phải là ngày tương ứng trong quý mới không
        const quarterMonthLastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const isCorrectDayInQuarter = now.getDate() === Math.min(
          quarterStartDay, 
          quarterMonthLastDay
        );
        
        // Kiểm tra xem có phải là tháng tương ứng trong quý mới không
        const isCorrectMonthOffset = (now.getMonth() - thisQuarterStartMonth) === quarterMonthMod;
        
        // Kiểm tra xem đã qua ít nhất 3 tháng chưa
        const quartersPassed = Math.floor(
          ((now.getFullYear() - instanceStartDate.getFullYear()) * 12 + (now.getMonth() - instanceStartDate.getMonth())) / 3
        );
        
        return isCorrectDayInQuarter && isCorrectMonthOffset && quartersPassed >= 1;
      
      case 'yearly': 
        // Cùng ngày và tháng với ngày bắt đầu
        const yearStartDay = instanceStartDate.getDate();
        const yearStartMonth = instanceStartDate.getMonth();
        
        // Xử lý trường hợp 29/2
        if (yearStartMonth === 1 && yearStartDay === 29) {
          const isLeapYear = new Date(now.getFullYear(), 1, 29).getDate() === 29;
          
          // Nếu năm hiện tại là năm nhuận, kiểm tra ngày 29/2
          if (isLeapYear) {
            return now.getMonth() === 1 && now.getDate() === 29 && 
                   now.getFullYear() > instanceStartDate.getFullYear();
          } else {
            // Nếu không phải năm nhuận, kiểm tra ngày 28/2
            return now.getMonth() === 1 && now.getDate() === 28 && 
                   now.getFullYear() > instanceStartDate.getFullYear();
          }
        }
        
        // Với các trường hợp khác, kiểm tra cùng ngày và tháng
        const yearMonthLastDay = new Date(now.getFullYear(), yearStartMonth + 1, 0).getDate();
        const correctDay = Math.min(yearStartDay, yearMonthLastDay);
        
        return now.getMonth() === yearStartMonth && now.getDate() === correctDay && 
               now.getFullYear() > instanceStartDate.getFullYear();
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Error in shouldCreateNewInstance:', error);
    return false;
  }
};

// Function to create new KPI instances
const createNewKPIInstances = async () => {
  try {
    console.log('Starting KPI instance creation cron job...');

    // Get all active KPIs
    const activeKPIs = await KPIModel.find({ isActive: true });
    let createdCount = 0;

    for (const kpi of activeKPIs) {
      // Kiểm tra xem có nên tạo instance mới không
      const shouldCreate = await shouldCreateNewInstance(kpi);
      
      if (shouldCreate) {
        const now = new Date();
        const startDate = now;
        const endDate = calculateEndDate(startDate, kpi.intervalType);

        // Create new instance with kpi.baseGoal as the goal
        await createKPIInstance({
          kpiId: kpi.id,
          startDate,
          endDate,
          goal: kpi.baseGoal, // Sử dụng baseGoal từ KPI
          completed: 0,
        });

        console.log(`Created new KPI instance for KPI: ${kpi.id}`);
        createdCount++;
      }
    }

    console.log(`KPI instance creation cron job completed: ${createdCount} instances created`);
  } catch (error) {
    console.error('Error in KPI instance creation cron job:', error);
  }
};

// Schedule cron job to run daily
export const initializeKPICronJobs = () => {
  // Chạy hàng ngày vào 00:01 để kiểm tra và tạo các instance mới cần thiết
  cron.schedule('1 0 * * *', async () => {
    console.log('Running daily KPI instance check...');
    await createNewKPIInstances();
  });
}; 