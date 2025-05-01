import { NotFoundError, BadRequestError } from '../core/errors';
import { CustomerModel } from '../models/customer.model';
import { CaseServiceModel } from '../models/caseService.model';
import { EmployeeModel } from '../models/employee.model';
import {
  ICustomerAttrs,
  IPaginationOptions,
  IRawCustomer,
  ICSVRow,
  IImportResult,
  ICustomerStatisticsQuery,
  ICustomerInteractionInput,
  ICustomerSearchQuery,
  ICustomerWithCaseService,
} from '../interfaces/customer.interface';
import { ICaseServiceAttrs } from '../interfaces/caseService.interface';
import {
  getReturnData,
  getReturnList,
  removeNestedNullish,
} from '@utils/index';
import { CUSTOMER } from '../constants';
import { formatAttributeName } from '../utils';
import { FilterQuery, UpdateQuery } from 'mongoose';
import mongoose from 'mongoose';
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';

// Add this type guard function at the top of the file
const isErrorWithDetails = (
  error: unknown
): error is Error & { errors?: unknown } => {
  return error instanceof Error && 'errors' in error;
};

// Enhanced createCustomer method to support creating customer with case service
const createCustomer = async (customerData: ICustomerAttrs) => {
  // Start a transaction for atomic operations
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Create the customer first
    const formattedCustomerData = formatAttributeName(
      customerData,
      CUSTOMER.PREFIX
    );
    const [customer] = await CustomerModel.create([formattedCustomerData], {
      session,
    });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Return the created customer
    return getReturnData(customer);
  } catch (error) {
    // Rollback the transaction if there's an error
    await session.abortTransaction();
    session.endSession();

    console.error('Error creating customer with case service:', error);

    // Handle validation errors with more details
    if (isErrorWithDetails(error) && error.errors) {
      const errorMessage = Object.values(error.errors)
        .map((err: any) => err.message)
        .join(', ');
      throw new BadRequestError(`Validation error: ${errorMessage}`);
    }

    throw error;
  }
};

