import type { Course } from './types'

function lessons(prefix: string, titles: [string, Course['sections'][0]['lessons'][0]['type'], number][]) {
  return titles.map(([title, type, h], i) => ({
    id: `${prefix}-l${i + 1}`,
    title,
    type,
    durationHours: h,
    xp: Math.round(20 + h * 20),
  }))
}

export const MOCK_COURSES: Course[] = [
  {
    id: 'web-basics',
    title: 'Основы веб-разработки',
    subtitle: 'HTML, CSS и первый интерфейс',
    category: 'Разработка',
    icon: 'code',
    instructor: 'Ирина Соколова',
    ownerId: 't-demo',
    institutionShort: 'КИТ',
    status: 'published',
    totalHours: 24,
    accent: 'aqua',
    sections: [
      {
        id: 'web-s1',
        title: 'Введение',
        lessons: lessons('web-s1', [
          ['Как устроен веб', 'lecture', 1],
          ['Инструменты разработчика', 'video', 1.5],
          ['Первая страница', 'practice', 2],
        ]),
      },
      {
        id: 'web-s2',
        title: 'HTML и CSS',
        lessons: lessons('web-s2', [
          ['Семантическая разметка', 'lecture', 2],
          ['Флексбокс и грид', 'video', 2.5],
          ['Адаптивная вёрстка', 'practice', 3],
          ['Проверочный тест', 'quiz', 0.5],
        ]),
      },
    ],
  },
  {
    id: 'python-intro',
    title: 'Python с нуля',
    subtitle: 'Программирование для начинающих',
    category: 'Программирование',
    icon: 'terminal',
    instructor: 'Дмитрий Волков',
    ownerId: 't-demo',
    institutionShort: 'КИТ',
    status: 'published',
    totalHours: 32,
    accent: 'lime',
    sections: [
      {
        id: 'py-s1',
        title: 'Синтаксис',
        lessons: lessons('py-s1', [
          ['Переменные и типы', 'lecture', 1.5],
          ['Условия и циклы', 'video', 2],
          ['Практика: калькулятор', 'practice', 2.5],
        ]),
      },
      {
        id: 'py-s2',
        title: 'Структуры данных',
        lessons: lessons('py-s2', [
          ['Списки и словари', 'lecture', 2],
          ['Функции', 'video', 2],
          ['Мини-проект', 'assignment', 4],
        ]),
      },
    ],
  },
  {
    id: 'ui-design',
    title: 'UI/UX дизайн интерфейсов',
    subtitle: 'От идеи до прототипа',
    category: 'Дизайн',
    icon: 'palette',
    instructor: 'Анна Лебедева',
    ownerId: 't-demo',
    institutionShort: 'КИТ',
    status: 'published',
    totalHours: 20,
    accent: 'teal',
    sections: [
      {
        id: 'ui-s1',
        title: 'Основы',
        lessons: lessons('ui-s1', [
          ['Принципы дизайна', 'lecture', 1.5],
          ['Цвет и типографика', 'video', 2],
          ['Сетки и композиция', 'practice', 2],
        ]),
      },
    ],
  },
]

export function findCourse(id: string): Course | undefined {
  return MOCK_COURSES.find((c) => c.id === id)
}

export function allLessons(course: Course) {
  return course.sections.flatMap((s) => s.lessons)
}
