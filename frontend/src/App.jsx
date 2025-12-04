import { useState } from "react";
import InputForm from "./components/InputForm";
import SentimentChart from "./components/SentimentChart";
import WordCloudImg from "./components/WordCloudImg";

export default function App() {

  const [insights, setInsights] = useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  return (
    <div className="bg-linear-to-br from-gray-900 to-blue-900 p-4 md:p-8 font-sans text-white">
        <div className="min-h-screen p-10">
        
        <h1 className="text-center text-5xl font-extrabold text-indigo-700 drop-shadow">
            EchoMind 💬
        </h1>
        <p className="text-center mt-2 text-gray-600">
            Understand YouTube Audiences with AI-Powered Insights
        </p>

        <InputForm setInsights={setInsights} setLoading={setLoading} setError={setError} />

        {loading && (
            <p className="text-center mt-8 text-indigo-600 animate-pulse">
            Fetching and analyzing comments...
            </p>
        )}

        {error && (
            <div className="mt-8 text-center text-red-500 font-bold">
            {error}
            </div>
        )}

        {insights && !loading && (
            <div className="max-w-6xl mx-auto mt-10 space-y-8">

            {/* SUMMARY */}
            <div className="grid md:grid-cols-3 gap-6">
                <Stat title="Total Comments" value={insights.total_comments}/>
                <Stat title="Overall Sentiment" value={insights.overall_sentiment}/>
                <Stat title="Avg Score" value={insights.overall_score}/>
            </div>

            {/* CHARTS */}
            <div className="grid md:grid-cols-2 gap-6">
                <SentimentChart data={insights.sentiment_breakdown}/>
                <WordCloudImg words={insights.word_frequencies}/>
            </div>

            {/* OPINIONS */}
            <div className="grid md:grid-cols-2 gap-6">

                <Opinion title="💚 Top Positive" list={insights.top_opinions.positive} color="green"/>

                <Opinion title="❤️ Top Negative" list={insights.top_opinions.negative} color="red"/>
            
            </div>

            </div>
        )}

        </div>
    </div>
  );
}

function Stat({title,value}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg text-center">
      <h3 className="text-gray-500">{title}</h3>
      <p className="text-3xl font-bold mt-2 text-indigo-700">{value}</p>
    </div>
  )
}

function Opinion({title,list,color}) {
  return (
    <div className={`p-6 rounded-xl shadow bg-${color}-50`}>
      <h3 className={`text-${color}-700 font-bold mb-4`}>{title}</h3>
      <ul className="list-disc ml-5 text-gray-700 space-y-2">
        {list.map((c,i)=>(<li key={i}>{c}</li>))}
      </ul>
    </div>
  )
}
