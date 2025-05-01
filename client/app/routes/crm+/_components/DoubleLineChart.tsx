import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Chart,
} from 'chart.js';
import { useEffect, useRef, useState } from 'react';

import { createChart } from '~/services/chart.client';
import {
  createDayData,
  createMonthData,
  createWeekData,
} from '~/utils/chartData.util';
import { getDateObject } from '~/utils/date.util';
import { toVnDateTimeString } from '~/utils';
import { ICaseServiceDailyReport } from '~/interfaces/caseService.interface';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export default function DoubleLineChart({
  currentReport,
  pastReport,
  type,
  date,
  activeIndex,
}: {
  currentReport: Promise<ICaseServiceDailyReport[]>;
  pastReport: Promise<ICaseServiceDailyReport[]>;
  type: 'daily' | 'weekly' | 'monthly';
  date: string;
  activeIndex: 'revenue' | 'debt' | 'actualIncome';
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (canvasRef.current) chartRef.current?.destroy();

    (async () => {
      const [current, past] = await Promise.all([currentReport, pastReport]);

      const currentMap = new Map<string, number>();
      const pastMap = new Map<string, number>();
      current.forEach((rec) => {
        currentMap.set(toVnDateTimeString(rec.date!), rec[activeIndex]);
      });
      past.forEach((rec) => {
        pastMap.set(toVnDateTimeString(rec.date!), rec[activeIndex]);
      });

      const graph = document.querySelector('#doubleLineGraph');

      const chartStrategy = {
        daily: (element, { day, month, year } = {}) => {
          const { dataset: currentData, options } = createDayData(
            day,
            month,
            year,
            currentMap,
          );
          const { dataset: pastData } = createDayData(
            day - 1,
            month,
            year,
            pastMap,
          );

          return createChart(element, {
            type: 'line',
            data: {
              labels: new Array(24).fill(0).map((_, i) => i + 1),
              datasets: [currentData, pastData],
            },
            options,
          });
        },
        monthly: (element, { day, month, year } = {}) => {
          const { dataset: currentData, options } = createMonthData(
            month,
            year,
            currentMap,
          );
          const { dataset: pastData } = createMonthData(
            month - 1,
            year,
            pastMap,
          );

          return createChart(element, {
            type: 'line',
            data: {
              labels: new Array(31).fill(0).map((_, i) => i + 1),
              datasets: [currentData, pastData],
            },
            options,
          });
        },
        weekly: (element, { day, month, year } = {}) => {
          const { dataset: currentData, options } = createWeekData(
            day,
            month,
            year,
            currentMap,
          );
          const { dataset: pastData } = createWeekData(
            day - 7,
            month,
            year,
            pastMap,
          );

          return createChart(element, {
            type: 'line',
            data: {
              labels: new Array(7).fill(0).map((_, i) => i + 1),
              datasets: [currentData, pastData],
            },
            options,
          });
        },
      } as Record<string, (element: any, date: any) => any>;

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const newSelection = chartStrategy[type](graph, getDateObject(date));

      chartRef.current = newSelection.chart;
    })();

    // Dọn dẹp khi unmount
    return () => chartRef.current?.destroy();
  }, [type, activeIndex]);

  return (
    <div className='w-full'>
      {/* Chart would go here */}
      <canvas id='doubleLineGraph' />
    </div>
  );
}