const getCustomers = async (
  query: any = {},
  options: IPaginationOptions = {}
) => {
  try {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await CustomerModel.countDocuments(query);

    // Get paginated results - đã loại bỏ populate không cần thiết
    const customers = await CustomerModel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    return {
      data: getReturnList(customers),
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

const getCustomerById = async (customerId: string) => {
  try {
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }
    return getReturnData(customer);
  } catch (error) {
    throw error;
  }
};

const updateCustomer = async (
  customerId: string,
  customerData: Partial<ICustomerAttrs>
) => {
  try {
    // Remove null and undefined values
    const cleanedData = removeNestedNullish(customerData) as Record<
      string,
      any
    >;

    // Format data with prefix
    const formattedData = formatAttributeName(cleanedData, CUSTOMER.PREFIX);

    const customer = await CustomerModel.findByIdAndUpdate(
      customerId,
      { $set: formattedData },
      { new: true }
    );

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return getReturnData(customer);
  } catch (error) {
    throw error;
  }
};

const deleteCustomer = async (customerId: string) => {
  return deleteMultipleCustomers([customerId]);
};

const deleteMultipleCustomers = async (customerIds: string[]) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Kiểm tra tất cả customer có tồn tại không
    const customers = await CustomerModel.find({ _id: { $in: customerIds } });
    if (customers.length !== customerIds.length) {
      throw new NotFoundError('One or more customers not found');
    }

    // Xóa tất cả case-services liên quan
    await CaseServiceModel.deleteMany(
      { case_customerId: { $in: customerIds } },
      { session }
    );

    // Xóa tất cả customers
    const result = await CustomerModel.deleteMany(
      { _id: { $in: customerIds } },
      { session }
    );

    await session.commitTransaction();
    return {
      success: true,
      message: `Successfully deleted ${result.deletedCount} customers and their related case services`,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const searchCustomers = async (searchQuery: ICustomerSearchQuery) => {
  try {
    const query: FilterQuery<IRawCustomer> = {};

    // Keyword search in multiple fields
    if (searchQuery.keyword) {
      query.$or = [
        { cus_fullName: new RegExp(searchQuery.keyword, 'i') },
        { cus_parentName: new RegExp(searchQuery.keyword, 'i') },
        { cus_phone: new RegExp(searchQuery.keyword, 'i') },
        { cus_email: new RegExp(searchQuery.keyword, 'i') },
        { cus_address: new RegExp(searchQuery.keyword, 'i') },
      ];
    }

    // Date range
    if (searchQuery.dateRange) {
      query.createdAt = {
        $gte: searchQuery.dateRange.start,
        $lte: searchQuery.dateRange.end,
      };
    }

    // Status filter
    if (searchQuery.status && searchQuery.status.length > 0) {
      query.cus_status = { $in: searchQuery.status };
    }

    // Type filter
    if (searchQuery.type && searchQuery.type.length > 0) {
      query.cus_type = { $in: searchQuery.type };
    }

    // Source filter
    if (searchQuery.source && searchQuery.source.length > 0) {
      query.cus_source = { $in: searchQuery.source };
    }

    // Staff filter - staff assignments are now in CaseServiceModel
    // We need to do a lookup with CaseServiceModel if staff filtering is needed

    const customers = await CustomerModel.find(query).sort({ createdAt: -1 });

    return getReturnList(customers);
  } catch (error) {
    throw error;
  }
};

const getCustomerStatistics = async (query: ICustomerStatisticsQuery) => {
  try {
    const matchStage: any = {};
    if (query.dateRange) {
      matchStage.createdAt = {
        $gte: query.dateRange.start,
        $lte: query.dateRange.end,
      };
    }

    let groupStage: any = {};
    let lookupStage: any[] = [];

    switch (query.groupBy) {
      case 'status':
        groupStage = {
          _id: '$cus_status',
          count: { $sum: 1 },
        };
        break;

      case 'type':
        groupStage = {
          _id: '$cus_type',
          count: { $sum: 1 },
        };
        break;

      case 'source':
        groupStage = {
          _id: '$cus_source',
          count: { $sum: 1 },
        };
        break;

      case 'staff':
        // This now needs to join with CaseServiceModel to get staff information
        lookupStage = [
          {
            $lookup: {
              from: 'case_services',
              localField: '_id',
              foreignField: 'case_customerId',
              as: 'caseServices',
            },
          },
          {
            $unwind: {
              path: '$caseServices',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: 'employees',
              localField: 'caseServices.case_consultantId',
              foreignField: '_id',
              as: 'consultant',
            },
          },
          {
            $unwind: {
              path: '$consultant',
              preserveNullAndEmptyArrays: true,
            },
          },
        ];
        groupStage = {
          _id: '$consultant._id',
          staffName: { $first: '$consultant.emp_fullName' },
          customerCount: { $sum: 1 },
        };
        break;
    }

    const pipeline = [
      { $match: matchStage },
      ...lookupStage,
      { $group: groupStage },
      { $sort: { count: -1 } },
    ];

    const statistics = await CustomerModel.aggregate(pipeline);

    // For revenue information, we need to query the CaseServiceModel
    let totalRevenue = 0;
    let averageRevenue = 0;

    if (['status', 'type', 'source', 'staff'].includes(query.groupBy)) {
      const revenuePipeline = [
        {
          $lookup: {
            from: 'customers',
            localField: 'case_customerId',
            foreignField: '_id',
            as: 'customer',
          },
        },
        {
          $unwind: '$customer',
        },
        {
          $match: matchStage,
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$case_amountPaid' },
            count: { $sum: 1 },
          },
        },
      ];

      const revenueData = await CaseServiceModel.aggregate(revenuePipeline);

      if (revenueData.length > 0) {
        totalRevenue = revenueData[0].totalRevenue || 0;
        averageRevenue =
          revenueData[0].count > 0 ? totalRevenue / revenueData[0].count : 0;
      }
    }

    return {
      success: true,
      data: statistics,
      summary: {
        totalCustomers: statistics.reduce(
          (sum, item) => sum + (item.count || item.customerCount || 0),
          0
        ),
        totalRevenue,
        averageRevenue,
      },
    };
  } catch (error) {
    throw error;
  }
};

const addCustomerInteraction = async (
  customerId: string,
  interaction: {
    type: 'call' | 'message' | 'meeting' | 'email' | 'other';
    notes?: string;
    staff?: string;
  }
) => {
  try {
    const customer = await CustomerModel.findByIdAndUpdate(
      customerId,
      {
        $push: {
          cus_interactions: {
            date: new Date(),
            type: interaction.type,
            notes: interaction.notes,
            staff: interaction.staff,
          },
        },
      },
      { new: true }
    );

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return getReturnData(customer);
  } catch (error) {
    throw error;
  }
};

const parseCSVRow = (row: string[]): ICSVRow => {
  // Convert '1' to true, empty string to false
  const convertToBoolean = (value: string): boolean => {
    return value === '1';
  };

  // Clean price values (remove currency symbols and commas)
  const cleanPrice = (value: string): string => {
    if (!value) return '0';
    return value.replace(/[^\d]/g, '');
  };

  // Parse percentage value
  const parsePercentage = (value: string): string => {
    if (!value) return '0';

    // Nếu đã có dấu % (ví dụ: "100%")
    if (value.includes('%')) {
      // Loại bỏ dấu % và chuyển thành chuỗi số
      const percentage = parseInt(value.replace('%', ''));
      return isNaN(percentage) ? '0' : percentage.toString();
    }

    // Nếu là một số hợp lệ
    const numberValue = parseInt(value);
    if (!isNaN(numberValue)) {
      return numberValue.toString();
    }

    return '0';
  };

  // Get value from row or empty string if undefined
  const getValue = (index: number): string => {
    return row[index]?.trim() || '';
  };

  return {
    // Skip index 0 which is likely a row number or empty column
    date: getValue(1),
    partner: getValue(2), // Column C: ĐỐI TÁC
    eventLocation: getValue(3), // Column D: ĐỊA ĐIỂM SỰ KIỆN
    customerName: getValue(4),
    customerDOB: getValue(5),
    gender: getValue(6),
    parentName: getValue(7),
    parentDOB: getValue(8),
    phone: getValue(9),
    address: getValue(10),
    email: getValue(11),
    price: cleanPrice(getValue(12)),
    paidAmount: cleanPrice(getValue(13)),
    debt: cleanPrice(getValue(14)),
    paymentMethod: getValue(15),
    consultant: getValue(16),
    fingerprintTaker: getValue(17),
    scanLocation: getValue(18),
    isFullInfo: convertToBoolean(getValue(19)),
    isAnalysisSent: convertToBoolean(getValue(20)),
    isPdfExported: convertToBoolean(getValue(21)),
    isFullyPaid: convertToBoolean(getValue(22)),
    isSoftFileSent: convertToBoolean(getValue(23)),
    isPrintedAndSent: convertToBoolean(getValue(24)),
    isPhysicalCopySent: convertToBoolean(getValue(25)),
    isDeepConsulted: convertToBoolean(getValue(26)),
    consultationNote: getValue(27),
    counselor: getValue(28),
    progressPercent: parsePercentage(getValue(29)),
    contactChannel: getValue(30),
    contactAccount: getValue(31),
    additionalNote: getValue(32),
  };
};

const convertPriceToNumber = (price: string): number => {
  if (!price) return 0;

  // Check for special free/gift cases
  if (
    price.toLowerCase().includes('tặng') ||
    price.toLowerCase().includes('free') ||
    price.toLowerCase().includes('khuyến mãi') ||
    price.toLowerCase().includes('0đ')
  ) {
    return 0;
  }

  // Extract numbers without complex formatting
  const numbers = price.replace(/[^\d]/g, '');
  return numbers ? parseInt(numbers) : 0;
};

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;

  // Try to parse the date in various formats
  try {
    // Try DD/MM/YYYY format
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const year = parseInt(parts[2]);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Try YYYY-MM-DD format
    const isoParts = dateStr.split('-');
    if (isoParts.length === 3) {
      const year = parseInt(isoParts[0]);
      const month = parseInt(isoParts[1]) - 1;
      const day = parseInt(isoParts[2]);

      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Try direct parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (error) {
    console.log(`Error parsing date: ${dateStr}`, error);
  }

  // If all parsing attempts fail, return null
  return null;
};

const getPaymentMethod = (
  method: string
): 'cash' | 'transfer' | 'card' | 'other' => {
  if (!method) return 'other';
  const normalizedMethod = method.toLowerCase();
  if (['cash', 'transfer', 'card'].includes(normalizedMethod)) {
    return normalizedMethod as 'cash' | 'transfer' | 'card';
  }
  return 'other';
};

const normalizeGender = (gender: string): string => {
  if (!gender) return 'other';
  const normalizedGender = gender.toLowerCase();

  // Map Vietnamese gender values to English
  if (normalizedGender === 'nam') return 'male';
  if (normalizedGender === 'nữ') return 'female';

  // Check for other valid values
  if (['male', 'female', 'other'].includes(normalizedGender)) {
    return normalizedGender;
  }

  return 'other';
};

const importCustomersFromCSV = async (
  csvData: string[][]
): Promise<IImportResult> => {
  const errors: string[] = [];
  let importedCustomers = 0;
  let importedCaseServices = 0;
  let skippedRows = 0;
  let validationErrors = 0;

  try {
    console.log('Starting CSV import process...');
    console.log(`Total rows to process: ${csvData.length - 1}`); // Excluding header

    // Skip header and summary rows
    const customersToImport = [];
    const caseServicesToImport = [];
    const customerMap = new Map<string, string>(); // Maps customer name to MongoDB ID

    // Process each row
    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];

      // Skip empty rows or rows that don't have enough data
      if (!row || row.length < 5) {
        skippedRows++;
        continue;
      }

      // Skip summary rows (that contain "THÁNG")
      if (
        row.some(
          (cell) => cell && typeof cell === 'string' && cell.includes('THÁNG')
        )
      ) {
        skippedRows++;
        continue;
      }

      try {
        const data = parseCSVRow(row);

        // Skip if no customer name
        if (!data.customerName) {
          console.log(`Skipping row ${i}: No customer name`);
          skippedRows++;
          continue;
        }

        // Create a unique MongoDB ID for this customer
        const customerId = new mongoose.Types.ObjectId();
        customerMap.set(data.customerName, customerId.toString());

        // Prepare customer data
        const customerData: any = {
          _id: customerId,
          cus_fullName: data.customerName,
          cus_dateOfBirth: parseDate(data.customerDOB),
          cus_gender: normalizeGender(data.gender),
          cus_parentName: data.parentName || '',
          cus_parentDateOfBirth: parseDate(data.parentDOB),
          cus_phone: data.phone || '',
          cus_email: data.email || '',
          cus_address: data.address || '',
          cus_contactChannel: data.contactChannel?.toLowerCase() || 'other',
          cus_contactAccountName: data.contactAccount || '',
          cus_status: 'active',
          cus_type: 'regular',
          cus_source: 'direct',
          cus_price: parseInt(data.price) || 0,
          cus_paidAmount: parseInt(data.paidAmount) || 0,
          cus_remainingAmount: parseInt(data.debt) || 0,
          cus_paymentMethod: getPaymentMethod(data.paymentMethod),
          cus_processStatus: {
            isScanned:
              data.scanLocation === 'Tại sự kiện' ||
              data.scanLocation === 'Tại nhà',
            isFullInfo: data.isFullInfo,
            isAnalysisSent: data.isAnalysisSent,
            isPdfExported: data.isPdfExported,
            isSoftFileSent: data.isSoftFileSent,
            isPrinted: data.isPrintedAndSent,
            isPhysicalCopySent: data.isPhysicalCopySent,
            isDeepConsulted: data.isDeepConsulted,
          },
          cus_progressPercent: data.progressPercent,
          cus_consultationNote: data.consultationNote || '',
          cus_note: data.additionalNote || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        customersToImport.push(customerData);

        // Prepare case service data - Đảm bảo tất cả các trường bắt buộc
        const caseServiceData: any = {
          _id: new mongoose.Types.ObjectId(),
          case_customerId: customerId,
          case_eventLocation: data.eventLocation || 'Unknown',
          case_partner: data.partner || '',
          case_appointmentDate: parseDate(data.date) || new Date(),
          case_price: parseInt(data.price) || 0,
          case_amountPaid: parseInt(data.paidAmount) || 0,
          case_debt: parseInt(data.debt) || 0,
          case_paymentMethod: getPaymentMethod(data.paymentMethod),
          case_isScanned:
            data.scanLocation === 'Tại sự kiện' ||
            data.scanLocation === 'Tại nhà',
          case_isFullInfo: data.isFullInfo,
          case_isAnalysisSent: data.isAnalysisSent,
          case_isPdfExported: data.isPdfExported,
          case_isFullyPaid: data.isFullyPaid,
          case_isSoftFileSent: data.isSoftFileSent,
          case_isPrintedAndSent: data.isPrintedAndSent,
          case_isPhysicalCopySent: data.isPhysicalCopySent,
          case_isDeepConsulted: data.isDeepConsulted,
          case_progressNote: data.consultationNote || '',
          case_progressPercent: parseInt(data.progressPercent) || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Log về case service đang được tạo cho mục đích debug
        if (i % 100 === 0) {
          console.log(
            `Creating case service for customer [${i}]: ${data.customerName}`
          );
          console.log(
            `Case service data: ${JSON.stringify(caseServiceData, null, 2)}`
          );
        }

        caseServicesToImport.push(caseServiceData);
      } catch (error) {
        console.error(`Error processing row ${i}:`, error);
        errors.push(
          `Row ${i}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    console.log(
      `Processed rows - Valid customers: ${customersToImport.length}, Case services: ${caseServicesToImport.length}, Skipped: ${skippedRows}`
    );

    // Delete existing data first
    console.log('Deleting existing data...');
    await CaseServiceModel.deleteMany({});
    await CustomerModel.deleteMany({});

    // Insert all customers in bulk
    if (customersToImport.length > 0) {
      console.log(`Importing ${customersToImport.length} customers...`);
      const customerResult = await CustomerModel.insertMany(customersToImport, {
        ordered: false,
      });
      importedCustomers = customerResult.length;
      console.log(`Successfully imported ${importedCustomers} customers`);
    }

    // Insert all case services in bulk
    if (caseServicesToImport.length > 0) {
      console.log(`Importing ${caseServicesToImport.length} case services...`);
      try {
        // Kiểm tra xem có đúng số lượng case services so với customers?
        if (caseServicesToImport.length !== customersToImport.length) {
          console.warn(
            `WARNING: Number of case services (${caseServicesToImport.length}) does not match number of customers (${customersToImport.length})`
          );
        }

        // Thử validate một vài case services trước khi import
        console.log('Validating sample case services...');
        for (let i = 0; i < Math.min(5, caseServicesToImport.length); i++) {
          const sample = caseServicesToImport[i];
          const model = new CaseServiceModel(sample);
          try {
            await model.validate();
            console.log(`Sample ${i + 1} is valid`);
          } catch (validationError) {
            console.error(
              `Sample ${i + 1} validation failed:`,
              validationError
            );
            throw validationError;
          }
        }

        // Import case services với từng batch nhỏ để tránh lỗi
        const BATCH_SIZE = 100;
        const batches = Math.ceil(caseServicesToImport.length / BATCH_SIZE);

        for (let b = 0; b < batches; b++) {
          const start = b * BATCH_SIZE;
          const end = Math.min(
            (b + 1) * BATCH_SIZE,
            caseServicesToImport.length
          );
          const batch = caseServicesToImport.slice(start, end);

          console.log(
            `Importing batch ${b + 1}/${batches} (${start}-${end - 1})`
          );
          try {
            const result = await CaseServiceModel.insertMany(batch, {
              ordered: false,
            });
            importedCaseServices += result.length;
            console.log(
              `Batch ${b + 1}: Successfully imported ${
                result.length
              } case services`
            );
          } catch (batchError) {
            console.error(`Error in batch ${b + 1}:`, batchError);

            // Thử import từng document trong batch
            console.log(`Trying individual imports for batch ${b + 1}...`);
            for (const doc of batch) {
              try {
                await CaseServiceModel.create(doc);
                importedCaseServices++;
              } catch (docError) {
                console.error(
                  `Failed to import case service for customer ${doc.case_customerId}:`,
                  docError
                );
                validationErrors++;
              }
            }
          }
        }

        console.log(
          `Successfully imported ${importedCaseServices} case services in total`
        );
      } catch (error) {
        console.error('Error importing case services:', error);
        errors.push(
          `Error importing case services: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );

        // Try inserting case services one by one to see which ones fail
        console.log('Attempting to import case services individually...');
        for (const caseService of caseServicesToImport) {
          try {
            await CaseServiceModel.create(caseService);
            importedCaseServices++;
          } catch (csError) {
            console.error(
              `Error importing case service for customer ${caseService.case_customerId}:`,
              csError
            );
            errors.push(
              `Error importing case service: ${
                csError instanceof Error ? csError.message : 'Unknown error'
              }`
            );
            validationErrors++;
          }
        }
      }
    }

    // Final verification
    const actualCustomerCount = await CustomerModel.countDocuments();
    const actualCaseServiceCount = await CaseServiceModel.countDocuments();

    console.log(
      `Final verification - Customers: ${actualCustomerCount}, Case services: ${actualCaseServiceCount}, Validation errors: ${validationErrors}`
    );

    return {
      success: true,
      imported: actualCustomerCount,
      caseServices: actualCaseServiceCount,
      errors,
    };
  } catch (error) {
    console.error('Import failed:', error);

    // Get actual counts even in case of error
    const actualCustomerCount = await CustomerModel.countDocuments();
    const actualCaseServiceCount = await CaseServiceModel.countDocuments();

    return {
      success: false,
      imported: actualCustomerCount,
      caseServices: actualCaseServiceCount,
      errors: [
        ...errors,
        `Import failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      ],
    };
  }
};

const deleteAllImportedData = async (): Promise<{
  success: boolean;
  deletedCount: number;
}> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete all case services first (due to foreign key constraints)
    const caseServiceResult = await CaseServiceModel.deleteMany(
      {},
      { session }
    );

    // Then delete all customers
    const customerResult = await CustomerModel.deleteMany({}, { session });

    await session.commitTransaction();

    return {
      success: true,
      deletedCount: customerResult.deletedCount,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const importCustomersFromCSVBulk = async (
  csvData: string[][]
): Promise<IImportResult> => {
  return importCustomersFromCSV(csvData);
};

// Modified import function to handle the separation of customer and case service data
const importCustomersOneByOne = async (
  csvData: string[][]
): Promise<IImportResult> => {
  const errors: string[] = [];
  let importedCustomers = 0;
  let importedCaseServices = 0;
  let skippedRows = 0;

  try {
    console.log('Starting sequential CSV import process...');
    console.log(`Total rows to process: ${csvData.length - 1}`); // Excluding header

    // Xoá dữ liệu cũ trước khi import
    console.log('Deleting existing data...');
    await CaseServiceModel.deleteMany({});
    await CustomerModel.deleteMany({});

    // Process each row (bắt đầu từ 1 để bỏ qua header)
    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];

      // Skip empty rows or rows that don't have enough data
      if (!row || row.length < 5) {
        skippedRows++;
        continue;
      }

      // Skip summary rows (that contain "THÁNG")
      if (
        row.some(
          (cell) => cell && typeof cell === 'string' && cell.includes('THÁNG')
        )
      ) {
        skippedRows++;
        continue;
      }

      try {
        const data = parseCSVRow(row);

        // Skip if no customer name
        if (!data.customerName) {
          console.log(`Skipping row ${i}: No customer name`);
          skippedRows++;
          continue;
        }

        // Sử dụng transaction để đảm bảo tính toàn vẹn
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // Tạo customer data (chỉ với các trường thuộc về customer)
          const customerData = {
            fullName: data.customerName,
            dateOfBirth: parseDate(data.customerDOB) || new Date(),
            gender: normalizeGender(data.gender),
            parentName: data.parentName || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            contactChannel: data.contactChannel?.toLowerCase() || 'other',
            contactAccountName: data.contactAccount || '',
            status: 'active',
            type: 'regular',
            source: 'direct',
            serviceLocation: data.scanLocation || '',
            note: data.additionalNote || '',
          };

          // Tạo khách hàng trong transaction
          const formattedCustomerData = formatAttributeName(
            customerData,
            CUSTOMER.PREFIX
          );
          const customer = await CustomerModel.create([formattedCustomerData], {
            session,
          });
          importedCustomers++;

          if (i % 100 === 0 || i === csvData.length - 1) {
            console.log(`Imported ${importedCustomers} customers so far...`);
          }

          // Tạo case service với đầy đủ thông tin thanh toán và tiến độ
          const caseData = {
            customerId: customer[0]._id,
            eventLocation: data.eventLocation || '',
            partner: data.partner || '',
            appointmentDate: parseDate(data.date) || new Date(),
            price: parseInt(data.price) || 0,
            amountPaid: parseInt(data.paidAmount) || 0,
            paymentMethod: data.paymentMethod || '',
            consultantName: data.consultant || '',
            fingerprintTakerName: data.fingerprintTaker || '',
            counselorName: data.counselor || '',
            scanLocation: data.scanLocation || '',
            isScanned:
              data.scanLocation === 'Tại sự kiện' ||
              data.scanLocation === 'Tại nhà',
            isFullInfo: data.isFullInfo,
            isAnalysisSent: data.isAnalysisSent,
            isPdfExported: data.isPdfExported,
            isFullyPaid: data.isFullyPaid,
            isSoftFileSent: data.isSoftFileSent,
            isPrintedAndSent: data.isPrintedAndSent,
            isPhysicalCopySent: data.isPhysicalCopySent,
            isDeepConsulted: data.isDeepConsulted,
            progressNote: data.consultationNote || '',
            progressPercent: parseInt(data.progressPercent) || 0,
          };

          // Tạo case service trong cùng transaction
          const formattedCaseData = formatAttributeName(caseData, 'case_');
          await CaseServiceModel.create([formattedCaseData], { session });
          importedCaseServices++;

          if (i % 100 === 0 || i === csvData.length - 1) {
            console.log(
              `Imported ${importedCaseServices} case services so far...`
            );
          }

          // Commit transaction
          await session.commitTransaction();
          session.endSession();
        } catch (transactionError) {
          // Rollback transaction nếu có lỗi
          await session.abortTransaction();
          session.endSession();
          throw transactionError;
        }
      } catch (error) {
        console.error(`Error processing row ${i}:`, error);
        errors.push(
          `Row ${i}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    // Final verification
    const actualCustomerCount = await CustomerModel.countDocuments();
    const actualCaseServiceCount = await CaseServiceModel.countDocuments();

    console.log(
      `Import completed - Customers: ${actualCustomerCount}, Case services: ${actualCaseServiceCount}`
    );
    console.log(
      `Import statistics - Processed: ${
        csvData.length - 1
      }, Skipped: ${skippedRows}, Errors: ${errors.length}`
    );

    // Nếu có sự khác biệt, thử sửa
    if (actualCustomerCount !== actualCaseServiceCount) {
      console.log(
        `Phát hiện sự khác biệt giữa số lượng customers (${actualCustomerCount}) và case services (${actualCaseServiceCount})`
      );
      console.log('Đang thử sửa chữa...');

      const repairResult = await repairCaseServices();
      console.log(
        `Đã sửa ${repairResult.fixed} case services, tổng số case services hiện tại: ${repairResult.total}`
      );

      return {
        success: true,
        imported: actualCustomerCount,
        caseServices: repairResult.total,
        errors,
      };
    }

    return {
      success: true,
      imported: actualCustomerCount,
      caseServices: actualCaseServiceCount,
      errors,
    };
  } catch (error) {
    console.error('Import failed:', error);

    // Get actual counts even in case of error
    const actualCustomerCount = await CustomerModel.countDocuments();
    const actualCaseServiceCount = await CaseServiceModel.countDocuments();

    return {
      success: false,
      imported: actualCustomerCount,
      caseServices: actualCaseServiceCount,
      errors: [
        ...errors,
        `Import failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      ],
    };
  }
};

// Update the repair function to create missing case services for customers
const repairCaseServices = async (): Promise<{
  fixed: number;
  total: number;
}> => {
  try {
    console.log('Bắt đầu kiểm tra và sửa case services...');

    // Lấy tất cả khách hàng
    const customers = await CustomerModel.find({});
    console.log(`Tìm thấy ${customers.length} khách hàng`);

    // Lấy tất cả case services hiện có
    const existingCaseServices = await CaseServiceModel.find({});
    console.log(
      `Hiện có ${existingCaseServices.length} case services trong database`
    );

    // Tạo map để kiểm tra nhanh
    const caseServiceMap = new Map();
    existingCaseServices.forEach((cs) => {
      caseServiceMap.set(cs.case_customerId.toString(), cs);
    });

    // Kiểm tra từng khách hàng
    let fixed = 0;
    let customersMissingServices = 0;

    for (const customer of customers) {
      const customerId = customer._id.toString();

      // Kiểm tra xem khách hàng đã có case service chưa
      if (!caseServiceMap.has(customerId)) {
        customersMissingServices++;

        // Tạo case service mới cho khách hàng - với giá trị mặc định
        const caseData = {
          customerId: customer._id,
          eventLocation: 'Unknown',
          partner: '',
          appointmentDate: new Date(),
          price: 0,
          amountPaid: 0,
          paymentMethod: '',
          consultantName: '',
          fingerprintTakerName: '',
          counselorName: '',
          scanLocation: '',
          isScanned: false,
          isFullInfo: false,
          isAnalysisSent: false,
          isPdfExported: false,
          isFullyPaid: false,
          isSoftFileSent: false,
          isPrintedAndSent: false,
          isPhysicalCopySent: false,
          isDeepConsulted: false,
          progressNote: '',
          progressPercent: 0,
        };

        try {
          const formattedCaseData = formatAttributeName(caseData, 'case_');
          await CaseServiceModel.create(formattedCaseData);
          fixed++;

          if (fixed % 100 === 0) {
            console.log(`Đã tạo ${fixed} case services mới`);
          }
        } catch (error) {
          console.error(
            `Lỗi khi tạo case service cho khách hàng ${customer.cus_fullName}:`,
            error
          );
        }
      }
    }

    console.log(
      `Hoàn tất! Đã tạo ${fixed}/${customersMissingServices} case services còn thiếu`
    );

    // Kiểm tra lại sau khi sửa
    const finalCount = await CaseServiceModel.countDocuments();
    console.log(`Tổng số case services sau khi sửa: ${finalCount}`);

    return { fixed, total: finalCount };
  } catch (error) {
    console.error('Lỗi khi sửa case services:', error);
    throw error;
  }
};

// Cập nhật hàm importCustomersFromCSVOptimized để sử dụng hàm mới
const importCustomersFromCSVOptimized = async (
  csvData: string[][]
): Promise<IImportResult> => {
  // Sử dụng phương pháp import mới (tuần tự từng document) thay vì phương pháp cũ
  return importCustomersOneByOne(csvData);
};

// Hàm import từ file Excel
const importCustomersFromExcel = async (
  excelBuffer: Buffer
): Promise<IImportResult> => {
  const errors: string[] = [];
  let importedCustomers = 0;
  let importedCaseServices = 0;
  let skippedRows = 0;

  try {
    console.log('Starting Excel import process...');

    // Đọc file Excel
    const workbook = xlsxRead(excelBuffer, { type: 'buffer' });

    // Lấy sheet đầu tiên
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Chuyển đổi sheet thành JSON
    const jsonData = xlsxUtils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
    });

    // Skip header and summary rows
    const customersToImport = [];
    const caseServicesToImport = [];
    const customerMap = new Map<string, string>(); // Maps customer name to MongoDB ID

    // Process each row
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as string[];

      // Skip empty rows or rows that don't have enough data
      if (!row || row.length < 5) {
        skippedRows++;
        continue;
      }

      // Skip summary rows (that contain "THÁNG")
      if (
        row.some(
          (cell) => cell && typeof cell === 'string' && cell.includes('THÁNG')
        )
      ) {
        skippedRows++;
        continue;
      }

      try {
        // Xử lý dữ liệu từ row - cách tiếp cận khác với CSV vì Excel có thể giữ định dạng

        // Convert Excel value to string safely
        const getString = (index: number): string => {
          const value = row[index];
          if (value === undefined || value === null) return '';
          return String(value).trim();
        };

        // Convert Excel value to boolean (1 or true strings become true)
        const getBoolean = (index: number): boolean => {
          const value = row[index];
          if (
            (typeof value === 'number' && value === 1) ||
            (typeof value === 'boolean' && value === true) ||
            (typeof value === 'string' &&
              (value === '1' || value.toLowerCase() === 'true'))
          ) {
            return true;
          }
          return false;
        };

        // Convert Excel value to number with special case handling
        const getNumber = (index: number): number => {
          const value = row[index];
          if (typeof value === 'number') return value;
          if (!value) return 0;

          const strValue = String(value).trim();

          // Special cases for free/gift services
          if (
            strValue.toLowerCase().includes('tặng') ||
            strValue.toLowerCase().includes('free') ||
            strValue.toLowerCase().includes('khuyến mãi') ||
            strValue.toLowerCase().includes('0đ')
          ) {
            return 0;
          }

          // Excel có thể đã lưu giá trị dạng "2,500,000 đ" hoặc "2.500.000 đ", cần clean
          const numStr = strValue.replace(/[^\d.-]/g, '');
          const num = parseFloat(numStr);
          return isNaN(num) ? 0 : num;
        };

        // Parse percentage value (for index 29)
        const getPercentageString = (index: number): string => {
          const value = row[index];
          if (value === undefined || value === null) return '0';

          // Log để kiểm tra giá trị gốc
          console.log(
            `Raw progress value for ${customerName}: ${value}, type: ${typeof value}`
          );

          // Nếu là một số từ công thức Excel (thường là số thập phân dạng 0.xx)
          if (typeof value === 'number') {
            // Nếu là số thập phân nhỏ hơn 1 (dạng 0.xx) - đây có thể là kết quả từ công thức
            if (value >= 0 && value <= 1) {
              // Chuyển sang phần trăm (nhân 100 và làm tròn)
              const result = Math.round(value * 100).toString();
              console.log(
                `Converted decimal to percentage: ${value} -> ${result}%`
              );
              return result;
            }
            // Nếu là số nguyên (đã có dạng phần trăm)
            return Math.round(value).toString();
          }

          const strValue = String(value).trim();

          // Nếu đã có dấu % (ví dụ: "100%")
          if (strValue.includes('%')) {
            // Loại bỏ dấu % và chuyển thành chuỗi số
            const percentage = parseInt(strValue.replace('%', ''));
            return isNaN(percentage) ? '0' : percentage.toString();
          }

          // Nếu là một số có dấu phẩy thập phân (ví dụ: "0,75")
          if (strValue.includes(',')) {
            // Thay dấu phẩy bằng dấu chấm và chuyển sang phần trăm
            const decimalValue = parseFloat(strValue.replace(',', '.'));
            if (
              !isNaN(decimalValue) &&
              decimalValue >= 0 &&
              decimalValue <= 1
            ) {
              const result = Math.round(decimalValue * 100).toString();
              console.log(
                `Converted comma decimal to percentage: ${strValue} -> ${result}%`
              );
              return result;
            }
          }

          // Nếu là một số có dấu chấm thập phân (ví dụ: "0.75")
          if (strValue.includes('.')) {
            const decimalValue = parseFloat(strValue);
            if (
              !isNaN(decimalValue) &&
              decimalValue >= 0 &&
              decimalValue <= 1
            ) {
              const result = Math.round(decimalValue * 100).toString();
              console.log(
                `Converted dot decimal to percentage: ${strValue} -> ${result}%`
              );
              return result;
            }
          }

          // Thử chuyển thành số nguyên
          const numberValue = parseInt(strValue);
          if (!isNaN(numberValue)) {
            return numberValue.toString();
          }

          return '0';
        };

        // Convert Excel date to JS Date
        const getDate = (index: number): Date | null => {
          const value = row[index];

          // Nếu là Excel serial date
          if (typeof value === 'number') {
            // Convert Excel serial date to JS date
            const date = new Date((value - 25569) * 86400 * 1000);
            if (!isNaN(date.getTime())) {
              return date;
            }
          }

          // Nếu là string, dùng hàm parseDate đã có
          if (typeof value === 'string' && value) {
            return parseDate(value);
          }

          // Nếu là Date object (kiểm tra qua getTime method)
          if (value && typeof value === 'object' && 'getTime' in value) {
            return value as Date;
          }

          return null;
        };

        // Collect customer data
        const customerName = getString(4);

        // Skip if no customer name
        if (!customerName) {
          console.log(`Skipping row ${i}: No customer name`);
          skippedRows++;
          continue;
        }

        // Create a unique MongoDB ID for this customer
        const customerId = new mongoose.Types.ObjectId();
        customerMap.set(customerName, customerId.toString());

        // Prepare customer data
        const customerData: any = {
          _id: customerId,
          cus_fullName: customerName,
          cus_dateOfBirth: getDate(5),
          cus_gender: normalizeGender(getString(6)),
          cus_parentName: getString(7),
          cus_parentDateOfBirth: getDate(8),
          cus_phone: getString(9),
          cus_email: getString(11),
          cus_address: getString(10),
          cus_contactChannel: getString(30).toLowerCase() || 'other',
          cus_contactAccountName: getString(31),
          cus_status: 'active',
          cus_type: 'regular',
          cus_source: 'direct',
          cus_note: getString(32),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        customersToImport.push(customerData);

        // Update payment handling to account for special cases
        // Prepare case service data với đầy đủ thông tin thanh toán, tiến độ, và nhân sự
        const price = getNumber(12);
        const amountPaid = getNumber(13);
        const priceStr = getString(12);

        // Check if this is a free/gift service
        const isFreeService =
          priceStr.toLowerCase().includes('tặng') ||
          priceStr.toLowerCase().includes('free') ||
          priceStr.toLowerCase().includes('khuyến mãi');

        const caseServiceData: any = {
          _id: new mongoose.Types.ObjectId(),
          case_customerId: customerId,
          case_eventLocation: getString(3) || '', // Column D: ĐỊA ĐIỂM SỰ KIỆN
          case_partner: getString(2) || '', // Column C: ĐỐI TÁC
          case_appointmentDate: getDate(1) || new Date(),
          case_price: price,
          case_amountPaid: amountPaid,
          case_debt: price - amountPaid,
          case_paymentMethod: isFreeService
            ? 'Dịch vụ miễn phí'
            : getString(15),
          case_consultantName: getString(16),
          case_fingerprintTakerName: getString(17),
          case_scanLocation: getString(18),
          case_counselorName: getString(28),
          case_isScanned:
            getString(18) === 'Tại sự kiện' || getString(18) === 'Tại nhà',
          case_isFullInfo: getBoolean(19),
          case_isAnalysisSent: getBoolean(20),
          case_isPdfExported: getBoolean(21),
          case_isFullyPaid: getBoolean(22),
          case_isSoftFileSent: getBoolean(23),
          case_isPrintedAndSent: getBoolean(24),
          case_isPhysicalCopySent: getBoolean(25),
          case_isDeepConsulted: getBoolean(26),
          case_progressNote: getString(27),
          case_progressPercent: parseInt(getPercentageString(29)),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        caseServicesToImport.push(caseServiceData);
      } catch (error) {
        console.error(`Error processing row ${i}:`, error);
        errors.push(
          `Row ${i}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }

    console.log(
      `Processed rows - Valid customers: ${customersToImport.length}, Case services: ${caseServicesToImport.length}, Skipped: ${skippedRows}`
    );

    // Delete existing data first
    console.log('Deleting existing data...');
    await CaseServiceModel.deleteMany({});
    await CustomerModel.deleteMany({});

    // Insert all customers in bulk
    if (customersToImport.length > 0) {
      console.log(`Importing ${customersToImport.length} customers...`);
      const customerResult = await CustomerModel.insertMany(customersToImport, {
        ordered: false,
      });
      importedCustomers = customerResult.length;
      console.log(`Successfully imported ${importedCustomers} customers`);
    }

    // Insert all case services in bulk
    if (caseServicesToImport.length > 0) {
      console.log(`Importing ${caseServicesToImport.length} case services...`);
      try {
        const caseServiceResult = await CaseServiceModel.insertMany(
          caseServicesToImport,
          { ordered: false }
        );
        importedCaseServices = caseServiceResult.length;
        console.log(
          `Successfully imported ${importedCaseServices} case services`
        );
      } catch (error) {
        console.error('Error importing case services:', error);
        errors.push(
          `Error importing case services: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );

        // Try inserting case services one by one to see which ones fail
        console.log('Attempting to import case services individually...');
        for (const caseService of caseServicesToImport) {
          try {
            await CaseServiceModel.create(caseService);
            importedCaseServices++;
          } catch (csError) {
            console.error(
              `Error importing case service for customer ${caseService.case_customerId}:`,
              csError
            );
            errors.push(
              `Error importing case service: ${
                csError instanceof Error ? csError.message : 'Unknown error'
              }`
            );
          }
        }
      }
    }

    // Final verification
    const actualCustomerCount = await CustomerModel.countDocuments();
    const actualCaseServiceCount = await CaseServiceModel.countDocuments();

    console.log(
      `Final verification - Customers: ${actualCustomerCount}, Case services: ${actualCaseServiceCount}`
    );

    return {
      success: true,
      imported: actualCustomerCount,
      caseServices: actualCaseServiceCount,
      errors,
    };
  } catch (error) {
    console.error('Excel import failed:', error);

    // Get actual counts even in case of error
    const actualCustomerCount = await CustomerModel.countDocuments();
    const actualCaseServiceCount = await CaseServiceModel.countDocuments();

    return {
      success: false,
      imported: actualCustomerCount,
      caseServices: actualCaseServiceCount,
      errors: [
        ...errors,
        `Excel import failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      ],
    };
  }
};

const getCustomersWithCaseServices = async (
  query: any = {},
  options: IPaginationOptions = {},
  caseServiceQuery: any = {}
) => {
  try {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    // Nếu có điều kiện lọc trên CaseService, chúng ta cần thay đổi cách truy vấn
    if (Object.keys(caseServiceQuery).length > 0) {
      // Lấy danh sách id khách hàng dựa trên điều kiện của CaseService
      const matchingCaseServices = await CaseServiceModel.find(
        caseServiceQuery
      );
      const matchingCustomerIds = matchingCaseServices.map((cs) =>
        cs.case_customerId.toString()
      );

      // Thêm điều kiện id vào query khách hàng
      query._id = { $in: matchingCustomerIds };

      // Lấy tổng số khách hàng phù hợp
      const total = await CustomerModel.countDocuments(query);

      // Lấy khách hàng phù hợp với phân trang
      const customers = await CustomerModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const customerIds = customers.map((customer) => customer._id);

      // Lấy case services cho các khách hàng
      const caseServices = await CaseServiceModel.find({
        case_customerId: { $in: customerIds },
      });

      // Map services to customers
      const caseServiceMap = new Map();
      caseServices.forEach((cs) => {
        caseServiceMap.set(cs.case_customerId.toString(), cs);
      });

      // Kết hợp dữ liệu
      const result = customers.map((customer) => {
        const customerData = getReturnData(customer);
        const caseService = caseServiceMap.get(customer._id.toString());

        if (caseService) {
          return {
            ...customerData,
            caseService: {
              id: caseService._id,
              case_price: caseService.case_price,
              case_amountPaid: caseService.case_amountPaid,
              case_debt: caseService.case_debt,
              case_remainingAmount: caseService.case_debt, // For backward compatibility
              case_paymentMethod: caseService.case_paymentMethod,
              case_progressPercent: caseService.case_progressPercent,
              case_appointmentDate: caseService.case_appointmentDate,
              case_consultantId: caseService.case_consultantId,
              case_fingerprintTakerId: caseService.case_fingerprintTakerId,
              case_mainCounselorId: caseService.case_mainCounselorId,
              case_consultantName: caseService.case_consultantName,
              case_fingerprintTakerName: caseService.case_fingerprintTakerName,
              case_counselorName: caseService.case_counselorName,
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
            },
          };
        }

        return customerData;
      });

      return {
        data: result,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } else {
      // Sử dụng logic cũ nếu không có điều kiện lọc CaseService

      // Get total count for pagination
      const total = await CustomerModel.countDocuments(query);

      // Get customer IDs for pagination
      const customers = await CustomerModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      // Get customer IDs for lookup
      const customerIds = customers.map((customer) => customer._id);

      // Get all case services for these customers
      const caseServices = await CaseServiceModel.find({
        case_customerId: { $in: customerIds },
      });

      // Map case services to customers
      const caseServiceMap = new Map();
      caseServices.forEach((cs) => {
        caseServiceMap.set(cs.case_customerId.toString(), cs);
      });

      // Combine customer data with case service data
      const result = customers.map((customer) => {
        const customerData = getReturnData(customer);
        const caseService = caseServiceMap.get(customer._id.toString());

        if (caseService) {
          return {
            ...customerData,
            caseService: {
              id: caseService._id,
              case_price: caseService.case_price,
              case_amountPaid: caseService.case_amountPaid,
              case_debt: caseService.case_debt,
              case_remainingAmount: caseService.case_debt, // For backward compatibility
              case_paymentMethod: caseService.case_paymentMethod,
              case_progressPercent: caseService.case_progressPercent,
              case_appointmentDate: caseService.case_appointmentDate,
              case_consultantId: caseService.case_consultantId,
              case_fingerprintTakerId: caseService.case_fingerprintTakerId,
              case_mainCounselorId: caseService.case_mainCounselorId,
              case_consultantName: caseService.case_consultantName,
              case_fingerprintTakerName: caseService.case_fingerprintTakerName,
              case_counselorName: caseService.case_counselorName,
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
            },
          };
        }

        return customerData;
      });

      return {
        data: result,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }
  } catch (error) {
    throw error;
  }
};

// Get customer by ID with case service
const getCustomerWithCaseServiceById = async (
  customerId: string
): Promise<any> => {
  try {
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Get the associated case service
    const caseService = await CaseServiceModel.findOne({
      case_customerId: customerId,
    });

    // Return customer with case service data if available
    const customerData = getReturnData(customer);

    if (caseService) {
      // Populate employee information for each staff ID if available
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
        ...customerData,
        caseService: {
          id: caseService._id.toString(),
          case_price: caseService.case_price,
          case_amountPaid: caseService.case_amountPaid,
          case_debt: caseService.case_debt,
          case_paymentMethod: caseService.case_paymentMethod,
          case_progressPercent: caseService.case_progressPercent,
          case_appointmentDate: caseService.case_appointmentDate,
          case_consultantId: caseService.case_consultantId?.toString(),
          case_fingerprintTakerId:
            caseService.case_fingerprintTakerId?.toString(),
          case_mainCounselorId: caseService.case_mainCounselorId?.toString(),
          case_consultant: consultantData,
          case_fingerprintTaker: fingerprintTakerData,
          case_counselor: counselorData,
          case_consultantName: caseService.case_consultantName,
          case_fingerprintTakerName: caseService.case_fingerprintTakerName,
          case_counselorName: caseService.case_counselorName,
          case_eventLocation: caseService.case_eventLocation,
          case_scanLocation: caseService.case_scanLocation,
          case_partner: caseService.case_partner,
          case_progressNote: caseService.case_progressNote,
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
        },
      };
    }

    return customerData;
  } catch (error) {
    throw error;
  }
};

export {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  deleteMultipleCustomers,
  searchCustomers,
  getCustomerStatistics,
  addCustomerInteraction,
  importCustomersFromCSV,
  importCustomersFromExcel,
  deleteAllImportedData,
  importCustomersFromCSVBulk,
  importCustomersFromCSVOptimized,
  importCustomersOneByOne,
  getCustomersWithCaseServices,
  getCustomerWithCaseServiceById,
};
