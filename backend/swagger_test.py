from flask import Flask, jsonify
from flasgger import Swagger

app = Flask(__name__)
swagger = Swagger(app)

@app.route('/hello')
def hello():
    """
    Тестовый эндпоинт
    ---
    responses:
      200:
        description: Возвращает приветствие
    """
    return jsonify({"message": "Привет от Swagger!"})

if __name__ == '__main__':
    app.run(debug=True)