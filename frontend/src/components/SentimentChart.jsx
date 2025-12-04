import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function SentimentChart({ data }) {

  const labels = Object.keys(data);
  const values = Object.values(data).map(v => v.count);
  const total = values.reduce((a,b)=>a+b,0);

  const percentages = values.map(v => ((v / total) * 100).toFixed(1));

  const chartData = {
    labels: labels.map((l,i)=> `${l} (${percentages[i]}%)`),
    datasets: [
      {
        data: values,
        backgroundColor: [
          '#22c55e',  // green
          '#facc15',  // yellow
          '#ef4444'   // red
        ],
        borderWidth: 1
      }
    ]
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  return (
    <div className="bg-white p-6 shadow-xl rounded-xl flex flex-col items-center">
      <h3 className="font-bold mb-4">Sentiment Distribution</h3>
      <div className="w-72">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  )
}
