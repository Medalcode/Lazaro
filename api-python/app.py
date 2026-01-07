from flask import Flask, jsonify
import datetime

app = Flask(__name__)
port = 5000

@app.route('/')
def home():
    return jsonify({
        'service': 'Python Data Service',
        'status': 'Active',
        'time': datetime.datetime.now().isoformat()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=port)
