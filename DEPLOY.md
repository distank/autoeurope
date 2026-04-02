# 🚀 Инструкция по публикации сайта в интернете

## Способ 1: Render.com (САМЫЙ ПРОСТОЙ, бесплатно)

### Шаг 1: Подготовка
1. Создайте GitHub аккаунт если нет: https://github.com
2. Загрузите проект на GitHub:

```bash
cd C:\Users\dista\car_selector
git init
git add .
git commit -m "Initial commit"
# Создайте репозиторий на github.com, затем:
git remote add origin https://github.com/ВАШ_НИК/autoeurope.git
git branch -M main
git push -u origin main
```

### Шаг 2: Деплой на Render
1. Зайдите на https://render.com
2. Нажмите "Get Started for Free"
3. Войдите через GitHub
4. Нажмите "New +" → "Web Service"
5. Выберите ваш репозиторий "autoeurope"
6. Настройки:
   - **Name:** autoeurope-cars
   - **Region:** Frankfurt (ближе к Европе)
   - **Branch:** main
   - **Root Directory:** (оставьте пустым)
   - **Runtime:** Node
   - **Build Command:** `echo "No build"`
   - **Start Command:** `node server.js`
   - **Instance Type:** Free
7. Нажмите "Create Web Service"
8. Ждите 3-5 минут пока деплоится
9. Получите URL вида: `https://autoeurope-cars.onrender.com`

### Шаг 3: Купить домен (опционально)
1. Зайдите на https://namecheap.com или https://reg.ru
2. Найдите свободное имя (например: autoeurope-cars.com)
3. Купите домен (~$10-15/год)
4. В Render зайдите в Settings → Custom Domain
5. Добавьте ваш домен
6. Настройте DNS у регистратора домена

---

## Способ 2: Railway.app (Очень просто, бесплатно)

### Шаг 1: Регистрация
1. Зайдите на https://railway.app
2. Нажмите "Start a New Project"
3. Войдите через GitHub

### Шаг 2: Деплой
1. Нажмите "Deploy from GitHub repo"
2. Выберите репозиторий autoeurope
3. Railway автоматически определит Node.js
4. Нажмите "Deploy"
5. Через 2-3 минуты сайт будет доступен
6. URL: `https://autoeurope-production.up.railway.app`

### Шаг 3: Свой домен
1. В проекте зайдите в Settings
2. Нажмите "Domains" → "Add Custom Domain"
3. Введите ваш домен
4. Настройте DNS у регистратора

---

## Способ 3: Vercel (Быстро, бесплатно)

### Через консоль:
```bash
npm install -g vercel
cd C:\Users\dista\car_selector
vercel login
vercel --prod
```

### Через сайт:
1. Зайдите на https://vercel.com
2. Войдите через GitHub
3. "Add New Project"
4. Импортируйте репозиторий
5. Нажмите "Deploy"

---

## Способ 4: VPS сервер (Платно, ~500₽/месяц)

### Аренда сервера:
1. Timeweb Cloud: https://timeweb.cloud (от 150₽/мес)
2. Selectel: https://selectel.ru (от 200₽/мес)
3. Reg.ru: https://reg.ru (от 300₽/мес)

### Настройка сервера:

```bash
# Подключение к серверу
ssh root@ВАШ_IP

# Обновление
apt update && apt upgrade -y

# Установка Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Установка PM2
npm install -g pm2

# Загрузка файлов (через git или scp)
git clone https://github.com/ВАШ_НИК/autoeurope.git
cd autoeurope

# Запуск
pm2 start server.js --name autoeurope
pm2 save
pm2 startup

# Настройка Nginx (опционально)
apt install nginx -y
nano /etc/nginx/sites-available/default
```

### Конфиг Nginx:
```nginx
server {
    listen 80;
    server_name ваш-домен.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🎯 Рекомендация

**Для начала используйте Render или Railway:**
- ✅ Бесплатно
- ✅ Не нужна карта
- ✅ Автоматический HTTPS
- ✅ Простая настройка
- ✅ Достаточно для теста

**Когда появится аудитория:**
- Купите домен (~1000₽/год)
- Перейдите на платный тариф (~500₽/мес)
- Или арендуйте VPS

---

## 📊 После публикации

1. Проверьте что сайт открывается
2. Протестируйте парсер
3. Проверьте мобильную версию
4. Поделитесь ссылкой!

---

## 🔗 Полезные ссылки

- Бесплатные домены: https://freenom.com ( .tk, .ml, .ga )
- Дешевые домены: https://namecheap.com
- Статистика сайта: https://analytics.google.com
- Мониторинг: https://uptimerobot.com
