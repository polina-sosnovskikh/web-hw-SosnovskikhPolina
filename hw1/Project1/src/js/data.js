// Данные о симптомах по категориям
export const symptomsData = [
    {
        category: 'Голова',
        items: [
            { id: 'headache', name: 'Головная боль' },
            { id: 'fever', name: 'Высокая температура' },
            { id: 'fatigue', name: 'Общее недомогание' },
        ],
    },
    {
        category: 'Глаза',
        items: [
            { id: 'tearing', name: 'Слезотечение' },
            { id: 'itching-eyes', name: 'Зуд' },
            { id: 'redness', name: 'Покраснения' },
            { id: 'swelling-eyes', name: 'Отек' },
            { id: 'bruises', name: 'Синяки' },
        ],
    },
    {
        category: 'Нос',
        items: [
            { id: 'itching-nose', name: 'Зуд' },
            { id: 'congestion', name: 'Заложенность' },
            { id: 'rhinorrhea', name: 'Ринорея' },
            { id: 'sneezing-low', name: 'Чихания (до 10 раз подряд)' },
            { id: 'sneezing-high', name: 'Чихания (от 10 раз подряд)' },
            { id: 'bleeding', name: 'Кровотечения' },
        ],
    },
    {
        category: 'Горло',
        items: [
            { id: 'sore-throat', name: 'Боль в горле' },
            { id: 'tickling', name: 'Першение в горле' },
            { id: 'dry-cough', name: 'Сухой кашель' },
            { id: 'wet-cough', name: 'Мокрый кашель' },
            { id: 'swelling-throat', name: 'Отек' },
        ],
    },
    {
        category: 'Легкие',
        items: [
            { id: 'wheezing', name: 'Хрипы' },
            { id: 'breathing-difficulty', name: 'Затруднённое дыхание' },
            { id: 'asthma-attacks', name: 'Приступы удушья' },
        ],
    },
    {
        category: 'Кожа',
        items: [
            { id: 'skin-itching', name: 'Зуд' },
            { id: 'dermatitis', name: 'Дерматит' },
        ],
    },
];

// Иконки для отображения симптомов в блоке "Симптомы сегодня"
export const symptomIcons = {
    'headache': '🤕',
    'fever': '🌡️',
    'fatigue': '😴',
    'tearing': '💧',
    'itching-eyes': '👁️',
    'redness': '🔴',
    'swelling-eyes': '😵',
    'bruises': '🟣',
    'itching-nose': '👃',
    'congestion': '🤧',
    'rhinorrhea': '💦',
    'sneezing-low': '🤧',
    'sneezing-high': '🤧',
    'bleeding': '🩸',
    'sore-throat': '😷',
    'tickling': '🗣️',
    'dry-cough': '😷',
    'wet-cough': '🤒',
    'swelling-throat': '😶',
    'wheezing': '💨',
    'breathing-difficulty': '‍💨',
    'asthma-attacks': '🆘',
    'skin-itching': '✋',
    'dermatitis': '🔴',
};

// Цвета иконок для симптомов
export const symptomColors = {
    'Голова': 'var(--прозрачный-мятный)',
    'Глаза': 'var(--прозрачный-желтый)',
    'Нос': 'var(--прозрачный-желтый)',
    'Горло': 'var(--прозрачный-мятный)',
    'Легкие': 'var(--прозрачный-мятный)',
    'Кожа': 'var(--прозрачный-желтый)',
};