// System Prompt for Car Assistant
const SYSTEM_PROMPT = `Ты — профессиональный помощник по подбору автомобилей из Европы. Твоя задача — помогать пользователям выбирать, проверять и покупать автомобили из европейских стран (Германия, Франция, Италия, Испания, Нидерланды, Бельгия и др.).

## Основные функции

### 1. Поиск автомобилей
- Поиск по марке, модели, году выпуска
- Фильтрация по цене, пробегу, типу топлива, коробке передач
- Выбор страны происхождения
- Поиск по конкретным параметрам (двигатель, мощность, комплектация)

### 2. Проверка истории автомобиля
- Проверка VIN-кода
- История обслуживания и ремонтов
- Количество предыдущих владельцев
- Проверка на ДТП и повреждения
- Проверка на угон

### 3. Расчет стоимости
- Цена автомобиля
- Стоимость доставки
- Таможенные пошлины и сборы
- Регистрация и оформление
- Итоговая стоимость "под ключ"

### 4. Информация о рынке
- Актуальные цены на рынке
- Популярные модели в Европе
- Сезонные колебания цен
- Советы по выбору

### 5. Документация и юридические вопросы
- Список необходимых документов
- Требования к растаможке
- Экологические стандарты (Euro 5, Euro 6)
- Особенности импорта в разные страны

## Стиль общения
- Профессиональный, но дружелюбный
- Предоставляй конкретные цифры и факты
- Предупреждай о возможных рисках
- Давай практические советы
- Отвечай на русском языке

## Ограничения
- Не предоставляй информацию о нелегальных схемах импорта
- Всегда предупреждай о рисках покупки без осмотра
- Рекомендуй профессиональную проверку перед покупкой
- Не гарантируй конкретные цены — они могут меняться

## Формат ответов
1. Краткий ответ на вопрос
2. Детализированная информация (при необходимости)
3. Практические рекомендации
4. Предупреждения о рисках (если применимо)
5. Следующие шаги для пользователя`;

// API Settings
let apiSettings = {
    provider: '',
    apiKey: '',
    endpoint: '',
    model: ''
};

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('carSelectorApiSettings');
    if (saved) {
        apiSettings = JSON.parse(saved);
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('carSelectorApiSettings', JSON.stringify(apiSettings));
}

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const apiSettingsBtn = document.getElementById('apiSettingsBtn');
const apiModal = document.getElementById('apiModal');
const modalClose = document.getElementById('modalClose');
const saveApiSettings = document.getElementById('saveApiSettings');
const navLinks = document.querySelectorAll('.nav-link');
const panels = document.querySelectorAll('.panel');
const featuredSection = document.getElementById('featured');

// Initialize
loadSettings();
loadCars();
loadSettingsData();

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

apiSettingsBtn.addEventListener('click', () => {
    apiModal.classList.add('active');
    document.getElementById('apiProvider').value = apiSettings.provider;
    document.getElementById('apiKey').value = apiSettings.apiKey;
    document.getElementById('apiEndpoint').value = apiSettings.endpoint;
    document.getElementById('modelName').value = apiSettings.model;
});

modalClose.addEventListener('click', () => {
    apiModal.classList.remove('active');
});

saveApiSettings.addEventListener('click', () => {
    apiSettings.provider = document.getElementById('apiProvider').value;
    apiSettings.apiKey = document.getElementById('apiKey').value;
    apiSettings.endpoint = document.getElementById('apiEndpoint').value;
    apiSettings.model = document.getElementById('modelName').value;
    saveSettings();
    apiModal.classList.remove('active');
    showNotification('Настройки AI сохранены', 'success');
});

// Navigation
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('href').substring(1);
        
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Hide all sections
        featuredSection.classList.remove('active');
        panels.forEach(panel => panel.classList.remove('active'));
        
        // Show target section
        if (target === 'featured') {
            featuredSection.classList.add('active');
        } else {
            const targetPanel = document.getElementById(target);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        }
    });
});

// Admin Tabs
const adminTabs = document.querySelectorAll('.admin-tab');
const adminTabContents = document.querySelectorAll('.admin-tab-content');

adminTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        
        adminTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        adminTabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === target) {
                content.classList.add('active');
            }
        });
        
        if (target === 'manage-cars') {
            loadCarsTable();
        }
    });
});

