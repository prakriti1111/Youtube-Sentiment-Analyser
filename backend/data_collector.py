import re
import time
from googleapiclient.discovery import build

def get_video_id(url):
    
    match_v = re.search(r"[?&]v=([^&]+)", url)
    if match_v:
        return match_v.group(1)
    
    match_short = re.search(r"youtu\.be/([^/?&]+)", url)
    if match_short:
        return match_short.group(1)

    return None

def fetch_comments(api_key, video_url, max_comments=500):
   
    video_id = get_video_id(video_url)
    if not video_id:
        print("Error: Invalid YouTube URL or video ID not found.")
        return []

    # Initialize the YouTube API client
    youtube = build('youtube', 'v3', developerKey=api_key)
    
    comments = []
    nextPageToken = None
    count = 0

    print(f"--- Fetching comments for Video ID: {video_id} ---")

    while count < max_comments:
        try:
            
            request = youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=min(100, max_comments - count),
                pageToken=nextPageToken
            )
            response = request.execute()
            
            for item in response.get('items', []):
                comment_text = item['snippet']['topLevelComment']['snippet']['textDisplay']
                comments.append(comment_text)
                count += 1
                if count >= max_comments:
                    break

            nextPageToken = response.get('nextPageToken')

            if not nextPageToken:
                break
            
            time.sleep(0.5) 

        except Exception as e:
            print(f"An API error occurred: {e}. Stopping collection.")
            break

    print(f"Successfully fetched {len(comments)} comments.")
    return comments