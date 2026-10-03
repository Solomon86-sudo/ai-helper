import time
import os
import requests
import win32com.client
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# --- НАСТРОЙКИ ---
WATCH_DIR = r"C:\Path\To\Your\Project\Folder"  # Папка, где лежит файл графика .mpp
TARGET_FILE = "ЖК_Астра_График.mpp"            # Имя файла, за которым следим
API_URL = "https://ai-helper-backend-2u9t.onrender.com/api/erp/schedule/import" # URL сервера ERP
# -----------------

class MSProjectHandler(FileSystemEventHandler):
    def on_modified(self, event):
        # Реагируем только на сохранение нашего конкретного mpp файла
        if not event.is_directory and event.src_path.endswith(TARGET_FILE):
            print(f"\n[🔄] Замечено сохранение файла: {event.src_path}")
            self.process_and_upload(event.src_path)

    def process_and_upload(self, mpp_path):
        xml_path = mpp_path.replace(".mpp", ".xml")
        
        try:
            print("[⏳] Подключение к MS Project (COM-интерфейс)...")
            # Подключаемся к запущенному MS Project
            msp = win32com.client.Dispatch("MSProject.Application")
            msp.DisplayAlerts = False 
            
            # Фоновое открытие и экспорт в XML
            msp.FileOpen(mpp_path)
            print(f"[⏳] Экспорт графика в XML: {xml_path}")
            msp.FileSaveAs(Name=xml_path, FormatID="MSProject.XML")
            msp.FileClose(0)  # Закрываем файл (0 = без сохранения изменений в самом mpp)
            
            print("[✅] Конвертация успешна. Отправка на сервер ERP...")
            self.upload_to_server(xml_path)
            
        except Exception as e:
            print(f"[❌] Ошибка при работе с MS Project: {e}")

    def upload_to_server(self, xml_path):
        try:
            with open(xml_path, 'rb') as f:
                files = {'file': (os.path.basename(xml_path), f, 'application/xml')}
                # Пока закомментировано, чтобы не спамить тестовый бэкенд
                # response = requests.post(API_URL, files=files)
                # if response.status_code == 200:
                #     print(f"[✅] График успешно обновлен в ERP!")
                # else:
                #     print(f"[❌] Ошибка сервера: {response.text}")
                print(f"[✅] Имитация отправки: файл {os.path.basename(xml_path)} готов к загрузке в БД.")
        except Exception as e:
            print(f"[❌] Ошибка отправки: {e}")

if __name__ == "__main__":
    print(f"==================================================")
    print(f"🚀 Агент синхронизации MS Project <-> ERP запущен")
    print(f"Отслеживается папка: {WATCH_DIR}")
    print(f"Отслеживается файл:  {TARGET_FILE}")
    print(f"Для остановки нажмите Ctrl+C")
    print(f"==================================================\n")
    
    event_handler = MSProjectHandler()
    observer = Observer()
    observer.schedule(event_handler, WATCH_DIR, recursive=False)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
