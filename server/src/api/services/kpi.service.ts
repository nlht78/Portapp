import { Types } from 'mongoose';
import { KPIModel } from '../models/kpi.model';
import { KPIInstanceModel } from '../models/kpi-instance.model';
import { BadRequestError, NotFoundError } from '../core/errors';
import { getReturnData, getReturnList } from '@utils/index';
import { ICreateKPIData, IUpdateKPIData } from '../interfaces/kpi.interface';
import {
  ICreateKPIInstanceData,
  IUpdateKPIInstanceData,
  IUpdateFullKPIInstanceData,
} from '../interfaces/kpi-instance.interface';
import { UserModel } from '../models/user.model';

// Create new KPI
const createKPI = async (data: ICreateKPIData) => {
  try {
    console.log('Creating KPI with data:', data);

    // Validate required fields
    if (!data.name || !data.assigneeId || !data.intervalType) {
      throw new BadRequestError(
        'Missing required fields: name, assigneeId, or intervalType'
      );
    }

    // Convert assigneeId to ObjectId
    const assigneeId = new Types.ObjectId(data.assigneeId);

    // Validate if user exists
    const user = await UserModel.findById(assigneeId);
    if (!user) {
      throw new NotFoundError('User with provided assigneeId not found');
    }

    // Create KPI with validated data
    const kpi = await KPIModel.build({
      name: data.name,
      assigneeId: assigneeId,
      description: data.description || '',
      baseGoal: data.baseGoal || 0,
      intervalType: data.intervalType,
      isActive: data.isActive ?? true, // Default to true if not provided
    });

    // Save KPI to get the ID
    console.log('KPI created successfully:', kpi);

    try {
      // Create first KPI instance
      const kpiInstance = await createKPIInstance({
        kpiId: kpi.id,
        startDate: new Date(),
        endDate: calculateEndDate(new Date(), data.intervalType),
        goal: data.baseGoal || 0,
        completed: 0,
      });

      console.log('Created KPI instance:', kpiInstance);
    } catch (instanceError) {
      console.error('Error creating KPI instance:', instanceError);
      // Don't throw error here as KPI is already created
    }

    return getReturnData(kpi);
  } catch (error) {
    console.error('Error in createKPI:', error);
    if (error instanceof Error) {
      if (error.name === 'CastError') {
        throw new BadRequestError('Invalid assigneeId format');
      }
      throw error;
    }
    throw new Error('Unknown error occurred while creating KPI');
  }
};

// Get all KPIs
const getKPIs = async (query: any = {}) => {
  // Convert assigneeId to ObjectId if present
  if (query.assigneeId) {
    query.assigneeId = new Types.ObjectId(query.assigneeId as string);
  }

  const kpis = await KPIModel.find(query)
    .populate('assigneeId', 'usr_firstName usr_lastName usr_email')
    .sort({ createdAt: -1 });

  return kpis.map((kpi) => getReturnData(kpi));
};

// Get KPI by ID
const getKPIById = async (id: string) => {
  const kpi = await KPIModel.findById(id).populate(
    'assigneeId',
    'usr_firstName usr_lastName usr_email'
  );

  if (!kpi) {
    throw new NotFoundError('KPI not found');
  }

  return getReturnData(kpi);
};

// Get KPI instance by ID
const getKPIInstanceById = async (id: string) => {
  const instance = await KPIInstanceModel.findById(id).populate({
    path: 'kpiId',
  });
  if (!instance) {
    throw new NotFoundError('KPI Instance not found');
  }

  return {
    ...getReturnData(instance, { without: ['kpiId'] }),
    kpiId: instance.kpiId._id,
    kpi: getReturnData(instance.kpiId),
  };
};

// Update KPI
const updateKPI = async (id: string, data: IUpdateKPIData) => {
  const kpi = await KPIModel.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true }
  ).populate('assigneeId', 'usr_firstName usr_lastName usr_email');

  if (!kpi) {
    throw new NotFoundError('KPI not found');
  }

  return getReturnData(kpi);
};

