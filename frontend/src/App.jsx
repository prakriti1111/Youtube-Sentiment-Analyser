import React, { useState, useEffect, useMemo } from 'react';

// Styling using Tailwind CSS classes for aesthetics
const sentimentColors = {
    Positive: '#10B981', // Emerald Green
    Neutral: '#F59E0B',  // Amber Yellow
    Negative: '#EF4444', // Red
    Background: '#E0F2F1' // Light Teal background for charts
};

// Default structure for insights to prevent errors before data load
const initialInsights = {
    total_comments: 0,
    overall_sentiment: 'N/A',
    overall_score: 0,
    sentiment_breakdown: { Positive: { count: 0, percentage: 0 }, Neutral: { count: 0, percentage: 0 }, Negative: { count: 0, percentage: 0 } },
    top_opinions: { focus: 'General', positive: [], negative: [] },
    word_frequencies: [],
};

// --- Visualization Components (Self-Contained) ---

const BarChartVisualization = ({ data }) => {
    // Filter out items with 0 count for cleaner visual, but keep all three labels
    const chartData = [
        { name: 'Positive', count: data.Positive.count, color: sentimentColors.Positive },
        { name: 'Neutral', count: data.Neutral.count, color: sentimentColors.Neutral },
        { name: 'Negative', count: data.Negative.count, color: sentimentColors.Negative },
    ];

    const totalCount = chartData.reduce((sum, item) => sum + item.count, 0);
    const maxCount = Math.max(...chartData.map(item => item.count), 1); // Ensure division by zero is avoided

    return (
        <div className="p-4 bg-white rounded-lg shadow-inner">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Sentiment Distribution (Count)</h3>
            <div className="space-y-4">
                {chartData.map((item) => (
                    <div key={item.name} className="flex flex-col">
                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                            <span>{item.name} ({item.count} comments)</span>
                            <span>{((item.count / totalCount) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                                className="h-3 rounded-full transition-all duration-1000 ease-out" 
                                style={{ 
                                    width: `${(item.count / maxCount) * 100}%`, 
                                    backgroundColor: item.color 
                                }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const WordCloudVisualization = ({ words }) => {
    // Use an array of font sizes to simulate word cloud density based on frequency
    const fontSizes = [16, 20, 24, 28, 32, 36, 40, 44, 48];
    
    const maxCount = Math.max(...words.map(w => w.value), 1);

    const getFontSize = (value) => {
        if (value === 0) return 12;
        const index = Math.min(
            Math.floor((value / maxCount) * fontSizes.length),
            fontSizes.length - 1
        );
        return fontSizes[index];
    };

    // Shuffle the words for a random, cloud-like layout
    const shuffledWords = useMemo(() => [...words].sort(() => Math.random() - 0.5), [words]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg h-80 overflow-auto flex items-center justify-center">
            {words.length === 0 ? (
                <p className="text-center text-gray-400 p-16">No sufficient data for Word Cloud.</p>
            ) : (
                <div className="flex flex-wrap gap-2 justify-center items-center">
                    {shuffledWords.map((word, index) => (
                        <span
                            key={index}
                            className="font-bold cursor-default transition-all duration-300 hover:text-indigo-600"
                            style={{ 
                                fontSize: `${getFontSize(word.value)}px`, 
                                color: `rgba(49, 46, 129, ${0.5 + (word.value / maxCount) * 0.5})` 
                            }}
                            title={`Count: ${word.value}`}
                        >
                            {word.text}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Custom Hook to manage state and fetch logic ---

const useAnalyzer = () => {
    const [url, setUrl] = useState('');
    const [keyword, setKeyword] = useState('');
    const [maxComments, setMaxComments] = useState(500);
    const [insights, setInsights] = useState(initialInsights);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Simple URL validation
        if (!url.includes('youtube.com/watch?v=') && !url.includes('youtu.be/')) {
            setError("Please enter a valid YouTube video URL.");
            setLoading(false);
            return;
        }

        try {
            // Implement basic exponential backoff for robustness
            const maxRetries = 3;
            let response = null;
            let lastError = null;

            for (let i = 0; i < maxRetries; i++) {
                try {
                    response = await fetch('http://127.0.0.1:5000/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url, keyword, maxComments }),
                    });

                    if (response.ok) {
                        break; // Success!
                    } else if (response.status === 429) { // Too Many Requests
                        lastError = `Rate limit exceeded. Retrying in ${2 ** i}s...`;
                        console.warn(lastError);
                        if (i < maxRetries - 1) {
                            await new Promise(resolve => setTimeout(resolve, (2 ** i) * 1000));
                            continue;
                        }
                    } else {
                        // For other non-OK statuses, break and handle as error
                        throw new Error(`Server returned status ${response.status}`);
                    }
                } catch (err) {
                    lastError = err.message;
                    if (i < maxRetries - 1) {
                        await new Promise(resolve => setTimeout(resolve, (2 ** i) * 1000));
                        continue;
                    }
                }
            }

            if (!response || !response.ok) {
                throw new Error(lastError || "Failed to connect to the server after multiple retries.");
            }
            
            const result = await response.json();

            if (result.error) {
                throw new Error(result.error);
            }

            setInsights(result.insights);
            
        } catch (err) {
            console.error("Analysis Error:", err);
            setError(`Failed to analyze: ${err.message}. Please check the server status and API key validity.`);
        } finally {
            setLoading(false);
        }
    };

    return { url, setUrl, keyword, setKeyword, maxComments, setMaxComments, insights, loading, error, handleSubmit };
};


// Main App Component
const App = () => {
    const { url, setUrl, keyword, setKeyword, maxComments, setMaxComments, insights, loading, error, handleSubmit } = useAnalyzer();

    const sentimentData = insights.sentiment_breakdown;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-indigo-700">
                    <span className="text-gray-900">EchoMind</span> Comment Analyzer
                </h1>
                <p className="text-gray-500 mt-2">Unlocking Audience Opinions with NLP</p>
            </header>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-lg mb-8">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1">
                        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">YouTube Video URL</label>
                        <input
                            id="url"
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="e.g., https://www.youtube.com/watch?v=..."
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div className="w-full md:w-1/4">
                        <label htmlFor="maxComments" className="block text-sm font-medium text-gray-700 mb-1">Max Comments</label>
                        <input
                            id="maxComments"
                            type="number"
                            value={maxComments}
                            onChange={(e) => setMaxComments(e.target.value)}
                            placeholder="500"
                            min="1"
                            max="1000"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">Optional Keyword Focus</label>
                        <input
                            id="keyword"
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            placeholder="e.g., 'camera', 'editing', 'price'"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full md:w-1/4 self-end p-3 rounded-lg text-white font-semibold transition duration-150 ${
                            loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
                        }`}
                    >
                        {loading ? 'Analyzing...' : 'Analyze Comments'}
                    </button>
                </div>
            </form>

            {/* Loading/Error State */}
            {error && (
                <div className="max-w-4xl mx-auto p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-100" role="alert">
                    <span className="font-medium">Error:</span> {error}
                </div>
            )}

            {loading && (
                <div className="text-center p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-indigo-600">Fetching and analyzing {maxComments} comments...</p>
                </div>
            )}

            {/* Results Dashboard (Conditional Rendering) */}
            {insights.total_comments > 0 && !loading && (
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Overall Summary & Sentiment Score */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-indigo-500">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Summary of {insights.total_comments} Comments</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div className="p-4 bg-indigo-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-500">Overall Sentiment</p>
                                <p className="text-3xl font-extrabold mt-1" style={{ color: sentimentColors[insights.overall_sentiment] }}>
                                    {insights.overall_sentiment}
                                </p>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-500">Avg. Compound Score</p>
                                <p className="text-3xl font-extrabold text-gray-900 mt-1">{insights.overall_score}</p>
                            </div>
                            <div className="p-4 bg-indigo-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-500">Analysis Focus</p>
                                <p className="text-xl font-bold text-gray-700 mt-1 capitalize">{insights.top_opinions.focus || 'General'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sentiment Breakdown and Word Cloud */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Sentiment Breakdown Chart (Custom Bar Chart) */}
                        <div className="bg-white p-6 rounded-xl shadow-lg h-[370px]">
                             <BarChartVisualization data={sentimentData} />
                        </div>
                        
                        {/* Word Cloud (Custom SVG/HTML) */}
                        <div className="bg-white p-6 rounded-xl shadow-lg h-[370px]">
                            <h3 className="text-xl font-semibold mb-4 text-gray-800">Key Thematic Words (Word Cloud)</h3>
                            <div style={{ height: 300, width: '100%' }}>
                                <WordCloudVisualization words={insights.word_frequencies} />
                            </div>
                        </div>
                    </div>
                    
                    {/* Top Opinions */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Top Relevant Opinions</h2>
                        <p className="text-gray-500 mb-4">Showing most polarized comments related to: <span className="font-semibold">{insights.top_opinions.focus}</span></p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Positive Opinions */}
                            <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded-lg">
                                <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.84 1.115l2.76 5.517A2 2 0 0120.517 21H3.483a2 2 0 01-1.875-2.887l3.75-7.5A2 2 0 018.25 9h7.5A2 2 0 0117 11.25V18l-2-2m-3-11v2m0 5v2m0 5v2m0-11h2m-2 5h2m-2 5h2m-7-5h2m-2-5h2m-2-5h2"></path></svg>
                                    Top Positive Comments
                                </h3>
                                <ul className="list-disc ml-5 space-y-2 text-gray-700">
                                    {insights.top_opinions.positive.map((comment, index) => (
                                        <li key={index} className="pl-2">{comment}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* Negative Opinions */}
                            <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded-lg">
                                <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.398 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    Top Negative Comments
                                </h3>
                                <ul className="list-disc ml-5 space-y-2 text-gray-700">
                                    {insights.top_opinions.negative.map((comment, index) => (
                                        <li key={index} className="pl-2">{comment}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Initial State Message */}
            {insights.total_comments === 0 && !loading && !error && (
                <div className="max-w-4xl mx-auto p-12 bg-white rounded-xl shadow-lg text-center text-gray-500">
                    <p className="text-xl">Enter a YouTube URL and click 'Analyze' to begin the EchoMind analysis!</p>
                    <p className="mt-2 text-sm">Make sure your Python Flask server is running on port 5000.</p>
                </div>
            )}
        </div>
    );
};

export default App;