// Parser Form
document.getElementById('parserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const config = {
        source: document.getElementById('parserSource').value,
        filters: {
            brand: document.getElementById('parserBrand').value || undefined,
            model: document.getElementById('parserModel').value || undefined,
            minPrice: document.getElementById('parserMinPrice').value || undefined,
            maxPrice: document.getElementById('parserMaxPrice').value || undefined,
            minYear: document.getElementById('parserMinYear').value || undefined,
            maxYear: document.getElementById('parserMaxYear').value || undefined,
            fuel: document.getElementById('parserFuel').value || undefined,
            transmission: document.getElementById('parserTransmission').value || undefined,
            country: document.getElementById('parserCountry').value || undefined
        }
    };
    
    const resultsDiv = document.getElementById('parserResults');
    const btn = document.getElementById('runParserBtn');
    
    // Show loading state
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Парсинг...';
    
    resultsDiv.innerHTML = `
        <div class="loading-bar">
            <div class="loading-bar-fill" id="loadingBar"></div>
        </div>
        <p class="loading-text" id="loadingText">Подключение к источнику...</p>
    `;
    resultsDiv.classList.add('active');
    
    // Animate loading bar
    const loadingBar = document.getElementById('loadingBar');
    const loadingText = document.getElementById('loadingText');
    let progress = 0;
    const stages = [
        'Подключение к источнику...',
        'Поиск автомобилей...',
        'Применение фильтров...',
        'Обработка данных...',
        'Сохранение результатов...'
    ];
    
    const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 100) progress = 100;
        loadingBar.style.width = progress + '%';
        
        const stageIndex = Math.floor((progress / 100) * stages.length);
        loadingText.textContent = stages[Math.min(stageIndex, stages.length - 1)];
    }, 300);
    
    try {
        const response = await fetch('/api/parser/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config })
        });
        
        clearInterval(progressInterval);
        
        if (response.ok) {
            const data = await response.json();
            
            loadingBar.style.width = '100%';
            loadingText.textContent = 'Готово!';
            
            setTimeout(() => {
                resultsDiv.innerHTML = `
                    <div class="parser-stats">
                        <div class="parser-stat-card">
                            <div class="parser-stat-value">${data.added}</div>
                            <div class="parser-stat-label">Найдено авто</div>
                        </div>
                        <div class="parser-stat-card">
                            <div class="parser-stat-value">${data.stats?.topRated || 0}</div>
                            <div class="parser-stat-label">⭐ Топ рейтинг</div>
                        </div>
                        <div class="parser-stat-card">
                            <div class="parser-stat-value">${data.stats?.goodDeals || 0}</div>
                            <div class="parser-stat-label">💰 Выгодные</div>
                        </div>
                        <div class="parser-stat-card">
                            <div class="parser-stat-value">${data.stats?.avgRating || 0}</div>
                            <div class="parser-stat-label">Средний рейтинг</div>
                        </div>
                    </div>
                    <h4 style="margin-bottom: 16px;">📋 Найденные автомобили (отсортированы по рейтингу):</h4>
                    <div class="parser-cars-preview">
                        ${data.cars.slice(0, 8).map(car => `
                            <div class="parser-car-item">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                    <h5>${car.brand} ${car.model}</h5>
                                    <span style="background: ${car.rating >= 80 ? '#10b981' : car.rating >= 70 ? '#3b82f6' : '#f59e0b'}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 700;">⭐ ${car.rating}</span>
                                </div>
                                <p>📅 ${car.year} • 🛣️ ${(car.mileage/1000).toFixed(0)}k км</p>
                                <p>⚙️ ${car.engine} • ${car.power} л.с.</p>
                                ${car.owners ? `<p>👤 ${car.owners} владел${car.owners === 1 ? 'ец' : 'ьца'}</p>` : ''}
                                ${car.serviceHistory ? `<p>📖 ${car.serviceHistory.length} записей ТО</p>` : ''}
                                <p>📍 ${getCountryFlag(car.country)} ${car.location}</p>
                                <div class="parser-car-price">
                                    ${car.price.toLocaleString()} €
                                    ${car.priceAdvantage && car.priceAdvantage > 2000 ? 
                                        `<span style="font-size: 12px; color: #10b981; display: block;">💰 Выгода ${car.priceAdvantage.toLocaleString()} €</span>` : 
                                        ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    ${data.added > 8 ? `<p style="text-align: center; color: var(--text-secondary); margin-top: 16px;">+ ещё ${data.added - 8} автомобилей</p>` : ''}
                    <button class="btn btn-primary" style="margin-top: 20px; width: 100%;" onclick="loadCars(); showNotification('Автомобили добавлены в каталог!', 'success');">
                        ✅ Показать все в каталоге
                    </button>
                `;
            }, 500);
            
            // Reload cars
            loadCars();
            
            showNotification(`Найдено ${data.added} автомобилей!`, 'success');
        } else {
            throw new Error('Ошибка парсинга');
        }
    } catch (error) {
        clearInterval(progressInterval);
        resultsDiv.innerHTML = `
            <p style="color: var(--danger-color); text-align: center; padding: 40px;">
                ❌ Ошибка: ${error.message}
            </p>
        `;
        showNotification('Ошибка парсинга: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🚀 Запустить парсинг';
    }
});

// Clear parser filters
document.getElementById('clearParserBtn').addEventListener('click', () => {
    document.getElementById('parserForm').reset();
    document.getElementById('parserResults').innerHTML = '';
    document.getElementById('parserResults').classList.remove('active');
    showNotification('Фильтры очищены', 'info');
});

// Search Form
const searchForm = document.getElementById('searchForm');
if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const params = new URLSearchParams();
        
        const brand = document.getElementById('brand')?.value;
        const model = document.getElementById('model')?.value;
        const yearFrom = document.getElementById('yearFrom')?.value;
        const yearTo = document.getElementById('yearTo')?.value;
        const priceFrom = document.getElementById('priceFrom')?.value;
        const priceTo = document.getElementById('priceTo')?.value;
        const country = document.getElementById('country')?.value;
        const fuel = document.getElementById('fuel')?.value;
        
        if (brand) params.append('brand', brand);
        if (model) params.append('model', model);
        if (yearFrom) params.append('minYear', yearFrom);
        if (yearTo) params.append('maxYear', yearTo);
        if (priceFrom) params.append('minPrice', priceFrom);
        if (priceTo) params.append('maxPrice', priceTo);
        if (country) params.append('country', country);
        if (fuel) params.append('fuel', fuel);
        
        const query = params.toString();
        
        try {
            const response = await fetch(`/api/cars${query ? '?' + query : ''}`);
            const data = await response.json();
            
            // Switch to featured tab and show results
            document.querySelector('[href="#featured"]')?.click();
            
            if (data.cars.length === 0) {
                showNotification('Автомобили не найдены', 'info');
            } else {
                showNotification(`Найдено ${data.total} автомобилей`, 'success');
            }
        } catch (error) {
            showNotification('Ошибка поиска: ' + error.message, 'error');
        }
    });
}

// Add Car Form
document.getElementById('addCarForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const carData = {
        brand: document.getElementById('acBrand').value,
        model: document.getElementById('acModel').value,
        year: parseInt(document.getElementById('acYear').value),
        price: parseInt(document.getElementById('acPrice').value),
        mileage: parseInt(document.getElementById('acMileage').value),
        vin: document.getElementById('acVin').value,
        engine: document.getElementById('acEngine').value,
        power: parseInt(document.getElementById('acPower').value),
        transmission: document.getElementById('acTransmission').value,
        fuel: document.getElementById('acFuel').value,
        country: document.getElementById('acCountry').value,
        location: document.getElementById('acLocation').value,
        description: document.getElementById('acDescription').value,
        features: document.getElementById('acFeatures').value.split(',').map(f => f.trim()).filter(f => f),
        images: document.getElementById('acImages').value.split(',').map(i => i.trim()).filter(i => i)
    };
    
    try {
        const response = await fetch('/api/cars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(carData)
        });
        
        if (response.ok) {
            showNotification('Автомобиль успешно добавлен!', 'success');
            document.getElementById('addCarForm').reset();
            loadCars();
        } else {
            throw new Error('Ошибка при добавлении');
        }
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
});

// Settings Form
document.getElementById('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const settingsData = {
        contactEmail: document.getElementById('setEmail').value,
        contactPhone: document.getElementById('setPhone').value,
        deliveryFrom: parseInt(document.getElementById('setDelivery').value)
    };
    
    try {
        const response = await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsData)
        });
        
        if (response.ok) {
            showNotification('Настройки сохранены!', 'success');
        } else {
            throw new Error('Ошибка при сохранении');
        }
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
});

// Load cars from API
async function loadCars() {
    try {
        const response = await fetch('/api/cars');
        const data = await response.json();
        renderCars(data.cars);
    } catch (error) {
        console.error('Error loading cars:', error);
    }
}

// Render cars grid
function renderCars(cars) {
    const grid = document.getElementById('carsGrid');
    
    if (cars.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); grid-column: 1/-1; padding: 60px 20px;">🚗 Пока нет автомобилей. Запустите парсер в разделе "🔧 Админ" → "🕸️ Парсер" чтобы добавить лучшие варианты!</p>';
        return;
    }
    
    grid.innerHTML = cars.map(car => `
        <div class="car-card-featured" onclick="showCarDetail(${car.id})">
            <div class="car-card-image">
                ${car.images && car.images[0] 
                    ? `<img src="${car.images[0]}" alt="${car.brand} ${car.model}" onerror="this.style.display='none';this.parentElement.innerHTML='🚗'">`
                    : '🚗'}
                <span class="car-card-badge ${car.qualityBadge?.class || ''}">${car.qualityBadge?.label || 'В наличии'}</span>
                ${car.rating ? `<div class="car-card-rating">⭐ ${car.rating}</div>` : ''}
            </div>
            <div class="car-card-content">
                <h3 class="car-card-title">${car.brand} ${car.model}</h3>
                <div class="car-card-price">${car.price.toLocaleString()} €</div>
                ${car.priceAdvantage && car.priceAdvantage > 2000 ? 
                    `<div class="price-advantage">💰 Выгода ${car.priceAdvantage.toLocaleString()} €</div>` : 
                    ''}
                <div class="car-card-specs">
                    <span class="car-card-spec">📅 ${car.year}</span>
                    <span class="car-card-spec">🛣️ ${(car.mileage / 1000).toFixed(0)}k км</span>
                    <span class="car-card-spec">⚙️ ${car.transmission}</span>
                    <span class="car-card-spec">⛽ ${getFuelName(car.fuel)}</span>
                </div>
                ${car.owners ? `
                    <div class="owner-info" style="margin-bottom: 12px;">
                        <div class="owner-count">${car.owners}</div>
                        <div>
                            <div style="font-size: 12px; color: var(--text-secondary);">Владелец${car.owners === 1 ? 'ь' : 'ей'}</div>
                            <div style="font-size: 13px; font-weight: 500;">${car.owners === 1 ? 'Один владелец' : 'Несколько владельцев'}</div>
                        </div>
                    </div>
                ` : ''}
                <div class="car-card-location">
                    📍 ${getCountryFlag(car.country)} ${car.location}
                </div>
                <div class="car-card-actions">
                    <button class="btn-details">Подробнее</button>
                    <button class="btn-contact" onclick="event.stopPropagation(); contactAboutCar('${car.brand} ${car.model}')">Связаться</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Load cars table for admin
async function loadCarsTable() {
    try {
        const response = await fetch('/api/cars');
        const data = await response.json();
        const table = document.getElementById('carsTable');
        
        if (data.cars.length === 0) {
            table.innerHTML = '<p style="text-align: center; padding: 40px; color: var(--text-secondary);">Нет автомобилей</p>';
            return;
        }
        
        table.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Автомобиль</th>
                        <th>Год</th>
                        <th>Цена</th>
                        <th>Пробег</th>
                        <th>Страна</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.cars.map(car => `
                        <tr>
                            <td>${car.id}</td>
                            <td><strong>${car.brand} ${car.model}</strong></td>
                            <td>${car.year}</td>
                            <td>${car.price.toLocaleString()} €</td>
                            <td>${car.mileage.toLocaleString()} км</td>
                            <td>${getCountryFlag(car.country)} ${getCountryName(car.country)}</td>
                            <td><span class="status-badge status-${car.status}">${getStatusName(car.status)}</span></td>
                            <td class="cars-table-actions">
                                <button class="btn-small btn-edit" onclick="editCar(${car.id})">✏️</button>
                                <button class="btn-small btn-delete" onclick="deleteCar(${car.id})">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading cars table:', error);
    }
}

// Load settings
async function loadSettingsData() {
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        
        if (settings.contactEmail) document.getElementById('setEmail').value = settings.contactEmail;
        if (settings.contactPhone) document.getElementById('setPhone').value = settings.contactPhone;
        if (settings.deliveryFrom) document.getElementById('setDelivery').value = settings.deliveryFrom;
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Show car detail modal
window.showCarDetail = function(carId) {
    fetch(`/api/cars/${carId}`)
        .then(res => res.json())
        .then(car => {
            const modal = document.getElementById('carDetailModal');
            
            // Calculate total service cost
            const totalServiceCost = car.serviceHistory?.reduce((sum, s) => sum + s.cost, 0) || 0;
            
            document.getElementById('carDetailContent').innerHTML = `
                <div class="car-detail-images">
                    <div class="car-detail-main-image">
                        ${car.images && car.images[0]
                            ? `<img src="${car.images[0]}" alt="${car.brand} ${car.model}" onerror="this.style.display='none';this.parentElement.innerHTML='🚗'">`
                            : '🚗'}
                    </div>
                </div>
                <div class="car-detail-info">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                        <h3>${car.brand} ${car.model}</h3>
                        ${car.qualityBadge ? `<span class="status-badge status-${car.qualityBadge.class}">${car.qualityBadge.label}</span>` : ''}
                    </div>
                    
                    <div class="car-detail-price">
                        ${car.price.toLocaleString()} €
                        ${car.marketPrice && car.price < car.marketPrice ? 
                            `<span style="font-size: 16px; color: var(--text-secondary); text-decoration: line-through; margin-left: 12px;">${car.marketPrice.toLocaleString()} €</span>` : 
                            ''}
                    </div>
                    
                    ${car.priceAdvantage && car.priceAdvantage > 2000 ? 
                        `<div class="price-advantage">💰 Выгода ${car.priceAdvantage.toLocaleString()} € ниже рынка</div>` : 
                        ''}
                    
                    ${car.rating ? `
                        <div style="display: flex; align-items: center; gap: 12px; margin: 16px 0; padding: 16px; background: var(--bg-color); border-radius: 12px;">
                            <div style="font-size: 32px;">⭐</div>
                            <div>
                                <div style="font-size: 24px; font-weight: 700;">${car.rating}/100</div>
                                <div style="font-size: 13px; color: var(--text-secondary);">Рейтинг автомобиля</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="car-info-grid">
                        <div class="car-info-item">
                            <div class="car-info-label">Год выпуска</div>
                            <div class="car-info-value">📅 ${car.year}</div>
                        </div>
                        <div class="car-info-item">
                            <div class="car-info-label">Пробег</div>
                            <div class="car-info-value">🛣️ ${car.mileage.toLocaleString()} км</div>
                        </div>
                        <div class="car-info-item">
                            <div class="car-info-label">Двигатель</div>
                            <div class="car-info-value">⚙️ ${car.engine}</div>
                        </div>
                        <div class="car-info-item">
                            <div class="car-info-label">Мощность</div>
                            <div class="car-info-value">🐎 ${car.power} л.с.</div>
                        </div>
                        <div class="car-info-item">
                            <div class="car-info-label">Коробка</div>
                            <div class="car-info-value">🔧 ${car.transmission}</div>
                        </div>
                        <div class="car-info-item">
                            <div class="car-info-label">Топливо</div>
                            <div class="car-info-value">⛽ ${getFuelName(car.fuel)}</div>
                        </div>
                    </div>
                    
                    ${car.owners ? `
                        <div class="owner-info">
                            <div class="owner-count">${car.owners}</div>
                            <div>
                                <div style="font-size: 12px; color: var(--text-secondary);">Количество владельцев</div>
                                <div style="font-size: 15px; font-weight: 600;">${car.owners === 1 ? 'Один владелец — отличный вариант!' : `${car.owners} владельца`}</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${car.warranty ? `
                        <div style="padding: 16px; background: #d1fae5; border-radius: 12px; margin: 16px 0;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <span style="font-size: 24px;">🛡️</span>
                                <div>
                                    <div style="font-weight: 600; color: #059669;">Действующая гарантия</div>
                                    <div style="font-size: 13px; color: #047857;">${car.warranty.type}</div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="car-detail-description">
                        <h4>📝 Описание</h4>
                        <p>${car.description}</p>
                    </div>
                    
                    ${car.features && car.features.length > 0 ? `
                        <div class="car-detail-features">
                            <h4>🎁 Опции и оборудование</h4>
                            <ul>
                                ${car.features.map(f => `<li>${f}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${car.serviceHistory && car.serviceHistory.length > 0 ? `
                        <div class="service-history">
                            <h4>📖 История обслуживания (${car.serviceHistory.length} записей)</h4>
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 12px; background: var(--card-bg); border-radius: 8px;">
                                <div>
                                    <div style="font-size: 13px; color: var(--text-secondary);">Общая стоимость ТО</div>
                                    <div style="font-size: 20px; font-weight: 700; color: var(--primary-color);">${totalServiceCost.toLocaleString()} €</div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-size: 13px; color: var(--text-secondary);">Последнее ТО</div>
                                    <div style="font-weight: 600;">${car.serviceHistory[car.serviceHistory.length - 1].year} г.</div>
                                </div>
                            </div>
                            <div class="service-timeline">
                                ${car.serviceHistory.map(service => `
                                    <div class="service-item">
                                        <div class="service-item-header">
                                            <div class="service-item-service">${service.service}</div>
                                            <div class="service-item-cost">${service.cost} €</div>
                                        </div>
                                        <div class="service-item-details">
                                            <span>📅 ${service.year} г.</span>
                                            <span>🛣️ ${service.mileage.toLocaleString()} км</span>
                                            <span>🏢 ${service.dealer}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="car-detail-location">
                        <h4>📍 Местоположение</h4>
                        <p style="font-size: 16px;">${getCountryFlag(car.country)} ${car.location}</p>
                        ${car.vin ? `<p style="font-size: 14px; color: var(--text-secondary); margin-top: 8px;"><strong>VIN:</strong> ${car.vin}</p>` : ''}
                    </div>
                    
                    <div class="car-detail-actions">
                        <button class="btn-details" onclick="contactAboutCar('${car.brand} ${car.model}')">📞 Связаться с продавцом</button>
                        <button class="btn-contact" onclick="calculateDelivery(${car.price}, '${car.country}')">💰 Рассчитать доставку</button>
                    </div>
                </div>
            `;
            modal.classList.add('active');
        });
};

// Contact about car
window.contactAboutCar = function(carName) {
    const message = `Здравствуйте! Меня интересует ${carName}. Расскажите подробнее о состоянии автомобиля и условиях покупки.`;
    addMessage(message, 'user');
    sendToAI(`Пользователь интересуется автомобилем: ${carName}. Дайте рекомендации по вопросам, которые стоит задать продавцу, и на что обратить внимание при покупке.`);
    
    // Close modal if open
    document.getElementById('carDetailModal')?.classList.remove('active');
};

// Calculate delivery
window.calculateDelivery = function(price, country) {
    const query = `Рассчитай стоимость доставки и растаможки автомобиля за ${price}€ из ${getCountryName(country)} в Россию.`;
    addMessage(query, 'user');
    sendToAI(query);
    
    document.getElementById('carDetailModal')?.classList.remove('active');
};

// Edit car
window.editCar = function(carId) {
    fetch(`/api/cars/${carId}`)
        .then(res => res.json())
        .then(car => {
            // Switch to add tab and populate form
            document.querySelector('[data-tab="add-car"]').click();
            
            document.getElementById('acBrand').value = car.brand;
            document.getElementById('acModel').value = car.model;
            document.getElementById('acYear').value = car.year;
            document.getElementById('acPrice').value = car.price;
            document.getElementById('acMileage').value = car.mileage;
            document.getElementById('acVin').value = car.vin || '';
            document.getElementById('acEngine').value = car.engine;
            document.getElementById('acPower').value = car.power;
            document.getElementById('acTransmission').value = car.transmission;
            document.getElementById('acFuel').value = car.fuel;
            document.getElementById('acCountry').value = car.country;
            document.getElementById('acLocation').value = car.location;
            document.getElementById('acDescription').value = car.description;
            document.getElementById('acFeatures').value = car.features?.join(', ') || '';
            document.getElementById('acImages').value = car.images?.join(', ') || '';
            
            // Change form submit to update
            const form = document.getElementById('addCarForm');
            const originalHandler = form.onsubmit;
            form.onsubmit = async (e) => {
                e.preventDefault();
                const updatedData = {
                    brand: document.getElementById('acBrand').value,
                    model: document.getElementById('acModel').value,
                    year: parseInt(document.getElementById('acYear').value),
                    price: parseInt(document.getElementById('acPrice').value),
                    mileage: parseInt(document.getElementById('acMileage').value),
                    vin: document.getElementById('acVin').value,
                    engine: document.getElementById('acEngine').value,
                    power: parseInt(document.getElementById('acPower').value),
                    transmission: document.getElementById('acTransmission').value,
                    fuel: document.getElementById('acFuel').value,
                    country: document.getElementById('acCountry').value,
                    location: document.getElementById('acLocation').value,
                    description: document.getElementById('acDescription').value,
                    features: document.getElementById('acFeatures').value.split(',').map(f => f.trim()).filter(f => f),
                    images: document.getElementById('acImages').value.split(',').map(i => i.trim()).filter(i => i)
                };
                
                const response = await fetch(`/api/cars/${carId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });
                
                if (response.ok) {
                    showNotification('Автомобиль обновлен!', 'success');
                    form.onsubmit = originalHandler;
                    loadCars();
                }
            };
            
            showNotification('Заполните форму для редактирования', 'info');
        });
};

// Delete car
window.deleteCar = async function(carId) {
    if (!confirm('Вы уверены, что хотите удалить этот автомобиль?')) return;
    
    try {
        const response = await fetch(`/api/cars/${carId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showNotification('Автомобиль удален', 'success');
            loadCarsTable();
            loadCars();
        } else {
            throw new Error('Ошибка при удалении');
        }
    } catch (error) {
        showNotification('Ошибка: ' + error.message, 'error');
    }
};

// Helper functions
function getFuelName(fuel) {
    const names = {
        'diesel': 'Дизель',
        'petrol': 'Бензин',
        'hybrid': 'Гибрид',
        'electric': 'Электро'
    };
    return names[fuel] || fuel;
}

function getCountryFlag(code) {
    const flags = {
        'DE': '🇩🇪',
        'FR': '🇫🇷',
        'IT': '🇮🇹',
        'ES': '🇪🇸',
        'NL': '🇳🇱',
        'BE': '🇧🇪',
        'PL': '🇵🇱',
        'AT': '🇦🇹',
        'CH': '🇨🇭'
    };
    return flags[code] || '';
}

function getCountryName(code) {
    const names = {
        'DE': 'Германия',
        'FR': 'Франция',
        'IT': 'Италия',
        'ES': 'Испания',
        'NL': 'Нидерланды',
        'BE': 'Бельгия',
        'PL': 'Польша',
        'AT': 'Австрия',
        'CH': 'Швейцария'
    };
    return names[code] || code;
}

function getSourceName(source) {
    const names = {
        'mobile.de': 'Mobile.de',
        'autoscout24': 'AutoScout24',
        'leboncoin': 'LeBonCoin',
        'marktplaats': 'Marktplaats',
        'autovit': 'Autovit'
    };
    return names[source] || source;
}

function getStatusName(status) {
    const names = {
        'available': 'В наличии',
        'sold': 'Продан',
        'reserved': 'Забронирован'
    };
    return names[status] || status;
}

// Add message to chat
function addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (type === 'assistant') {
        contentDiv.innerHTML = formatMessage(text);
    } else {
        contentDiv.textContent = text;
    }
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format assistant message
function formatMessage(text) {
    let html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n- /g, '\n<li>')
        .replace(/\n\d\. /g, '\n<li>');
    
    html = '<p>' + html + '</p>';
    
    return html;
}

// Send message
async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    
    addMessage(text, 'user');
    chatInput.value = '';
    
    await sendToAI(text);
}

// Send to AI API
async function sendToAI(message) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<span class="loading"></span>';
    
    const responseDiv = document.createElement('div');
    responseDiv.className = 'message assistant';
    responseDiv.innerHTML = '<div class="message-content"><span class="loading"></span></div>';
    chatMessages.appendChild(responseDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    try {
        const response = await callAIAPI(message);
        responseDiv.querySelector('.message-content').innerHTML = formatMessage(response);
    } catch (error) {
        responseDiv.querySelector('.message-content').innerHTML = 
            `<p style="color: var(--danger-color);">Ошибка: ${error.message}</p>
             <p>Проверьте настройки AI (кнопка ⚙️ AI в правом верхнем углу)</p>`;
    }
    
    sendBtn.disabled = false;
    sendBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"/>
        </svg>
    `;
}

// Call AI API
async function callAIAPI(message) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message }
    ];
    
    if (apiSettings.provider === 'openai' || apiSettings.provider === 'qwen') {
        return await callOpenAICompatible(messages);
    } else if (apiSettings.provider === 'anthropic') {
        return await callAnthropic(messages);
    } else if (apiSettings.provider === 'custom') {
        return await callCustomAPI(messages);
    } else {
        return await mockResponse(message);
    }
}

// OpenAI-compatible API
async function callOpenAICompatible(messages) {
    if (!apiSettings.apiKey) {
        throw new Error('Не указан API ключ');
    }
    
    const endpoint = apiSettings.provider === 'qwen' 
        ? 'https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
        : 'https://api.openai.com/v1/chat/completions';
    
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiSettings.apiKey}`
        },
        body: JSON.stringify({
            model: apiSettings.model || 'gpt-3.5-turbo',
            messages: messages,
            max_tokens: 1500
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Ошибка API');
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Нет ответа от API';
}

// Anthropic API
async function callAnthropic(messages) {
    if (!apiSettings.apiKey) {
        throw new Error('Не указан API ключ');
    }
    
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiSettings.apiKey,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: apiSettings.model || 'claude-3-sonnet-20240229',
            max_tokens: 1500,
            system: systemMessage?.content || '',
            messages: userMessages
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Ошибка API');
    }
    
    const data = await response.json();
    return data.content?.[0]?.text || 'Нет ответа от API';
}

// Custom API
async function callCustomAPI(messages) {
    if (!apiSettings.endpoint) {
        throw new Error('Не указан API endpoint');
    }
    
    const response = await fetch(apiSettings.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(apiSettings.apiKey && { 'Authorization': `Bearer ${apiSettings.apiKey}` })
        },
        body: JSON.stringify({
            model: apiSettings.model,
            messages: messages
        })
    });
    
    if (!response.ok) {
        throw new Error(`Ошибка API: ${response.status}`);
    }
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content || data.content || 'Нет ответа от API';
}

// Mock response
async function mockResponse(message) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('bmw') || lowerMessage.includes('mercedes') || lowerMessage.includes('audi')) {
        return `## 🚗 Найденные автомобили

У нас есть несколько отличных вариантов в разделе **"Избранные автомобили"**!

Посмотрите доступные автомобили на главной странице или задайте конкретные параметры для поиска.

**Популярные модели:**
- BMW 5 Series от 28 500€
- Mercedes E-Class от 26 900€
- Audi A6 от 29 500€

Хотите рассчитать стоимость доставки и растаможки?`;
    }
    
    if (lowerMessage.includes('vin')) {
        return `## 📋 Проверка VIN

Для проверки VIN-кода используйте официальные сервисы:
- **CarVertical** — международная база
- **AutoDNA** — европейские авто
- **Fabas** — немецкие авто

**Что можно узнать:**
- История обслуживания
- Количество владельцев
- ДТП и повреждения
- Реальный пробег

Введите VIN-код и я помогу интерпретировать результаты!`;
    }
    
    if (lowerMessage.includes('рассчитай') || lowerMessage.includes('калькулятор') || lowerMessage.includes('стоимость')) {
        return `## 💰 Расчет стоимости ввоза

**Пример для авто за 25 000€ с двигателем 2.0L:**

| Статья расходов | Сумма |
|----------------|-------|
| Цена авто | 25 000€ |
| Пошлина (48%) | 12 000€ |
| Акциз | 860€ |
| Утильсбор | 3 400€ |
| НДС (20%) | 5 172€ |
| Доставка | 1 200€ |
| **ИТОГО** | **47 632€** |

Для точного расчета укажите:
1. Цену автомобиля
2. Объем двигателя
3. Год выпуска
4. Страну вывоза`;
    }
    
    return `## 👋 Приветствую!

Я — помощник по подбору автомобилей из Европы.

**Чем могу помочь:**
1. **🏆 Избранные авто** — посмотрите лучшие предложения на главной
2. **🔍 Поиск** — найду варианты по вашим параметрам
3. **📋 VIN проверка** — проверю историю
4. **💰 Расчет** — рассчитаю пошлины и доставку

**Популярные запросы:**
- "Покажи BMW 5 серии до 30000€"
- "Сколько стоит растаможить Mercedes E200?"
- "Какие документы нужны для ввоза?"

Выберите раздел сверху или задайте вопрос!`;
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
        color: white;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add car detail modal to HTML
const carDetailModal = document.createElement('div');
carDetailModal.id = 'carDetailModal';
carDetailModal.className = 'modal';
carDetailModal.innerHTML = `
    <div class="modal-content car-detail-content">
        <div class="modal-header">
            <h3>🚗 Информация об автомобиле</h3>
            <button class="modal-close" onclick="document.getElementById('carDetailModal').classList.remove('active')">&times;</button>
        </div>
        <div class="modal-body" id="carDetailContent">
            <!-- Car details will be loaded here -->
        </div>
    </div>
`;
document.body.appendChild(carDetailModal);

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize view
featuredSection.classList.add('active');
panels.forEach(panel => panel.classList.remove('active'));

