import { LoaderFunctionArgs } from '@remix-run/node';
import { isAuthenticated } from '~/services/auth.server';
import {
  getCaseServiceDebt,
  getCaseServiceRevenue,
  getCaseStatistics,
} from '~/services/caseService.server';
import ContentHeader from '../_components/ContentHeader';
import ReportToolbar from '../_components/ReportToolbar';
import ReportSummaryCards from '../_components/ReportSummaryCards';
import ReportComparitonChart from '../_components/ReportComparitonChart';
import ReportDataTable from '../_components/ReportDataTable';
import { subDays, subMonths, subWeeks } from 'date-fns';
import { useLoaderData } from '@remix-run/react';

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const auth = await isAuthenticated(request);
    if (!auth) {
      throw new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    const type = searchParams.get('type') || 'monthly';
    const date =
      searchParams.get('date') || new Date().toISOString().split('T')[0];
    const currentReport = getCaseStatistics(type, date, 'date', auth).catch(
      (error) => {
        console.error('Error fetching current report:', error);
        return [];
      },
    );
    const currentReportByEventLocation = getCaseStatistics(
      type,
      date,
      'eventLocation',
      auth,
    ).catch((error) => {
      console.error('Error fetching current report by event location:', error);
      return [];
    });
    const currentReportByPartner = getCaseStatistics(
      type,
      date,
      'partner',
      auth,
    ).catch((error) => {
      console.error('Error fetching current report by partner:', error);
      return [];
    });
    const currentRevenue = getCaseServiceRevenue(type, date, auth).catch(
      (error) => {
        console.error('Error fetching current revenue:', error);
        return 0;
      },
    );
    const currentDebt = getCaseServiceDebt(type, date, auth).catch((error) => {
      console.error('Error fetching current debt:', error);
      return 0;
    });

    let pastDate;
    const dateObj = new Date(date);
    switch (type) {
      case 'weekly':
        pastDate = subWeeks(dateObj, 1).toISOString().split('T')[0];
        break;

      case 'monthly':
        pastDate = subMonths(dateObj, 1).toISOString().split('T')[0];
        break;

      case 'daily':
      default:
        pastDate = subDays(dateObj, 1).toISOString().split('T')[0];
        break;
    }

    const pastReport = getCaseStatistics(type, pastDate, 'date', auth).catch(
      (error) => {
        console.error('Error fetching past report:', error);
        return [];
      },
    );
    const pastReportByEventLocation = getCaseStatistics(
      type,
      pastDate,
      'eventLocation',
      auth,
    ).catch((error) => {
      console.error('Error fetching past report by event location:', error);
      return [];
    });
    const pastReportByPartner = getCaseStatistics(
      type,
      pastDate,
      'partner',
      auth,
    ).catch((error) => {
      console.error('Error fetching past report by partner:', error);
      return [];
    });
    const pastRevenue = getCaseServiceRevenue(type, pastDate, auth).catch(
      (error) => {
        console.error('Error fetching past revenue:', error);
        return 0;
      },
    );
    const pastDebt = getCaseServiceDebt(type, pastDate, auth).catch((error) => {
      console.error('Error fetching past debt:', error);
      return 0;
    });

    return {
      currentReport,
      currentReportByEventLocation,
      currentReportByPartner,
      currentRevenue,
      currentDebt,
      pastReport,
      pastReportByEventLocation,
      pastReportByPartner,
      pastRevenue,
      pastDebt,
      type,
      date,
    };
  } catch (error) {
    console.log('error load report data: ', error);
    throw new Response('Error loading report data', { status: 500 });
  }
};

export default function IncomeReport() {
  const {
    currentReport,
    currentReportByEventLocation,
    currentReportByPartner,
    currentRevenue,
    currentDebt,
    pastReport,
    pastReportByEventLocation,
    pastReportByPartner,
    pastRevenue,
    pastDebt,
    type,
    date,
  } = useLoaderData<typeof loader>();

  return (
    <>
      {/* Header */}
      <ContentHeader title='Báo cáo' />

      {/* Toolbar */}
      {/* <ReportToolbar /> */}

      {/* Summary Cards */}
      <ReportSummaryCards
        currentRevenue={currentRevenue}
        currentDebt={currentDebt}
        pastRevenue={pastRevenue}
        pastDebt={pastDebt}
        type={type}
      />

      {/* Chart Section */}
      <ReportComparitonChart
        currentReport={currentReport}
        currentReportByEventLocation={currentReportByEventLocation}
        currentReportByPartner={currentReportByPartner}
        pastReport={pastReport}
        pastReportByEventLocation={pastReportByEventLocation}
        pastReportByPartner={pastReportByPartner}
        type={type as 'daily' | 'weekly' | 'monthly'}
        date={date}
      />

      {/* Data Tables */}
      {/* <ReportDataTable /> */}
    </>
  );
}
