import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io

# Путь к файлу ключей сервисного аккаунта Google (нужно будет положить в эту папку)
SCOPES = ['https://www.googleapis.com/auth/drive.file']
SERVICE_ACCOUNT_FILE = os.path.join(os.path.dirname(__file__), 'credentials.json')

# ID папки в Google Drive, куда будут сохраняться файлы (настраивается в .env или config)
# Если None - сохраняется в корень
TARGET_FOLDER_ID = os.getenv('GDRIVE_FOLDER_ID', None)

def get_drive_service():
    """Инициализация клиента Google Drive."""
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        return None
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    return build('drive', 'v3', credentials=creds)

def upload_file_to_gdrive(file_obj, filename: str, mime_type: str):
    """
    Загружает файл в Google Drive.
    Возвращает URL для просмотра файла или None в случае ошибки.
    """
    service = get_drive_service()
    if not service:
        print("Ошибка: Файл credentials.json не найден. Загрузка в Google Drive пропущена.")
        return None

    try:
        file_metadata = {'name': filename}
        if TARGET_FOLDER_ID:
            file_metadata['parents'] = [TARGET_FOLDER_ID]

        # Используем in-memory буфер для загрузки
        media = MediaIoBaseUpload(file_obj, mimetype=mime_type, resumable=True)

        uploaded_file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, webViewLink'
        ).execute()
        
        # Даем права на чтение всем, у кого есть ссылка (опционально, если нужно открывать с фронтенда)
        service.permissions().create(
            fileId=uploaded_file.get('id'),
            body={'type': 'anyone', 'role': 'reader'}
        ).execute()

        return uploaded_file.get('webViewLink')
        
    except Exception as e:
        print(f"Ошибка при загрузке в Google Drive: {e}")
        return None
