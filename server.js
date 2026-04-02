const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'cars.json');
const STATIC_DIR = __dirname;

// MIME types
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Read JSON data
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { cars: [], settings: {}, parserConfig: {}, priceDatabase: {} };
    }
}

// Write JSON data
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Parse request body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            } catch (e) {
                reject(e);
            }
        });
        req.on('error', reject);
    });
}

// Calculate market price for car
function calculateMarketPrice(brand, model, year, mileage, data) {
    const priceDB = data.priceDatabase || {};
    const brandData = priceDB[brand];
    
    if (!brandData || !brandData[model]) {
        // Default pricing if not in database
        return Math.floor(Math.random() * (50000 - 15000 + 1)) + 15000;
    }
    
    const modelData = brandData[model];
    const basePrice = modelData.base;
    const yearFactor = modelData.year_factor;
    const yearsOld = 2024 - year;
    
    // Calculate base price with year depreciation
    let price = basePrice + (yearFactor * (2024 - year));
    
    // Mileage adjustment
    const avgMileagePerYear = 15000;
    const expectedMileage = yearsOld * avgMileagePerYear;
    const mileageDiff = mileage - expectedMileage;
    
    // -0.05€ per km difference
    price += mileageDiff * -0.05;
    
    // Random market variation (±5%)
    const variation = 1 + (Math.random() * 0.1 - 0.05);
    price *= variation;
    
    return Math.round(price / 100) * 100;
}

// Generate service history
function generateServiceHistory(year, mileage) {
    const yearsOld = 2024 - year;
    const services = [];
    const serviceTypes = [
        { name: 'Замена масла и фильтров', cost: [150, 300] },
        { name: 'Замена тормозных колодок', cost: [300, 600] },
        { name: 'Замена тормозных дисков', cost: [500, 900] },
        { name: 'Замена шин (комплект)', cost: [600, 1200] },
        { name: 'ТО у официального дилера', cost: [400, 800] },
        { name: 'Замена аккумулятора', cost: [200, 400] },
        { name: 'Замена сцепления', cost: [800, 1500] },
        { name: 'Замена ремня ГРМ', cost: [600, 1000] },
        { name: 'Промывка инжектора', cost: [150, 300] },
        { name: 'Замена воздушного фильтра', cost: [50, 150] }
    ];
    
    const mileagePerYear = mileage / yearsOld;
    
    for (let i = 1; i <= yearsOld; i++) {
        const serviceYear = year + i;
        const serviceMileage = Math.round(i * mileagePerYear / 1000) * 1000;
        
        // At least 1-2 services per year
        const numServices = Math.floor(Math.random() * 2) + 1;
        
        for (let j = 0; j < numServices; j++) {
            const service = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
            const cost = Math.floor(Math.random() * (service.cost[1] - service.cost[0] + 1)) + service.cost[0];
            
            services.push({
                year: serviceYear,
                mileage: serviceMileage,
                service: service.name,
                cost: cost,
                dealer: Math.random() > 0.3 ? 'Официальный дилер' : 'Независимый сервис'
            });
        }
    }
    
    // Sort by year
    services.sort((a, b) => a.year - b.year || a.mileage - b.mileage);
    
    return services;
}

// Calculate car rating (0-100)
function calculateCarRating(car) {
    let rating = 50; // Base rating
    
    // Year factor (newer is better)
    const yearsOld = 2024 - car.year;
    rating += Math.max(0, (10 - yearsOld) * 3);
    
    // Mileage factor (lower is better)
    const avgMileagePerYear = 15000;
    const expectedMileage = yearsOld * avgMileagePerYear;
    const mileageRatio = car.mileage / expectedMileage;
    
    if (mileageRatio < 0.7) rating += 15;
    else if (mileageRatio < 0.9) rating += 10;
    else if (mileageRatio < 1.1) rating += 5;
    else if (mileageRatio > 1.5) rating -= 15;
    else if (mileageRatio > 1.3) rating -= 10;
    
    // Price factor (good deal)
    const marketPrice = car.marketPrice || car.price;
    const priceRatio = car.price / marketPrice;
    
    if (priceRatio < 0.85) rating += 20; // Great deal
    else if (priceRatio < 0.95) rating += 10; // Good deal
    else if (priceRatio > 1.1) rating -= 10; // Overpriced
    
    // Service history bonus
    if (car.serviceHistory && car.serviceHistory.length > 0) {
        rating += Math.min(15, car.serviceHistory.length);
    }
    
    // One owner bonus
    if (car.owners === 1) rating += 10;
    
    // Warranty bonus
    if (car.warranty) rating += 5;
    
    // Premium features
    if (car.features && car.features.length >= 5) rating += 5;
    
    return Math.min(100, Math.max(0, rating));
}

