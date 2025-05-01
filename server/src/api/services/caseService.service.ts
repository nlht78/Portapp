import { NotFoundError, BadRequestError } from '../core/errors';
import { CaseServiceModel } from '../models/caseService.model';
import { CustomerModel } from '../models/customer.model';
import { EmployeeModel } from '../models/employee.model';
import {
  ICaseServiceAttrs,
  ICaseServiceFilter,
  ICaseServicePagination,
  ISearchCasesQuery,
  ICaseStatisticsQuery,
} from '../interfaces/caseService.interface';
import {
  getReturnData,
  getReturnList,
  removeNestedNullish,
} from '@utils/index';
import { CASE_SERVICE } from '../constants';
import { formatAttributeName } from '../utils';
import mongoose, { FilterQuery } from 'mongoose';
import {
  getFirstMonthDate,
  getFirstWeekDate,
  getLastMonthDate,
  getLastWeekDate,
} from '@utils/date.util';

const createCase = async (caseData: ICaseServiceAttrs) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Convert customerId to ObjectId if it's a string
    const customerId =
      typeof caseData.customerId === 'string'
        ? new mongoose.Types.ObjectId(caseData.customerId)
        : caseData.customerId;

    // Check if customer exists
    const customer = await CustomerModel.findById(customerId).session(session);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Convert other IDs if they exist
    if (caseData.consultantId) {
      caseData.consultantId =
        typeof caseData.consultantId === 'string'
          ? new mongoose.Types.ObjectId(caseData.consultantId)
          : caseData.consultantId;
    }

    // Format data with prefix before creating
    const formattedData = {
      ...formatAttributeName(caseData, CASE_SERVICE.PREFIX),
      case_customerId: customerId,
    };

    // Create case service
    const caseService = await CaseServiceModel.create([formattedData], {
      session,
    });

    // Update customer's status if needed
    if (customer.cus_status === 'potential') {
      customer.cus_status = 'active';
      await customer.save({ session });
    }

    await session.commitTransaction();
    return getReturnData(caseService[0]);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const getCases = async (
  filter: ICaseServiceFilter = {},
  pagination: ICaseServicePagination = {}
) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = pagination;

    const {
      startDate,
      endDate,
      month,
      week,
      day,
      note,
      contactChannel,
      isFullyPaid,
      customerId,
      appointmentStartDate,
      appointmentEndDate,
      paymentStatus,
      search,
    } = filter;

    // Build query
    const query: any = {};

    // Date filters cho createdAt - chỉ áp dụng nếu có giá trị
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Thêm filter theo ngày hẹn (case_appointmentDate)
    if (appointmentStartDate || appointmentEndDate) {
      query.case_appointmentDate = {};

      if (appointmentStartDate) {
        const startDateObj = new Date(appointmentStartDate);
        startDateObj.setHours(0, 0, 0, 0);
        query.case_appointmentDate.$gte = startDateObj;
      }

      if (appointmentEndDate) {
        const endDateObj = new Date(appointmentEndDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.case_appointmentDate.$lte = endDateObj;
      }
    }

    // Month filter - chỉ áp dụng nếu có giá trị
    if (month !== undefined) {
      query.$expr = {
        $eq: [{ $month: '$createdAt' }, month],
      };
    }

    // Week filter - chỉ áp dụng nếu có giá trị
    if (week !== undefined) {
      const startOfWeek = new Date();
      startOfWeek.setDate(
        startOfWeek.getDate() - startOfWeek.getDay() + (week - 1) * 7
      );
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      query.createdAt = {
        $gte: startOfWeek,
        $lte: endOfWeek,
      };
    }

    // Day filter - chỉ áp dụng nếu có giá trị
    if (day !== undefined) {
      query.$expr = {
        $eq: [{ $dayOfMonth: '$createdAt' }, day],
      };
    }

    // Note filter - chỉ áp dụng nếu có giá trị
    if (note) {
      query.case_progressNote = { $regex: note, $options: 'i' };
    }

    // Contact channel filter - chỉ áp dụng nếu có giá trị
    if (contactChannel) {
      query['case_customerId.cus_contactChannel'] = contactChannel;
    }

    // Tìm kiếm - nếu có giá trị search
    if (search) {
      // Sử dụng $or để tìm kiếm theo nhiều trường
      query.$or = [
        // Tìm kiếm theo tên khách hàng (sau khi đã populate)
        { 'case_customerId.cus_fullName': { $regex: search, $options: 'i' } },
        // Các trường khác trong case service
        { case_eventLocation: { $regex: search, $options: 'i' } },
        { case_progressNote: { $regex: search, $options: 'i' } },
        { case_consultantName: { $regex: search, $options: 'i' } },
        { case_fingerprintTakerName: { $regex: search, $options: 'i' } },
        { case_counselorName: { $regex: search, $options: 'i' } },
      ];
    }

    // Payment status filter - sử dụng paymentStatus hoặc isFullyPaid
    if (paymentStatus) {
      switch (paymentStatus) {
        case 'paid':
          query.case_debt = 0;
          break;
        case 'unpaid':
          query.case_debt = { $gt: 0 };
          break;
      }
    } else if (isFullyPaid !== undefined) {
      // Giữ lại filter cũ cho khả năng tương thích
      query.case_isFullyPaid = isFullyPaid;
    }

    // Customer filter - chỉ áp dụng nếu có giá trị
    if (customerId) {
      query.case_customerId =
        typeof customerId === 'string'
          ? new mongoose.Types.ObjectId(customerId)
          : customerId;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [casesResult, total] = await Promise.all([
      CaseServiceModel.find(query)
        .populate({
          path: 'case_customerId case_consultantId case_fingerprintTakerId case_mainCounselorId',
          select: '-__v',
          populate: {
            path: 'userId',
            select: 'usr_firstName usr_lastName usr_email',
            strictPopulate: false,
          },
        })
        .sort(sort)
        .skip(skip)
        .limit(limit),
      CaseServiceModel.countDocuments(query),
    ]);

    return {
      data: getReturnList(casesResult),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw error;
  }
};

const getCaseById = async (caseId: string) => {
  try {
    const caseService = await CaseServiceModel.findById(caseId)
      .populate('case_customerId', '-__v')
      .populate('case_consultantId', '-__v')
      .populate('case_fingerprintTakerId', '-__v')
      .populate('case_mainCounselorId', '-__v');

    if (!caseService) {
      throw new NotFoundError('Case service not found');
    }

    return getReturnData(caseService);
  } catch (error) {
    throw error;
  }
};

const updateCase = async (
  caseId: string,
  updateData: Partial<ICaseServiceAttrs>
) => {
  try {
    // Remove null and undefined values
    const cleanedData = removeNestedNullish(
      updateData
    ) as Partial<ICaseServiceAttrs>;

    // Format data with prefix and explicit type casting
    const formattedData = formatAttributeName<Partial<ICaseServiceAttrs>>(
      cleanedData,
      CASE_SERVICE.PREFIX
    );

    const caseService = await CaseServiceModel.findByIdAndUpdate(
      caseId,
      formattedData,
      { new: true }
    )
      .populate('case_customerId', '-__v')
      .populate('case_consultantId', '-__v')
      .populate('case_fingerprintTakerId', '-__v')
      .populate('case_mainCounselorId', '-__v');

    if (!caseService) {
      throw new NotFoundError('Case service not found');
    }

    return getReturnData(caseService);
  } catch (error) {
    throw error;
  }
};

const deleteCase = async (caseId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const caseService = await CaseServiceModel.findById(caseId).populate(
      'case_customerId'
    );
    if (!caseService) {
      throw new NotFoundError('Case service not found');
    }

    // Delete the case
    await CaseServiceModel.findByIdAndDelete(caseId, { session });

    // Update customer status if this was their only active case
    const customer = await CustomerModel.findById(caseService.case_customerId);
    if (customer) {
      const activeCases = await CaseServiceModel.countDocuments({
        case_customerId: customer._id,
        _id: { $ne: caseId },
      });

      if (activeCases === 0 && customer.cus_status === 'active') {
        customer.cus_status = 'completed';
        await customer.save({ session });
      }
    }

    await session.commitTransaction();
    return { success: true, message: 'Case service deleted successfully' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const deleteMultipleCases = async (caseIds: string[]) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const casesToDelete = await CaseServiceModel.find({
      _id: { $in: caseIds },
    }).populate('case_customerId');

    if (casesToDelete.length === 0) {
      throw new NotFoundError('No case services found for the provided IDs');
    }

    // Delete the cases
    await CaseServiceModel.deleteMany({ _id: { $in: caseIds } }, { session });

    // Update customer status if this was their only active case
    for (const caseService of casesToDelete) {
      const customer = await CustomerModel.findById(
        caseService.case_customerId
      );
      if (customer) {
        const activeCases = await CaseServiceModel.countDocuments({
          case_customerId: customer._id,
          _id: { $ne: caseService._id },
        });

        if (activeCases === 0 && customer.cus_status === 'active') {
          customer.cus_status = 'completed';
          await customer.save({ session });
        }
      }
    }
    await session.commitTransaction();
    return { success: true, message: 'Case services deleted successfully' };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const updateCaseProgress = async (caseId: string, progressData: any) => {
  try {
    const caseService = await CaseServiceModel.findByIdAndUpdate(
      caseId,
      progressData,
      { new: true }
    );

    if (!caseService) {
      throw new NotFoundError('Case service not found');
    }

    return getReturnData(caseService);
  } catch (error) {
    throw error;
  }
};

const updateCasePayment = async (caseId: string, paymentData: any) => {
  try {
    const caseService = await CaseServiceModel.findByIdAndUpdate(
      caseId,
      paymentData,
      { new: true }
    );

    if (!caseService) {
      throw new NotFoundError('Case service not found');
    }

    return getReturnData(caseService);
  } catch (error) {
    throw error;
  }
};

const updateProcessStatus = async (
  caseId: string,
  statusField: string,
  value: boolean
) => {
  try {
    // Validate status field
    const validStatusFields = [
      'case_isScanned',
      'case_isFullInfo',
      'case_isAnalysisSent',
      'case_isPdfExported',
      'case_isFullyPaid',
      'case_isSoftFileSent',
      'case_isPrintedAndSent',
      'case_isPhysicalCopySent',
    ];

    if (!validStatusFields.includes(statusField)) {
      throw new BadRequestError('Invalid status field');
    }

    const updateQuery = { [statusField]: value };
    const caseService = await CaseServiceModel.findByIdAndUpdate(
      caseId,
      updateQuery,
      { new: true }
    );

    if (!caseService) {
      throw new NotFoundError('Case service not found');
    }

    return getReturnData(caseService);
  } catch (error) {
    throw error;
  }
};

const assignStaff = async (caseId: string, staffData: any) => {
  try {
    const caseService = await CaseServiceModel.findByIdAndUpdate(
      caseId,
      staffData,
      { new: true }
    )
      .populate('case_consultantId', '-__v')
      .populate('case_fingerprintTakerId', '-__v')
      .populate('case_mainCounselorId', '-__v');

    if (!caseService) {
      throw new NotFoundError('Case service not found');
    }

    return getReturnData(caseService);
  } catch (error) {
    throw error;
  }
};

const getCasesByCustomer = async (customerId: string) => {
  try {
    const cases = await CaseServiceModel.find({ case_customerId: customerId })
      .populate('case_consultantId', '-__v')
      .populate('case_fingerprintTakerId', '-__v')
      .populate('case_mainCounselorId', '-__v')
      .sort({ case_date: -1 });

    return getReturnList(cases);
  } catch (error) {
    throw error;
  }
};

const searchCases = async (searchQuery: ISearchCasesQuery) => {
  try {
    const query: FilterQuery<ICaseServiceAttrs> = {};

    // Keyword search in multiple fields
    if (searchQuery.keyword) {
      query.$or = [
        {
          'case_customerId.cus_fullName': new RegExp(searchQuery.keyword, 'i'),
        },
        { case_eventLocation: new RegExp(searchQuery.keyword, 'i') },
      ];
    }

    // Date range for case creation
    if (searchQuery.dateRange) {
      query.createdAt = {
        $gte: searchQuery.dateRange.start,
        $lte: searchQuery.dateRange.end,
      };
    }

    // Customer filter
    if (searchQuery.customerId) {
      query.case_customerId = new mongoose.Types.ObjectId(
        searchQuery.customerId
      );
    }

    // Process status filters
    if (searchQuery.processStatus) {
      Object.entries(searchQuery.processStatus).forEach(([key, value]) => {
        if (value !== undefined) {
          query[`case_${key}`] = value;
        }
      });
    }

    // Payment status filter
    if (searchQuery.paymentStatus) {
      switch (searchQuery.paymentStatus) {
        case 'paid':
          query.case_isFullyPaid = true;
          break;
        case 'partial':
          query.$and = [
            { case_amountPaid: { $gt: 0 } },
            { case_isFullyPaid: false },
          ];
          break;
        case 'unpaid':
          query.$or = [
            { case_amountPaid: 0 },
            { case_amountPaid: { $exists: false } },
          ];
          break;
      }
    }

    // Staff filters
    if (searchQuery.staff) {
      if (searchQuery.staff.consultantId) {
        query.case_consultantId = new mongoose.Types.ObjectId(
          searchQuery.staff.consultantId
        );
      }
      if (searchQuery.staff.fingerprintTakerId) {
        query.case_fingerprintTakerId = new mongoose.Types.ObjectId(
          searchQuery.staff.fingerprintTakerId
        );
      }
      if (searchQuery.staff.mainCounselorId) {
        query.case_mainCounselorId = new mongoose.Types.ObjectId(
          searchQuery.staff.mainCounselorId
        );
      }
    }

    // Appointment date range
    if (searchQuery.appointmentDate) {
      query.case_date = {
        $gte: searchQuery.appointmentDate.start,
        $lte: searchQuery.appointmentDate.end,
      };
    }

    const casesResult = await CaseServiceModel.find(query)
      .populate('case_customerId', '_id cus_fullName') // Only populate minimal customer data
      .sort({ case_date: -1 });

    // Process case services to handle staff information
    const processedCases = await Promise.all(
      casesResult.map(async (caseService) => {
        const caseData = caseService.toObject();

        // Process staff information
        let consultantData = null;
        let fingerprintTakerData = null;
        let counselorData = null;

        // Get consultant employee data if ID exists
        if (caseService.case_consultantId) {
          try {
            // Fetch employee with populated user info
            const employee = await EmployeeModel.findOne({
              userId: caseService.case_consultantId,
            }).populate('userId');

            if (employee && employee.userId) {
              // Safely extract user data
              const user = employee.userId as any;
              consultantData = {
                employeeId: employee._id.toString(),
                employeeCode: employee.employeeCode,
                userId: caseService.case_consultantId.toString(),
                fullName: `${user.usr_firstName || ''} ${
                  user.usr_lastName || ''
                }`.trim(),
                email: user.usr_email,
              };
            }
          } catch (err) {
            console.error('Error fetching consultant data:', err);
          }
        }

        // Get fingerprint taker data if ID exists
        if (caseService.case_fingerprintTakerId) {
          try {
            // Fetch employee with populated user info
            const employee = await EmployeeModel.findOne({
              userId: caseService.case_fingerprintTakerId,
            }).populate('userId');

            if (employee && employee.userId) {
              // Safely extract user data
              const user = employee.userId as any;
              fingerprintTakerData = {
                employeeId: employee._id.toString(),
                employeeCode: employee.employeeCode,
                userId: caseService.case_fingerprintTakerId.toString(),
                fullName: `${user.usr_firstName || ''} ${
                  user.usr_lastName || ''
                }`.trim(),
                email: user.usr_email,
              };
            }
          } catch (err) {
            console.error('Error fetching fingerprint taker data:', err);
          }
        }

        // Get counselor data if ID exists
        if (caseService.case_mainCounselorId) {
          try {
            // Fetch employee with populated user info
            const employee = await EmployeeModel.findOne({
              userId: caseService.case_mainCounselorId,
            }).populate('userId');

            if (employee && employee.userId) {
              // Safely extract user data
              const user = employee.userId as any;
              counselorData = {
                employeeId: employee._id.toString(),
                employeeCode: employee.employeeCode,
                userId: caseService.case_mainCounselorId.toString(),
                fullName: `${user.usr_firstName || ''} ${
                  user.usr_lastName || ''
                }`.trim(),
                email: user.usr_email,
              };
            }
          } catch (err) {
            console.error('Error fetching counselor data:', err);
          }
        }

        return {
          ...caseData,
          case_consultant: consultantData,
          case_fingerprintTaker: fingerprintTakerData,
          case_counselor: counselorData,
          // Keep the legacy fields for backward compatibility but populate them with data from the objects if available
          case_consultantName: consultantData
            ? consultantData.fullName
            : caseData.case_consultantName || '',
          case_fingerprintTakerName: fingerprintTakerData
            ? fingerprintTakerData.fullName
            : caseData.case_fingerprintTakerName || '',
          case_counselorName: counselorData
            ? counselorData.fullName
            : caseData.case_counselorName || '',
          case_processStatus: {
            isScanned: caseService.case_isScanned,
            isFullInfo: caseService.case_isFullInfo,
            isAnalysisSent: caseService.case_isAnalysisSent,
            isPdfExported: caseService.case_isPdfExported,
            isFullyPaid: caseService.case_isFullyPaid,
            isSoftFileSent: caseService.case_isSoftFileSent,
            isPrinted: caseService.case_isPrintedAndSent,
            isPhysicalCopySent: caseService.case_isPhysicalCopySent,
            isDeepConsulted: caseService.case_isDeepConsulted,
          },
        };
      })
    );

    return processedCases;
  } catch (error) {
    throw error;
  }
};

// Hàm để lấy tất cả case services trực tiếp từ database
const getAllCaseServices = async () => {
  try {
    // Truy vấn trực tiếp database không qua filter
    const allCasesResult = await CaseServiceModel.find()
      .populate('case_customerId', '_id cus_fullName') // Only populate minimal customer data
      .sort({ createdAt: -1 });

    // Đếm tổng số case services
    const total = await CaseServiceModel.countDocuments();

    // Process case services to handle staff information
    const processedCases = await Promise.all(
      allCasesResult.map(async (caseService) => {
        const caseData = caseService.toObject();

        // Process staff information
        let consultantData = null;
        let fingerprintTakerData = null;
        let counselorData = null;

        // Get consultant employee data if ID exists
        if (caseService.case_consultantId) {
          try {
            // Fetch employee with populated user info
            const employee = await EmployeeModel.findOne({
              userId: caseService.case_consultantId,
            }).populate('userId');

            if (employee && employee.userId) {
              // Safely extract user data
              const user = employee.userId as any;
              consultantData = {
                employeeId: employee._id.toString(),
                employeeCode: employee.employeeCode,
                userId: caseService.case_consultantId.toString(),
                fullName: `${user.usr_firstName || ''} ${
                  user.usr_lastName || ''
                }`.trim(),
                email: user.usr_email,
              };
            }
          } catch (err) {
            console.error('Error fetching consultant data:', err);
          }
        }

        // Get fingerprint taker data if ID exists
        if (caseService.case_fingerprintTakerId) {
          try {
            // Fetch employee with populated user info
            const employee = await EmployeeModel.findOne({
              userId: caseService.case_fingerprintTakerId,
            }).populate('userId');

            if (employee && employee.userId) {
              // Safely extract user data
              const user = employee.userId as any;
              fingerprintTakerData = {
                employeeId: employee._id.toString(),
                employeeCode: employee.employeeCode,
                userId: caseService.case_fingerprintTakerId.toString(),
                fullName: `${user.usr_firstName || ''} ${
                  user.usr_lastName || ''
                }`.trim(),
                email: user.usr_email,
              };
            }
          } catch (err) {
            console.error('Error fetching fingerprint taker data:', err);
          }
        }

        // Get counselor data if ID exists
        if (caseService.case_mainCounselorId) {
          try {
            // Fetch employee with populated user info
            const employee = await EmployeeModel.findOne({
              userId: caseService.case_mainCounselorId,
            }).populate('userId');

            if (employee && employee.userId) {
              // Safely extract user data
              const user = employee.userId as any;
              counselorData = {
                employeeId: employee._id.toString(),
                employeeCode: employee.employeeCode,
                userId: caseService.case_mainCounselorId.toString(),
                fullName: `${user.usr_firstName || ''} ${
                  user.usr_lastName || ''
                }`.trim(),
                email: user.usr_email,
              };
            }
          } catch (err) {
            console.error('Error fetching counselor data:', err);
          }
        }

        return {
          ...caseData,
          case_consultant: consultantData,
          case_fingerprintTaker: fingerprintTakerData,
          case_counselor: counselorData,
          // Keep the legacy fields for backward compatibility but populate them with data from the objects if available
          case_consultantName: consultantData
            ? consultantData.fullName
            : caseData.case_consultantName || '',
          case_fingerprintTakerName: fingerprintTakerData
            ? fingerprintTakerData.fullName
            : caseData.case_fingerprintTakerName || '',
          case_counselorName: counselorData
            ? counselorData.fullName
            : caseData.case_counselorName || '',
          case_processStatus: {
            isScanned: caseService.case_isScanned,
            isFullInfo: caseService.case_isFullInfo,
            isAnalysisSent: caseService.case_isAnalysisSent,
            isPdfExported: caseService.case_isPdfExported,
            isFullyPaid: caseService.case_isFullyPaid,
            isSoftFileSent: caseService.case_isSoftFileSent,
            isPrinted: caseService.case_isPrintedAndSent,
            isPhysicalCopySent: caseService.case_isPhysicalCopySent,
            isDeepConsulted: caseService.case_isDeepConsulted,
          },
        };
      })
    );

    return {
      data: processedCases,
      total: total,
      message: 'Retrieved all case services directly from database',
    };
  } catch (error) {
    throw error;
  }
};

const getStartEndDate = (type = 'daily', date?: string) => {
  const dateObj = date ? new Date(date) : new Date();
  let startDate, endDate;

  try {
    const day = dateObj.getDate(); // Get the current day of the month
    const month = dateObj.getMonth(); // Get the current month (1-12)
    const year = dateObj.getFullYear(); // Get the current year

    switch (type) {
      case 'weekly':
        startDate = getFirstWeekDate(day, month, year);
        endDate = getLastWeekDate(day, month, year);
        break;

      case 'monthly':
        startDate = getFirstMonthDate(month, year);
        endDate = getLastMonthDate(month, year);
        break;

      // default value is today
      case 'daily':
      default:
        startDate = new Date(dateObj);
        startDate.setHours(0, 0, 0, 0); // Set to the start of the day
        endDate = new Date(dateObj);
        endDate.setHours(23, 59, 59, 999); // Set to the end of the day
        break;
    }
  } catch (error) {
    console.error('Error in getStartEndDate:', error);
    // error parsing date => use today
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // Set to the end of the day
  }

  return { startDate, endDate };
};

interface ReportIndex {
  date?: string;
  eventLocation?: string;
  partner?: string;
  revenue: number; // Number of cases sold
  actualIncome: number; // Amount customers have paid
  debt: number; // Revenue - Actual income
}

const getCaseStatistics = async ({
  type,
  date,
  groupBy = 'date',
}: {
  type: string;
  date: string;
  groupBy: string;
}): Promise<ReportIndex[]> => {
  const { startDate, endDate } = getStartEndDate(type, date);

  const groupName = groupBy || 'date';
  let groupOption;

  switch (groupName) {
    case 'eventLocation':
      groupOption = {
        $toLower: '$case_eventLocation',
      };
      break;

    case 'partner':
      groupOption = {
        $toLower: '$case_partner',
      };
      break;

    case 'date':
    default:
      groupOption =
        type === 'daily'
          ? {
              $dateToString: {
                format: '%Y-%m-%d %H:00:00 GMT+7',
                date: '$case_appointmentDate',
              },
            }
          : {
              $dateToString: {
                format: '%Y-%m-%d 00:00:00 GMT+7',
                date: '$case_appointmentDate',
              },
            };
      break;
  }

  // Aggregate the data for the date range
  const result = await CaseServiceModel.aggregate([
    {
      $match: {
        case_appointmentDate: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $group: {
        _id: groupOption,
        revenue: { $sum: '$case_price' }, // Count the number of cases sold (number of documents)
        actualIncome: { $sum: '$case_amountPaid' }, // Sum of amount paid
        debt: { $sum: { $subtract: ['$case_price', '$case_amountPaid'] } }, // Revenue - Amount paid
      },
    },
    {
      $project: {
        [groupName]: '$_id',
        revenue: 1,
        actualIncome: 1,
        debt: 1,
        _id: 0,
      },
    },
    {
      $sort: { [groupName]: 1 }, // Sort by date in ascending order
    },
  ]);

  return result.map((entry) => ({
    [groupName]: entry[groupName],
    revenue: entry.revenue,
    actualIncome: entry.actualIncome,
    debt: entry.debt,
  }));
};

const getCaseRevenue = async (type?: string, date?: string) => {
  const { startDate, endDate } = getStartEndDate(type, date);

  const result = await CaseServiceModel.aggregate([
    {
      $match: {
        case_appointmentDate: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$case_price' },
      },
    },
  ]);

  return result[0]?.totalRevenue || 0;
};

const getCaseDebt = async (type?: string, date?: string) => {
  const { startDate, endDate } = getStartEndDate(type, date);

  const result = await CaseServiceModel.aggregate([
    {
      $match: {
        case_appointmentDate: { $gte: startDate, $lt: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$case_price' },
        totalPaid: { $sum: '$case_amountPaid' },
      },
    },
    {
      $addFields: {
        totalDebt: { $subtract: ['$totalRevenue', '$totalPaid'] },
      },
    },
  ]);

  return result[0]?.totalDebt || 0;
};

const getCaseUniqueCustomers = async (month: number) => {
  const now = new Date();
  const firstMonthDate = getFirstMonthDate(month, now.getFullYear());
  const lastMonthDate = getLastMonthDate(month, now.getFullYear());

  const result = await CaseServiceModel.aggregate([
    {
      $match: {
        case_appointmentDate: { $gte: firstMonthDate, $lt: lastMonthDate },
      },
    },
    {
      $group: {
        _id: '$case_customerId',
      },
    },
    {
      $count: 'uniqueCustomers',
    },
  ]);

  return result[0]?.uniqueCustomers || 0;
};

export {
  createCase,
  getCases,
  getCaseById,
  updateCase,
  deleteCase,
  deleteMultipleCases,
  updateCaseProgress,
  updateCasePayment,
  updateProcessStatus,
  assignStaff,
  getCasesByCustomer,
  searchCases,
  getAllCaseServices,
  getCaseStatistics,
  getCaseRevenue,
  getCaseDebt,
  getCaseUniqueCustomers,
};