// Enhanced Update KPI - Admin version to update all fields
const updateKPIFull = async (id: string, data: any) => {
  try {
    console.log('Updating KPI with data:', data);

    const kpiExists = await KPIModel.findById(id);
    if (!kpiExists) {
      throw new NotFoundError('KPI not found');
    }

    // If assigneeId is provided, validate it
    if (data.assigneeId) {
      // Convert assigneeId to ObjectId
      const assigneeId = new Types.ObjectId(data.assigneeId);

      // Validate if user exists
      const user = await UserModel.findById(assigneeId);
      if (!user) {
        throw new NotFoundError('User with provided assigneeId not found');
      }

      // Update assigneeId with valid ObjectId
      data.assigneeId = assigneeId;
    }

    // Update KPI with all provided data
    const kpi = await KPIModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).populate('assigneeId', 'usr_firstName usr_lastName usr_email');

    if (!kpi) {
      throw new NotFoundError('KPI not found');
    }

    console.log('KPI updated successfully:', kpi);
    return getReturnData(kpi);
  } catch (error) {
    console.error('Error in updateKPIFull:', error);
    if (error instanceof Error) {
      if (error.name === 'CastError') {
        throw new BadRequestError('Invalid ID format');
      }
      throw error;
    }
    throw new Error('Unknown error occurred while updating KPI');
  }
};

// Delete KPI
const deleteKPI = async (id: string) => {
  const kpi = await KPIModel.findByIdAndDelete(id);
  if (!kpi) {
    throw new NotFoundError('KPI not found');
  }

  // Delete all related KPI instances
  await KPIInstanceModel.deleteMany({ kpiId: id });

  return {
    success: true,
  };
};

// Create KPI Instance
const createKPIInstance = async (data: ICreateKPIInstanceData) => {
  try {
    console.log('Creating KPI instance with data:', data);

    const kpi = await KPIModel.findById(data.kpiId);
    if (!kpi) {
      throw new NotFoundError('KPI not found');
    }

    // Đảm bảo goal mặc định lấy từ baseGoal của KPI
    const goal = data.goal || kpi.baseGoal;

    const instance = await KPIInstanceModel.build({
      ...data,
      goal: goal, // Sử dụng goal đã tính toán ở trên
      kpiId: new Types.ObjectId(data.kpiId),
    });

    // Save instance
    console.log('KPI instance created successfully:', instance);

    return getReturnData(instance);
  } catch (error) {
    console.error('Error in createKPIInstance:', error);
    throw error;
  }
};

// Get KPI Instances by KPI ID
const getKPIInstances = async (kpiId: string) => {
  const instances = await KPIInstanceModel.find({
    kpiId: new Types.ObjectId(kpiId),
  }).sort({ startDate: -1 });

  return getReturnList(instances);
};

// Update KPI Instance Progress
const updateKPIInstanceProgress = async (
  instanceId: string,
  completed: number
) => {
  const instance = await KPIInstanceModel.findByIdAndUpdate(
    instanceId,
    { $set: { completed } },
    { new: true }
  ).populate({
    path: 'kpiId',
    populate: {
      path: 'assigneeId',
      select: 'usr_firstName usr_lastName usr_email',
    },
  });

  if (!instance) {
    throw new NotFoundError('KPI Instance not found');
  }

  return getReturnData(instance);
};

// Update KPI Instance - Full version for admin to update all fields
const updateKPIInstance = async (
  instanceId: string,
  data: IUpdateFullKPIInstanceData
) => {
  try {
    console.log('Updating KPI instance with data:', data);

    // Validate if instance exists
    const instanceExists = await KPIInstanceModel.findById(instanceId);
    if (!instanceExists) {
      throw new NotFoundError('KPI Instance not found');
    }

    // Create a new data object for the update
    const updateData: any = { ...data };

    // If kpiId is provided, validate it and convert to ObjectId
    if (data.kpiId) {
      const kpi = await KPIModel.findById(data.kpiId);
      if (!kpi) {
        throw new NotFoundError('KPI not found for the provided kpiId');
      }

      // Convert to ObjectId and assign to the new update object
      updateData.kpiId = new Types.ObjectId(data.kpiId);
    }

    // Update instance with all provided data
    const instance = await KPIInstanceModel.findByIdAndUpdate(
      instanceId,
      { $set: updateData },
      { new: true }
    ).populate({
      path: 'kpiId',
      populate: {
        path: 'assigneeId',
        select: 'usr_firstName usr_lastName usr_email',
      },
    });

    if (!instance) {
      throw new NotFoundError('KPI Instance not found');
    }

    console.log('KPI instance updated successfully:', instance);
    return getReturnData(instance);
  } catch (error) {
    console.error('Error in updateKPIInstance:', error);
    if (error instanceof Error) {
      if (error.name === 'CastError') {
        throw new BadRequestError('Invalid ID format');
      }
      throw error;
    }
    throw new Error('Unknown error occurred while updating KPI instance');
  }
};

