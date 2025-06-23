# Configurar entorno virtual y dependencias
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install flask==2.1.0 flask-cors==3.0.10 pymongo==4.3.3 python-dotenv==0.21.0 marshmallow==3.19.0 flask-jwt-extended==4.4.4 reportlab==4.0.8 xhtml2pdf==0.2.11
flask run --port 5000
