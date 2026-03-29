import urllib.request
import urllib.parse
import json

url = "http://127.0.0.1:8000/results"
try:
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req) as response:
        print("STATUS:", response.status)
        print("RESPONSE:", response.read().decode('utf-8'))
except Exception as e:
    print("FAILED:", str(e))