// Get Employee KPI Performance
const getEmployeeKPIPerformance = async (
  employeeId: string,
  startDate: Date,
  endDate: Date
) => {
  const kpis = await KPIModel.find({
    assigneeId: new Types.ObjectId(employeeId),
  });
  const kpiIds = kpis.map((kpi) => kpi._id);

  const instances = await KPIInstanceModel.find({
    kpiId: { $in: kpiIds },
    startDate: { $gte: startDate },
    endDate: { $lte: endDate },
  }).populate({
    path: 'kpiId',
    populate: {
      path: 'assigneeId',
      select: 'usr_firstName usr_lastName usr_email',
    },
  });

  return instances.map((instance) => getReturnData(instance));
};

// Helper function to calculate end date based on interval type and start date
const calculateEndDate = (startDate: Date, intervalType: string): Date => {
  const endDate = new Date(startDate);

  switch (intervalType) {
    case 'daily':
      endDate.setDate(endDate.getDate() + 1);
      break;
    case 'weekly':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'monthly':
      // Lưu lại ngày bắt đầu để xử lý các tháng không có ngày tương ứng
      const startDay = startDate.getDate();
      endDate.setMonth(endDate.getMonth() + 1);

      // Xử lý trường hợp tháng kết thúc không có ngày tương ứng với ngày bắt đầu
      const endMonth = endDate.getMonth();
      endDate.setDate(1); // Đặt về ngày 1 để tránh bị nhảy tháng
      endDate.setMonth(endMonth); // Đặt lại tháng

      // Tính toán ngày cuối cùng của tháng
      const lastDayOfMonth = new Date(
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        0
      ).getDate();

      // Sử dụng ngày ban đầu hoặc ngày cuối cùng của tháng nếu ngày ban đầu lớn hơn
      endDate.setDate(Math.min(startDay, lastDayOfMonth));
      break;
    case 'quarterly':
      // Lưu lại ngày bắt đầu
      const quarterStartDay = startDate.getDate();
      endDate.setMonth(endDate.getMonth() + 3);

      // Xử lý trường hợp tháng kết thúc không có ngày tương ứng
      const quarterEndMonth = endDate.getMonth();
      endDate.setDate(1); // Đặt về ngày 1 để tránh bị nhảy tháng
      endDate.setMonth(quarterEndMonth); // Đặt lại tháng

      // Tính toán ngày cuối cùng của tháng
      const lastDayOfQuarterMonth = new Date(
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        0
      ).getDate();

      // Sử dụng ngày ban đầu hoặc ngày cuối cùng của tháng nếu ngày ban đầu lớn hơn
      endDate.setDate(Math.min(quarterStartDay, lastDayOfQuarterMonth));
      break;
    case 'yearly':
      // Lưu lại ngày và tháng bắt đầu
      const yearStartDay = startDate.getDate();
      const yearStartMonth = startDate.getMonth();

      // Tăng năm lên 1
      endDate.setFullYear(endDate.getFullYear() + 1);

      // Kiểm tra năm nhuận và xử lý trường hợp 29/2
      if (yearStartMonth === 1 && yearStartDay === 29) {
        // Tháng 2, ngày 29
        const isLeapYear =
          new Date(endDate.getFullYear(), 1, 29).getDate() === 29;
        if (!isLeapYear) {
          // Nếu năm kết thúc không phải năm nhuận, sử dụng ngày 28/2
          endDate.setMonth(1); // Tháng 2 (0-indexed)
          endDate.setDate(28);
        } else {
          // Nếu là năm nhuận, giữ nguyên ngày 29/2
          endDate.setMonth(1);
          endDate.setDate(29);
        }
      } else {
        // Đối với các ngày khác, đặt lại tháng và ngày
        endDate.setMonth(yearStartMonth);

        // Xử lý các trường hợp tháng không có ngày tương ứng
        const lastDayOfYearMonth = new Date(
          endDate.getFullYear(),
          yearStartMonth + 1,
          0
        ).getDate();
        endDate.setDate(Math.min(yearStartDay, lastDayOfYearMonth));
      }
      break;
    default:
      throw new BadRequestError('Invalid interval type');
  }

  return endDate;
};

