import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.models import db
from src.routes.auth import auth_bp
from src.routes.files import files_bp
from src.routes.ocr import ocr_bp
from src.routes.resume import resume_bp
from src.routes.company import company_bp
from src.routes.letter import letter_bp
from src.routes.email import email_bp
from src.routes.settings import settings_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS
CORS(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(files_bp, url_prefix='/api/files')
app.register_blueprint(ocr_bp, url_prefix='/api/ocr')
app.register_blueprint(resume_bp, url_prefix='/api/resume')
app.register_blueprint(company_bp, url_prefix='/api/company')
app.register_blueprint(letter_bp, url_prefix='/api/letter')
app.register_blueprint(email_bp, url_prefix='/api/email')
app.register_blueprint(settings_bp, url_prefix='/api/settings')

# uncomment if you need to use database
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
