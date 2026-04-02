# AutoEurope — Подбор автомобилей из Европы

Веб-приложение для подбора и просмотра автомобилей из Европы с системой рейтинга и историей обслуживания.

## 🚀 Быстрый старт

### Локальный запуск

```bash
cd car_selector
node server.js
```

Откройте http://localhost:3000

## 🌐 Публикация в интернете

### Вариант 1: Render (Бесплатно)

1. Зарегистрируйтесь на https://render.com
2. Создайте новый **Web Service**
3. Подключите GitHub репозиторий
4. Настройки:
   - **Build Command:** `echo "No build needed"`
   - **Start Command:** `node server.js`
   - **Environment:** Node

### Вариант 2: Railway (Бесплатно)

1. Зарегистрируйтесь на https://railway.app
2. Нажмите "New Project" → "Deploy from GitHub repo"
3. Выберите репозиторий
4. Railway автоматически определит Node.js

### Вариант 3: Vercel (Бесплатно)

```bash
npm install -g vercel
cd car_selector
vercel login
vercel --prod
```

### Вариант 4: Heroku

```bash
npm install -g heroku
heroku login
heroku create autoeurope-cars
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a autoeurope-cars
git push heroku main
```

### Вариант 5: Свой VPS сервер

1. Арендуйте сервер (Timeweb, Reg.ru, Selectel)
2. Установите Node.js
3. Загрузите файлы
4. Запустите через PM2:

```bash
npm install -g pm2
pm2 start server.js --name autoeurope
pm2 save
pm2 startup
```

## 📁 Структура

```
car_selector/
├── index.html      # Главная страница
├── styles.css      # Стили
├── app.js          # Клиентский JavaScript
├── server.js       # Сервер + API + Парсер
├── data/
│   └── cars.json   # База автомобилей
└── package.json    # Зависимости
```

## 🔧 API Endpoints

- `GET /api/cars` — Получить все автомобили
- `POST /api/cars` — Добавить автомобиль
- `PUT /api/cars/:id` — Обновить автомобиль
- `DELETE /api/cars/:id` — Удалить автомобиль
- `POST /api/parser/run` — Запустить парсер
- `GET /api/settings` — Настройки
- `PUT /api/settings` — Обновить настройки

## ⭐ Функции

- Автоматический парсинг автомобилей
- Система рейтинга (0-100)
- История обслуживания
- Расчет рыночной цены
- Поиск по фильтрам
- AI-помощник

## 📝 Лицензия

MIT
