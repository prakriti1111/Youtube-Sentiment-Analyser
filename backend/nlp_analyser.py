import pandas as pd
import re
import nltk
from nltk.corpus import stopwords
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from sklearn.feature_extraction.text import CountVectorizer

# Initialize NLP tools
# Ensure you have run: python -c "import nltk; nltk.download('vader_lexicon'); nltk.download('stopwords')"
STOP_WORDS = set(stopwords.words('english'))
VADER = SentimentIntensityAnalyzer()

def preprocess_text(text):
    """Cleans text: case folding, removing links, punctuation, and stop words."""
    text = text.lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    # Remove all non-word characters and numbers, keeping only letters and spaces
    # This is a strict cleaning for frequency analysis
    text = re.sub(r'[^a-z\s]', '', text) 
    
    tokens = text.split()
    
    # Stopword removal and single-character filtering
    tokens = [word for word in tokens if word not in STOP_WORDS and len(word) > 1]
    
    return " ".join(tokens)

def analyze_sentiment(comments):
    """
    Applies VADER sentiment analysis to a list of comments.
    Returns a DataFrame with comment text, compound score, and sentiment label.
    """
    data = []
    for comment in comments:
        # We use the raw text for VADER as it handles punctuation/emojis for score accuracy
        vs = VADER.polarity_scores(comment)
        compound = vs['compound']
        
        # Classify sentiment
        if compound >= 0.05:
            sentiment = 'Positive'
        elif compound <= -0.05:
            sentiment = 'Negative'
        else:
            sentiment = 'Neutral'
            
        data.append({
            'comment': comment,
            'clean_comment': preprocess_text(comment), # Preprocess for frequency/summary
            'compound_score': compound,
            'sentiment': sentiment
        })
    
    return pd.DataFrame(data)

def get_word_frequencies(clean_text_list, top_n=50):
    """Uses CountVectorizer to get the top N most frequent words."""
    if not clean_text_list:
        return []
        
    vectorizer = CountVectorizer(max_features=top_n)
    
    try:
        X = vectorizer.fit_transform(clean_text_list)
        word_list = vectorizer.get_feature_names_out()
        counts = X.sum(axis=0).A1
        
        # Create a list of tuples (word, count) and sort
        word_counts = sorted(zip(word_list, counts), key=lambda x: x[1], reverse=True)
        return [{"text": word, "value": int(count)} for word, count in word_counts]
    except ValueError:
        return [] # Handle case where corpus is too small

def generate_insights(df, keyword=None):
    """
    Calculates all analysis metrics and prepares data for the frontend.
    Returns a dictionary ready for JSON serialization.
    """
    insights = {}
    
    # 1. Overall Sentiment and Breakdown
    sentiment_counts = df['sentiment'].value_counts()
    total_comments = len(df)
    
    insights['total_comments'] = total_comments
    
    # Calculate percentages and ensure all keys are present
    breakdown = {}
    for label in ['Positive', 'Neutral', 'Negative']:
        count = sentiment_counts.get(label, 0)
        breakdown[label] = {
            'count': int(count),
            'percentage': round((count / total_comments) * 100, 2) if total_comments > 0 else 0.0
        }
    insights['sentiment_breakdown'] = breakdown

    # Calculate overall sentiment score
    overall_score = df['compound_score'].mean()
    if overall_score >= 0.05:
        overall_sentiment = 'Positive'
    elif overall_score <= -0.05:
        overall_sentiment = 'Negative'
    else:
        overall_sentiment = 'Neutral'
    
    insights['overall_sentiment'] = overall_sentiment
    insights['overall_score'] = round(overall_score, 3)
    
    # 2. Top Relevant Opinions
    opinions = {}
    
    if keyword and keyword.strip():
        # Case 1: Filter comments containing the keyword
        keyword_df = df[df['comment'].str.contains(keyword, case=False, na=False)]
        
        if not keyword_df.empty:
            opinions['focus'] = keyword
            opinions['positive'] = keyword_df.sort_values(by='compound_score', ascending=False)['comment'].head(3).tolist()
            opinions['negative'] = keyword_df.sort_values(by='compound_score', ascending=True)['comment'].head(3).tolist()
        else:
            opinions['message'] = f"No comments found containing the keyword: '{keyword}'. Showing general opinions."
            # Fallback to general opinions if keyword yields no results
            opinions['positive'] = df.sort_values(by='compound_score', ascending=False)['comment'].head(3).tolist()
            opinions['negative'] = df.sort_values(by='compound_score', ascending=True)['comment'].head(3).tolist()
            
    else:
        # Case 2: Most extreme positive and negative comments overall
        opinions['focus'] = 'General'
        opinions['positive'] = df.sort_values(by='compound_score', ascending=False)['comment'].head(3).tolist()
        opinions['negative'] = df.sort_values(by='compound_score', ascending=True)['comment'].head(3).tolist()
        
    insights['top_opinions'] = opinions

    # 3. Word Cloud Data
    insights['word_frequencies'] = get_word_frequencies(df['clean_comment'].tolist())
    
    return insights