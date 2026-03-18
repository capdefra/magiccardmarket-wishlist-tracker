import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface Props {
  data: { date: string; value: number }[];
  title?: string;
  height?: number;
  format?: 'euro' | 'percent';
}

export function PriceChart({ data, title, height = 250, format = 'euro' }: Props) {
  if (data.length === 0) {
    return <p className="no-data">Not enough data for chart</p>;
  }

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        data: data.map((d) => d.value),
        borderColor: '#4fc3f7',
        backgroundColor: 'rgba(79, 195, 247, 0.1)',
        borderWidth: 2,
        pointRadius: data.length > 20 ? 0 : 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#4fc3f7',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) => {
            const v = ctx.parsed.y ?? 0;
            return format === 'percent'
              ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`
              : `€${v.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#888', maxTicksLimit: 8 },
        grid: { color: '#2a2a3e' },
      },
      y: {
        ticks: {
          color: '#888',
          callback: (val: string | number) =>
            format === 'percent' ? `${Number(val) >= 0 ? '+' : ''}${val}%` : `€${val}`,
        },
        grid: { color: '#2a2a3e' },
      },
    },
  };

  return (
    <div className="price-chart">
      {title && <h3>{title}</h3>}
      <div style={{ height }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
