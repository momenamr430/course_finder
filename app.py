from flask import Flask, render_template, request, jsonify
from serpapi import GoogleSearch

app = Flask(__name__)

API_KEY = "6f51e7662bb7e1a670e8732a727e7c840bf4e151a999c3e4f4ca8790b49b3586"

PLATFORM_MAP = {
    "coursera": {"name": "Coursera",  "color": "#0056D2"},
    "udemy":    {"name": "Udemy",     "color": "#A435F0"},
    "edx":      {"name": "edX",       "color": "#00B8A9"},
    "udacity":  {"name": "Udacity",   "color": "#02B3E4"},
    "linkedin": {"name": "LinkedIn",  "color": "#0A66C2"},
    "youtube":  {"name": "YouTube",   "color": "#FF4444"},
}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/search")
def search():
    query = request.args.get("q", "").strip()
    page  = int(request.args.get("page", 0))

    if not query:
        return jsonify({"error": "Query is required"}), 400

    try:
        params = {
            "engine":  "google",
            "api_key": API_KEY,
            "hl": "en", "gl": "us",
            "start": page * 10,
            "q": (f"{query} course site:coursera.org OR site:udemy.com "
                  "OR site:edx.org OR site:udacity.com "
                  "OR site:linkedin.com/learning OR site:youtube.com"),
        }
        raw = GoogleSearch(params).get_dict().get("organic_results", [])

        results = []
        for r in raw:
            link = r.get("link", "")
            key  = next((k for k in PLATFORM_MAP if k in link), None)
            if not key:
                continue
            domain = link.split("/")[2] if "//" in link else link
            results.append({
                "title":    r.get("title", "Untitled"),
                "link":     link,
                "domain":   domain,
                "snippet":  r.get("snippet", ""),
                "platform": PLATFORM_MAP[key]["name"],
                "color":    PLATFORM_MAP[key]["color"],
                "key":      key,
            })

        return jsonify({"results": results, "page": page, "query": query})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
