const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// ========================================
// ИНИЦИАЛИЗАЦИЯ ФАЙЛА ДАННЫХ
// ========================================
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
        ratings: [],
        posts: [
            { id: 1, text: 'Как вы спасаетесь от берёзы? В этом году пыльца просто везде 🌳🤧', author: 'Анна Светлова', timestamp: Date.now() - 2 * 3600000, likes: 24, liked: false },
            { id: 2, text: 'Нашёл отличный очиститель воздуха с HEPA-фильтром! Стало намного легче дышать ночью.', author: 'Максим Котов', timestamp: Date.now() - 5 * 3600000, likes: 18, liked: false },
            { id: 3, text: 'Кто-нибудь пробовал солевые пещеры для облегчения симптомов?', author: 'Елена П.', timestamp: Date.now() - 24 * 3600000, likes: 12, liked: false }
        ],
        symptoms: [],
        medications: [],
        settings: {
            userName: 'Полина',
            allergens: ['Берёза', 'Пыльца'],
            toggles: {
                'Уведомления': true,
                'Звуковые оповещения': false,
                'Автосинхронизация': true
            },
            survey: null,
            contactEmail: null
        }
    }, null, 2));
}

const readData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const writeData = (d) => fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));

// ========================================
// ОЦЕНКИ СОСТОЯНИЯ
// ========================================
app.get('/api/ratings', (req, res) => res.json(readData().ratings));
app.post('/api/ratings', (req, res) => {
    const data = readData();
    const newRating = { id: Date.now(), ...req.body, timestamp: new Date().toISOString() };
    data.ratings.push(newRating);
    writeData(data);
    res.status(201).json(newRating);
});

// ========================================
// ПОСТЫ СООБЩЕСТВА
// ========================================
app.get('/api/posts', (req, res) => res.json(readData().posts));
app.post('/api/posts', (req, res) => {
    const data = readData();
    const newPost = { id: Date.now(), ...req.body, timestamp: Date.now(), likes: 0, liked: false };
    data.posts.unshift(newPost);
    writeData(data);
    res.status(201).json(newPost);
});
app.put('/api/posts/:id/like', (req, res) => {
    const data = readData();
    const post = data.posts.find(p => p.id === parseInt(req.params.id));
    if (!post) return res.status(404).json({ error: 'Не найдено' });
    post.liked = !post.liked;
    post.likes = post.liked ? post.likes + 1 : Math.max(0, post.likes - 1);
    writeData(data);
    res.json(post);
});

// ========================================
// НАСТРОЙКИ — ПОЛНЫЙ ОБЪЕКТ
// ========================================
app.get('/api/settings', (req, res) => {
    const data = readData();
    res.json(data.settings || {});
});

app.put('/api/settings', (req, res) => {
    const data = readData();
    // Частичное обновление: мержим с существующими настройками
    data.settings = { ...(data.settings || {}), ...req.body, updatedAt: new Date().toISOString() };
    writeData(data);
    res.json(data.settings);
});

// ========================================
// НАСТРОЙКИ — ОТДЕЛЬНЫЕ ПОЛЯ
// ========================================
// Имя пользователя
app.put('/api/settings/name', (req, res) => {
    const data = readData();
    if (!data.settings) data.settings = {};
    data.settings.userName = req.body.name;
    data.settings.updatedAt = new Date().toISOString();
    writeData(data);
    res.json({ name: data.settings.userName });
});

// Аллергены
app.get('/api/settings/allergens', (req, res) => {
    const data = readData();
    res.json(data.settings?.allergens || []);
});

app.put('/api/settings/allergens', (req, res) => {
    const data = readData();
    if (!data.settings) data.settings = {};
    data.settings.allergens = req.body.allergens;
    data.settings.updatedAt = new Date().toISOString();
    writeData(data);
    res.json({ allergens: data.settings.allergens });
});

// Переключатели (toggles)
app.put('/api/settings/toggles', (req, res) => {
    const data = readData();
    if (!data.settings) data.settings = {};
    if (!data.settings.toggles) data.settings.toggles = {};
    // Мержим новые значения с существующими
    data.settings.toggles = { ...data.settings.toggles, ...req.body.toggles };
    data.settings.updatedAt = new Date().toISOString();
    writeData(data);
    res.json({ toggles: data.settings.toggles });
});

// Опрос
app.post('/api/settings/survey', (req, res) => {
    const data = readData();
    if (!data.settings) data.settings = {};
    data.settings.survey = {
        ...req.body,
        submittedAt: new Date().toISOString()
    };
    data.settings.updatedAt = new Date().toISOString();
    writeData(data);
    res.status(201).json(data.settings.survey);
});

app.get('/api/settings/survey', (req, res) => {
    const data = readData();
    res.json(data.settings?.survey || null);
});

// Контакт (email из формы связи)
app.post('/api/settings/contact', (req, res) => {
    const data = readData();
    if (!data.settings) data.settings = {};
    data.settings.contactEmail = req.body.email;
    data.settings.updatedAt = new Date().toISOString();
    writeData(data);
    res.status(201).json({ email: data.settings.contactEmail });
});

// ========================================
// SWAGGER UI — ДОКУМЕНТАЦИЯ API
// ========================================
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

// path уже объявлен в начале файла — используем его повторно
const swaggerDocument = YAML.load(path.join(__dirname, 'swagger.yaml'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Время Цвести API Docs',
}));

console.log(`📚 Swagger UI доступен по адресу: http://localhost:${PORT}/api-docs`);


app.listen(PORT, () => console.log(`✅ Бэкенд запущен на http://localhost:${PORT}`));