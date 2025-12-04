from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from config import YOUTUBE_API_KEY
from data_collector import fetch_comments
from nlp_analyser import analyze_sentiment, generate_insights

app = Flask(__name__)
# Enable CORS to allow the React frontend (running on a different port/origin) to access the API
CORS(app)

@app.route('/analyze', methods=['POST'])
def analyze():
    """
    API endpoint to fetch, analyze, and return YouTube comment insights.
    """
    data = request.json
    video_url = data.get('url')
    max_comments = int(data.get('maxComments', 500))
    keyword = data.get('keyword')
    
    if not video_url:
        return jsonify({"error": "Missing 'url' parameter."}), 400

    print(f"Request received: URL={video_url}, Max={max_comments}, Keyword={keyword}")

    try:
        # 1. Data Collection
        raw_comments = fetch_comments(YOUTUBE_API_KEY, video_url, max_comments)
        
        if not raw_comments:
            return jsonify({"error": "Could not fetch any comments. Check URL or API key."}), 500

        # 2. NLP Analysis
        df_analyzed = analyze_sentiment(raw_comments)
        
        # 3. Generate Insights (JSON serializable dict)
        insights = generate_insights(df_analyzed, keyword=keyword)
        
        # Return results to the frontend
        return jsonify({
            "success": True,
            "insights": insights
        })

    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": f"An internal server error occurred during analysis: {str(e)}"}), 500

if __name__ == '__main__':
    # You will run the Flask app from the terminal with: 
    # flask run
    # For development, run it on port 5000 (React typically runs on 5173/3000)
    print("Starting Flask server...")
    app.run(debug=True, port=5000)