// Generate car quality badge
function getQualityBadge(rating) {
    if (rating >= 90) return { label: '🏆 ТОП ВЫБОР', class: 'top' };
    if (rating >= 80) return { label: '⭐ ОТЛИЧНО', class: 'excellent' };
    if (rating >= 70) return { label: '✅ ХОРОШО', class: 'good' };
    if (rating >= 60) return { label: '👌 НОРМА', class: 'fair' };
    return { label: '⚠️ ПРОВЕРИТЬ', class: 'check' };
}

// Mock parser with enhanced data
function parseCarsFromSource(source, filters = {}) {
    const data = readData();
    
    const brands = {
        'BMW': ['520d', '530d', '520i', '540i', '320d', '330i', 'X3 xDrive20d', 'X5 xDrive30d'],
        'Mercedes-Benz': ['E220d', 'E300', 'E400d', 'C220d', 'C300', 'GLC220d', 'GLE300d'],
        'Audi': ['A6 40 TDI', 'A6 50 TDI', 'A4 40 TDI', 'A5 Sportback', 'Q5 40 TDI', 'Q7 50 TDI'],
        'Volkswagen': ['Golf 8 GTD', 'Passat 2.0 TDI', 'Arteon R-Line', 'Tiguan 2.0 TDI', 'Touareg V6'],
        'Porsche': ['Macan S', 'Macan GTS', 'Cayenne', 'Panamera 4', '911 Carrera'],
        'Toyota': ['Camry 2.5', 'RAV4 Hybrid', 'Land Cruiser', 'Corolla 1.8'],
        'Volvo': ['XC60 T5', 'XC90 D5', 'S90 D4', 'V60 D3'],
        'Land Rover': ['Range Rover Velar', 'Discovery Sport', 'Defender 110']
    };

    const countries = ['DE', 'DE', 'DE', 'DE', 'NL', 'BE', 'FR', 'AT'];
    const cities = {
        'DE': ['Мюнхен', 'Берлин', 'Гамбург', 'Франкфурт', 'Штутгарт', 'Кёльн'],
        'NL': ['Амстердам', 'Роттердам', 'Утрехт'],
        'BE': ['Брюссель', 'Антверпен'],
        'FR': ['Париж', 'Лион', 'Марсель'],
        'AT': ['Вена', 'Зальцбург']
    };

    const engines = {
        'diesel': ['2.0L Дизель', '2.0L TDI', '3.0L V6 Дизель', '2.0L BlueHDi'],
        'petrol': ['2.0L Бензин', '2.5L Бензин', '3.0L V6', '1.8L Turbo'],
        'hybrid': ['2.5L Гибрид', '2.0L Plug-in Hybrid']
    };

    const featuresPool = [
        'Кожаный салон', 'Навигация', 'Камера 360°', 'Адаптивный круиз', 'LED фары',
        'Панорамная крыша', 'Матричные фары', 'Массаж сидений', 'Burmester звук', 'HUD',
        'quattro', 'S-line', 'Virtual Cockpit', 'Matrix LED', 'Пневмоподвеска',
        'DCC', 'Digital Cockpit', 'IQ Light', 'Travel Assist', 'Sport Chrono',
        'PASM', 'Bose', 'Sport Exhaust', 'AMG пакет', 'M пакет'
    ];

    const descriptions = [
        'Отличное состояние, один владелец, полная сервисная история.',
        'Премиум комплектация, обслуживался у дилера, без ДТП.',
        'Идеальное техническое состояние, гарантия до конца года.',
        'Топовая комплектация, все опции, готов к эксплуатации.',
        'Автомобиль из первых рук, не курящий владелец, гаражное хранение.'
    ];

    const parsedCars = [];
    const numCars = Math.floor(Math.random() * 8) + 8; // 8-15 cars

    for (let i = 0; i < numCars; i++) {
        // Filter brands if specified
        let availableBrands = Object.keys(brands);
        if (filters.brand && brands[filters.brand]) {
            availableBrands = [filters.brand];
        }
        
        const brand = availableBrands[Math.floor(Math.random() * availableBrands.length)];
        let model = brands[brand][Math.floor(Math.random() * brands[brand].length)];
        
        // Filter model if specified
        if (filters.model && model.toLowerCase().includes(filters.model.toLowerCase())) {
            model = brands[brand].find(m => m.toLowerCase().includes(filters.model.toLowerCase())) || model;
        }
        
        const country = filters.country || countries[Math.floor(Math.random() * countries.length)];
        const city = cities[country][Math.floor(Math.random() * cities[country].length)];
        
        // Year with filter
        let year = Math.floor(Math.random() * (2024 - 2017 + 1)) + 2017;
        if (filters.minYear) year = Math.max(year, parseInt(filters.minYear));
        if (filters.maxYear) year = Math.min(year, parseInt(filters.maxYear));
        
        // Mileage based on year
        const yearsOld = 2024 - year;
        const avgMileage = yearsOld * 15000;
        let mileage = Math.floor(Math.random() * (avgMileage * 0.5 + 1)) + Math.max(5000, avgMileage * 0.5);
        mileage = Math.round(mileage / 1000) * 1000;
        
        const fuelType = filters.fuel || (Math.random() > 0.7 ? 'petrol' : Math.random() > 0.85 ? 'hybrid' : 'diesel');
        const engineList = engines[fuelType];
        const engine = engineList[Math.floor(Math.random() * engineList.length)];
        const power = Math.floor(Math.random() * (350 - 150 + 1)) + 150;
        
        // Calculate market price
        const marketPrice = calculateMarketPrice(brand, model, year, mileage, data);
        
        // Actual price (can be better or worse than market)
        let price = marketPrice;
        const priceVariation = Math.random();
        if (priceVariation > 0.8) {
            // Great deal (20% chance)
            price = Math.round(marketPrice * (0.85 + Math.random() * 0.1) / 100) * 100;
        } else if (priceVariation > 0.5) {
            // Good deal (30% chance)
            price = Math.round(marketPrice * (0.95 + Math.random() * 0.05) / 100) * 100;
        } else {
            // Market price or slightly higher (50% chance)
            price = Math.round(marketPrice * (1 + Math.random() * 0.1) / 100) * 100;
        }
        
        // Apply price filters
        if (filters.minPrice && price < parseInt(filters.minPrice)) continue;
        if (filters.maxPrice && price > parseInt(filters.maxPrice)) continue;
        
        // Transmission filter
        const transmission = filters.transmission || (Math.random() > 0.1 ? 'Автомат' : 'Механика');
        if (filters.transmission && transmission !== filters.transmission) continue;

        // Select random features
        const numFeatures = Math.floor(Math.random() * 6) + 3;
        const features = [];
        for (let j = 0; j < numFeatures; j++) {
            const feature = featuresPool[Math.floor(Math.random() * featuresPool.length)];
            if (!features.includes(feature)) features.push(feature);
        }

        // Generate service history
        const serviceHistory = generateServiceHistory(year, mileage);
        
        // Number of owners (1-3, with bias towards 1-2)
        const owners = Math.floor(Math.random() * 3) + 1;
        
        // Warranty (30% chance for newer cars)
        const warranty = yearsOld <= 3 && Math.random() > 0.7 ? {
            valid: true,
            until: new Date(2024 + (3 - yearsOld), 11, 31).toISOString(),
            type: yearsOld <= 1 ? 'Официальная гарантия производителя' : 'Расширенная гарантия'
        } : null;

        parsedCars.push({
            id: Date.now() + i,
            brand,
            model,
            year,
            price,
            marketPrice,
            priceAdvantage: marketPrice - price,
            mileage,
            engine,
            power,
            transmission,
            fuel: fuelType,
            country,
            location: city,
            vin: generateVIN(),
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            features,
            images: [],
            status: 'available',
            source: source || 'parser',
            serviceHistory,
            owners,
            warranty,
            rating: 0, // Will be calculated
            qualityBadge: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    // Calculate ratings for all cars
    parsedCars.forEach(car => {
        car.rating = calculateCarRating(car);
        car.qualityBadge = getQualityBadge(car.rating);
    });

    // Sort by rating (best first)
    parsedCars.sort((a, b) => b.rating - a.rating);

    return parsedCars;
}

// Generate VIN
function generateVIN() {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
    let vin = '';
    for (let i = 0; i < 17; i++) {
        vin += chars[Math.floor(Math.random() * chars.length)];
    }
    return vin;
}

// Filter cars based on criteria
function filterCars(cars, filters) {
    let filtered = [...cars];

    if (filters.brand) {
        filtered = filtered.filter(c => c.brand === filters.brand);
    }
    if (filters.model) {
        filtered = filtered.filter(c => c.model.toLowerCase().includes(filters.model.toLowerCase()));
    }
    if (filters.minYear) {
        filtered = filtered.filter(c => c.year >= parseInt(filters.minYear));
    }
    if (filters.maxYear) {
        filtered = filtered.filter(c => c.year <= parseInt(filters.maxYear));
    }
    if (filters.minPrice) {
        filtered = filtered.filter(c => c.price >= parseInt(filters.minPrice));
    }
    if (filters.maxPrice) {
        filtered = filtered.filter(c => c.price <= parseInt(filters.maxPrice));
    }
    if (filters.fuel) {
        filtered = filtered.filter(c => c.fuel === filters.fuel);
    }
    if (filters.country) {
        filtered = filtered.filter(c => c.country === filters.country);
    }
    if (filters.transmission) {
        filtered = filtered.filter(c => c.transmission === filters.transmission);
    }
    if (filters.search) {
        const s = filters.search.toLowerCase();
        filtered = filtered.filter(c => 
            c.brand.toLowerCase().includes(s) || 
            c.model.toLowerCase().includes(s) ||
            c.description.toLowerCase().includes(s) ||
            c.location.toLowerCase().includes(s)
        );
    }
    if (filters.minRating) {
        filtered = filtered.filter(c => c.rating >= parseInt(filters.minRating));
    }

    return filtered;
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // API Routes
    if (pathname.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json');

        try {
            // GET /api/cars - Get all cars with filters
            if (pathname === '/api/cars' && method === 'GET') {
                const data = readData();
                const filters = {
                    brand: parsedUrl.query.brand,
                    model: parsedUrl.query.model,
                    minYear: parsedUrl.query.minYear,
                    maxYear: parsedUrl.query.maxYear,
                    minPrice: parsedUrl.query.minPrice,
                    maxPrice: parsedUrl.query.maxPrice,
                    fuel: parsedUrl.query.fuel,
                    country: parsedUrl.query.country,
                    transmission: parsedUrl.query.transmission,
                    search: parsedUrl.query.search,
                    minRating: parsedUrl.query.minRating
                };

                const filtered = filterCars(data.cars, filters);

                res.writeHead(200);
                res.end(JSON.stringify({ 
                    cars: filtered, 
                    settings: data.settings,
                    total: filtered.length 
                }));
                return;
            }

            // GET /api/cars/:id - Get single car
            const carMatch = pathname.match(/^\/api\/cars\/(\d+)$/);
            if (carMatch && method === 'GET') {
                const data = readData();
                const car = data.cars.find(c => c.id == carMatch[1]);
                if (car) {
                    res.writeHead(200);
                    res.end(JSON.stringify(car));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Car not found' }));
                }
                return;
            }

            // POST /api/cars - Create new car
            if (pathname === '/api/cars' && method === 'POST') {
                const body = await parseBody(req);
                const data = readData();
                
                // Calculate rating for manually added car
                const rating = calculateCarRating(body);
                const qualityBadge = getQualityBadge(rating);
                
                const newCar = {
                    id: Date.now(),
                    ...body,
                    rating,
                    qualityBadge,
                    status: body.status || 'available',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                data.cars.unshift(newCar);
                writeData(data);

                res.writeHead(201);
                res.end(JSON.stringify(newCar));
                return;
            }

            // PUT /api/cars/:id - Update car
            if (carMatch && method === 'PUT') {
                const body = await parseBody(req);
                const data = readData();
                const carIndex = data.cars.findIndex(c => c.id == carMatch[1]);
                
                if (carIndex !== -1) {
                    const updatedCar = {
                        ...data.cars[carIndex],
                        ...body,
                        updatedAt: new Date().toISOString()
                    };
                    
                    // Recalculate rating
                    updatedCar.rating = calculateCarRating(updatedCar);
                    updatedCar.qualityBadge = getQualityBadge(updatedCar.rating);
                    
                    data.cars[carIndex] = updatedCar;
                    writeData(data);
                    
                    res.writeHead(200);
                    res.end(JSON.stringify(updatedCar));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Car not found' }));
                }
                return;
            }

            // DELETE /api/cars/:id - Delete car
            if (carMatch && method === 'DELETE') {
                const data = readData();
                const carIndex = data.cars.findIndex(c => c.id == carMatch[1]);
                
                if (carIndex !== -1) {
                    data.cars.splice(carIndex, 1);
                    writeData(data);
                    
                    res.writeHead(200);
                    res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Car not found' }));
                }
                return;
            }

            // POST /api/parser/run - Run parser
            if (pathname === '/api/parser/run' && method === 'POST') {
                const body = await parseBody(req);
                const data = readData();
                
                const config = body.config || { source: 'mobile.de', filters: {} };
                
                // Generate cars with enhanced data
                const newCars = parseCarsFromSource(config.source, config.filters || {});
                
                // Add to existing cars
                data.cars = [...newCars, ...data.cars];
                data.parserConfig = config;
                writeData(data);

                res.writeHead(200);
                res.end(JSON.stringify({ 
                    success: true, 
                    added: newCars.length,
                    cars: newCars,
                    stats: {
                        topRated: newCars.filter(c => c.rating >= 80).length,
                        goodDeals: newCars.filter(c => c.priceAdvantage > 2000).length,
                        avgRating: Math.round(newCars.reduce((sum, c) => sum + c.rating, 0) / newCars.length)
                    }
                }));
                return;
            }

            // GET /api/parser/sources - Get available sources
            if (pathname === '/api/parser/sources' && method === 'GET') {
                const sources = [
                    { id: 'mobile.de', name: 'Mobile.de (Германия)', url: 'https://www.mobile.de' },
                    { id: 'autoscout24', name: 'AutoScout24 (Европа)', url: 'https://www.autoscout24.com' },
                    { id: 'leboncoin', name: 'LeBonCoin (Франция)', url: 'https://www.leboncoin.fr' },
                    { id: 'marktplaats', name: 'Marktplaats (Нидерланды)', url: 'https://www.marktplaats.nl' },
                    { id: 'autovit', name: 'Autovit (Румыния)', url: 'https://www.autovit.ro' }
                ];
                res.writeHead(200);
                res.end(JSON.stringify(sources));
            }

            // GET /api/settings - Get settings
            if (pathname === '/api/settings' && method === 'GET') {
                const data = readData();
                res.writeHead(200);
                res.end(JSON.stringify(data.settings));
                return;
            }

            // PUT /api/settings - Update settings
            if (pathname === '/api/settings' && method === 'PUT') {
                const body = await parseBody(req);
                const data = readData();
                data.settings = { ...data.settings, ...body };
                writeData(data);
                
                res.writeHead(200);
                res.end(JSON.stringify(data.settings));
                return;
            }

            // 404 for unknown API routes
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'API endpoint not found' }));

        } catch (error) {
            console.error('API Error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Internal server error', message: error.message }));
        }
        return;
    }

    // Static files
    let filePath = pathname === '/' ? '/index.html' : pathname;
    filePath = path.join(STATIC_DIR, filePath);

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            res.setHeader('Content-Type', contentType);
            res.writeHead(200);
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚗 AutoEurope API server running at http://localhost:${PORT}`);
    console.log(`📊 Enhanced parser with:`);
    console.log(`   - Market price calculation`);
    console.log(`   - Service history generation`);
    console.log(`   - Quality rating system (0-100)`);
    console.log(`   - Best deals detection`);
});
