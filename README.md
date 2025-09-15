🚚 Truck Driver Logger

A modern, full-stack application for truck drivers to log trips, manage hours of service, and visualize routes. Built with Django (backend) and React + Vite (frontend).

## ✨ Features

- 📝 Log trip details, stops, and events
- 🗺️ Interactive map view for routes
- ⏰ Hours of Service (HOS) compliance tracking
- 📊 Trip summaries and results
- 🔒 Secure user authentication (future)
- 📱 Responsive UI for desktop and mobile

## 🛠️ Tech Stack

- **Backend:** Django, Django REST Framework, SQLite
- **Frontend:** React, Vite
- **Mapping:** Custom geocoding & routing services

## 🚀 Getting Started

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📂 Project Structure

```
backend/
	└── planner/
frontend/
	└── src/components/
```

## 📸 Screenshots

_Add screenshots here!_

## 📄 License

MIT

## 🤝 Contributing

Pull requests welcome! For major changes, open an issue first to discuss what you’d like to change.
