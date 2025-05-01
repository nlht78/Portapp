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
import { ICaseServiceDailyReport } from '~/interfaces/caseService.interface';
import { formatCurrency } from '~/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export default function DoughnutChart({
  id,
  title,
  data,
  groupName,
  type,
  activeIndex,
}: {
  id: string;
  title: string;
  data: Promise<ICaseServiceDailyReport[]>;
  groupName: 'eventLocation' | 'partner';
  type: 'daily' | 'weekly' | 'monthly';
  activeIndex: 'revenue' | 'debt' | 'actualIncome';
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartRef = useRef<Chart | null>(null);
  const [showNoData, setShowNoData] = useState(false);

  useEffect(() => {
    if (canvasRef.current) chartRef.current?.destroy();

    (async () => {
      const resolvedData = await data;
      if (
        !resolvedData ||
        resolvedData.length === 0 ||
        resolvedData.every((item) => item[activeIndex] === 0)
      ) {
        setShowNoData(true);
        return;
      }
      setShowNoData(false);

      const graph = document.querySelector(`#${id}`);

      if (chartRef.current) {
        chartRef.current.destroy();
      }
      const labels = resolvedData.map(
        (item) =>
          `${item[groupName]?.toUpperCase()}: ${formatCurrency(item[activeIndex])}`,
      ) as string[];
      const newSelection = createChart(graph, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              label: groupName,
              data: resolvedData.map((item) => item[activeIndex]),
            },
          ],
        },
        options: {
          plugins: {
            title: { display: true, text: title },
            // legend: { position: 'right' },
          },
        },
      });

      chartRef.current = newSelection.chart;
    })();

    // Dọn dẹp khi unmount
    return () => chartRef.current?.destroy();
  }, [type, activeIndex]);

  return (
    <div className='h-full w-full flex items-center justify-center relative'>
      {/* Chart would go here */}
      <canvas id={id} />
      {showNoData && (
        <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center bg-white bg-opacity-50'>
          <span className='text-gray-500'>Không có dữ liệu</span>
        </div>
      )}
    </div>
  );
}