// Get all KPIs with their latest instances
const getKPIsWithInstances = async (query: any = {}) => {
  // Convert assigneeId to ObjectId if present
  if (query.assigneeId) {
    query.assigneeId = new Types.ObjectId(query.assigneeId);
  }

  const kpis = await KPIModel.find(query)
    .populate('assigneeId', 'usr_firstName usr_lastName usr_email')
    .sort({ createdAt: -1 });

  // Get latest instance for each KPI based on updatedAt
  const kpisWithInstances = await Promise.all(
    kpis.map(async (kpi) => {
      const latestInstance = await KPIInstanceModel.findOne({
        kpiId: kpi._id,
      }).sort({ createdAt: -1 });

      return {
        ...getReturnData(kpi),
        instance: latestInstance ? getReturnData(latestInstance) : undefined,
      };
    })
  );

  return kpisWithInstances;
};

// Get KPIs by user ID
const getKPIsByUserId = async (userId: string, query: any = {}) => {
  try {
    // Convert userId to ObjectId
    const assigneeId = new Types.ObjectId(userId);

    // Build query with assigneeId
    const finalQuery = {
      assigneeId,
      ...query,
    };

    // Get KPIs with populated assignee information
    const kpis = await KPIModel.find(finalQuery)
      .populate('assigneeId', 'usr_firstName usr_lastName usr_email')
      .sort({ createdAt: -1 });

    return kpis.map((kpi) => getReturnData(kpi));
  } catch (error) {
    console.error('Error in getKPIsByUserId:', error);
    if (error instanceof Error) {
      if (error.name === 'CastError') {
        throw new BadRequestError('Invalid userId format');
      }
      throw error;
    }
    throw new Error('Unknown error occurred while getting KPIs by user ID');
  }
};

// Get KPIs by user ID with instances
const getKPIInstancesByUserId = async (userId: string, query: any = {}) => {
  try {
    // Convert userId to ObjectId
    const assigneeId = new Types.ObjectId(userId);

    const kpisWithInstances = await KPIInstanceModel.aggregate([
      {
        $lookup: {
          from: 'kpis',
          localField: 'kpiId',
          foreignField: '_id',
          as: 'kpi',
        },
      },
      {
        $unwind: '$kpi',
      },
      {
        $match: { 'kpi.assigneeId': assigneeId },
      },
      {
        $sort: { startDate: -1 },
      },
    ]);

    return getReturnList(kpisWithInstances);
  } catch (error: any) {
    console.error('Error in getKPIsByUserIdWithInstances:', error);
    if (error?.name === 'CastError') {
      throw new BadRequestError('Invalid userId format');
    }

    throw new Error(
      'Unknown error occurred while getting KPIs by user ID with instances'
    );
  }
};

const getTodayKPIInstances = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set time to midnight
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1); // Set time to midnight of the next day
  const instances = await KPIInstanceModel.find({
    startDate: { $gte: today, $lt: tomorrow },
    kpiId: { $in: await KPIModel.find({ assigneeId: userId }).distinct('_id') },
  })
    .populate('kpiId', 'name description intervalType')
    .populate('kpiId.assigneeId', 'usr_firstName usr_lastName usr_email')
    .sort({ startDate: -1 });
  return instances.map((instance) => getReturnData(instance));
};

const deleteKPIInstance = async (instanceId: string) => {
  const instance = await KPIInstanceModel.findByIdAndDelete(instanceId);
  if (!instance) {
    throw new NotFoundError('KPI Instance not found');
  }

  return {
    success: true,
  };
};

export {
  createKPI,
  getKPIs,
  getKPIById,
  updateKPI,
  updateKPIFull,
  deleteKPI,
  deleteKPIInstance,
  createKPIInstance,
  getKPIInstances,
  updateKPIInstanceProgress,
  updateKPIInstance,
  getEmployeeKPIPerformance,
  calculateEndDate,
  getKPIsWithInstances,
  getKPIsByUserId,
  getKPIInstancesByUserId,
  getTodayKPIInstances,
  getKPIInstanceById,
};
