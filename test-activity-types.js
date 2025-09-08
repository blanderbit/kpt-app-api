// Простой тест для проверки системы типов активностей
// Запуск: node test-activity-types.js

const fs = require('fs');
const path = require('path');

// Загружаем JSON с типами активностей
const activityTypesPath = path.join(__dirname, 'src', 'profile', 'data', 'activity-types.json');
const activityTypesData = JSON.parse(fs.readFileSync(activityTypesPath, 'utf8'));

// Функция для определения типа активности (упрощенная версия)
function determineActivityType(activityName, content = null) {
  const name = activityName.toLowerCase();
  let bestMatch = { type: null, score: 0 };

  // Проходим по всем типам активностей
  for (const type of activityTypesData.activityTypes) {
    let score = 0;

    // Проверяем ключевые слова
    for (const keyword of type.keywords) {
      if (name.includes(keyword.toLowerCase())) {
        score += 2; // Высокий вес для точных совпадений
      }
    }

    // Проверяем название типа
    if (name.includes(type.id.toLowerCase())) {
      score += 1;
    }

    // Проверяем категорию
    if (name.includes(type.category.toLowerCase())) {
      score += 0.5;
    }

    // Если есть контент, анализируем его
    if (content && typeof content === 'object') {
      const contentStr = JSON.stringify(content).toLowerCase();
      for (const keyword of type.keywords) {
        if (contentStr.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
    }

    // Обновляем лучший матч
    if (score > bestMatch.score) {
      bestMatch = { type, score };
    }
  }

  // Возвращаем тип с наивысшим счетом или general по умолчанию
  return bestMatch.score > 0 ? bestMatch.type : activityTypesData.activityTypes.find(t => t.id === 'general');
}

// Тестовые случаи
const testCases = [
  { name: 'Утренняя пробежка', expected: 'fitness' },
  { name: 'Работа над проектом', expected: 'work' },
  { name: 'Изучение английского языка', expected: 'education' },
  { name: 'Рисование картины', expected: 'hobby' },
  { name: 'Поездка в Париж', expected: 'travel' },
  { name: 'Встреча с друзьями', expected: 'social' },
  { name: 'Посещение врача', expected: 'health' },
  { name: 'Инвестиции в акции', expected: 'finance' },
  { name: 'Уборка дома', expected: 'home' },
  { name: 'Разработка веб-сайта', expected: 'technology' },
  { name: 'Посадка деревьев', expected: 'nature' },
  { name: 'Посещение музея', expected: 'culture' },
  { name: 'Неизвестная активность', expected: 'general' },
];

console.log('🧪 Тестирование системы типов активностей\n');

let passed = 0;
let total = testCases.length;

for (const testCase of testCases) {
  const result = determineActivityType(testCase.name);
  const isCorrect = result.id === testCase.expected;
  
  if (isCorrect) {
    passed++;
    console.log(`✅ ${testCase.name} → ${result.id} (${result.name})`);
  } else {
    console.log(`❌ ${testCase.name} → ${result.id} (ожидалось: ${testCase.expected})`);
  }
}

console.log(`\n📊 Результаты: ${passed}/${total} тестов пройдено`);

if (passed === total) {
  console.log('🎉 Все тесты пройдены успешно!');
} else {
  console.log('⚠️  Некоторые тесты не прошли');
}

// Дополнительная информация
console.log('\n📋 Доступные типы активностей:');
activityTypesData.activityTypes.forEach(type => {
  console.log(`  ${type.icon} ${type.id} - ${type.name} (${type.category})`);
});

console.log('\n🔍 Статистика:');
console.log(`  Всего типов: ${activityTypesData.activityTypes.length}`);
console.log(`  Всего категорий: ${Object.keys(activityTypesData.categories).length}`);

// Примеры с контентом
console.log('\n📝 Примеры с JSON контентом:');
const examplesWithContent = [
  { name: 'Тренировка в зале', content: { exercises: ['жим лежа', 'приседания'], duration: '1 час' } },
  { name: 'Работа над кодом', content: { language: 'TypeScript', framework: 'NestJS', hours: 4 } },
  { name: 'Чтение книги', content: { title: 'Война и мир', author: 'Толстой', pages: 50 } },
];

examplesWithContent.forEach(example => {
  const result = determineActivityType(example.name, example.content);
  console.log(`  ${example.name} → ${result.id} (${result.name})`);
});
