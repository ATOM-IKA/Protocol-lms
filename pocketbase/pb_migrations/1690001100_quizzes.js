/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — тесты/квизы с авто-проверкой.
// quizzes         — тест (привязан к курсу, опц. к уроку), награды, порог сдачи;
// quiz_questions  — вопросы (один/несколько верных/текст), правильные ответы, баллы;
// quiz_attempts   — попытки студентов; оценка считается сервером (хук).

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const courses = app.findCollectionByNameOrId('courses')
    const lessons = app.findCollectionByNameOrId('lessons')
    const institutions = app.findCollectionByNameOrId('institutions')

    const quizzes = new Collection({
      type: 'base',
      name: 'quizzes',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.role = "teacher" || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      updateRule: 'author = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      deleteRule: 'author = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      fields: [
        { name: 'course', type: 'relation', maxSelect: 1, collectionId: courses.id, cascadeDelete: true },
        { name: 'lesson', type: 'relation', maxSelect: 1, collectionId: lessons.id, cascadeDelete: false },
        { name: 'author', type: 'relation', required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: false },
        { name: 'institution', type: 'relation', maxSelect: 1, collectionId: institutions.id, cascadeDelete: false },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text', max: 2000 },
        { name: 'time_limit', type: 'number' }, // минуты, 0 = без лимита
        { name: 'pass_score', type: 'number' }, // процент для сдачи (напр. 60)
        { name: 'reward_coins', type: 'number' },
        { name: 'reward_xp', type: 'number' },
        { name: 'published', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      ],
    })
    app.save(quizzes)

    const questions = new Collection({
      type: 'base',
      name: 'quiz_questions',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: 'quiz.author = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      updateRule: 'quiz.author = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      deleteRule: 'quiz.author = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      fields: [
        { name: 'quiz', type: 'relation', required: true, maxSelect: 1, collectionId: quizzes.id, cascadeDelete: true },
        { name: 'text', type: 'text', required: true, max: 2000 },
        { name: 'type', type: 'select', maxSelect: 1, values: ['single', 'multi', 'text'] },
        { name: 'options', type: 'json' }, // массив вариантов ["A","B",...]
        { name: 'correct', type: 'json' }, // массив индексов/строк правильных ответов
        { name: 'points', type: 'number' },
        { name: 'order', type: 'number' },
      ],
    })
    app.save(questions)

    const attempts = new Collection({
      type: 'base',
      name: 'quiz_attempts',
      listRule: 'student = @request.auth.id || quiz.author = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      viewRule: 'student = @request.auth.id || quiz.author = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      createRule: '@request.body.student = @request.auth.id',
      updateRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"',
      deleteRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"',
      fields: [
        { name: 'quiz', type: 'relation', required: true, maxSelect: 1, collectionId: quizzes.id, cascadeDelete: true },
        { name: 'student', type: 'relation', required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
        { name: 'answers', type: 'json' }, // { questionId: ответ }
        { name: 'score', type: 'number' }, // процент
        { name: 'passed', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      ],
    })
    app.save(attempts)
  },

  (app) => {
    for (const n of ['quiz_attempts', 'quiz_questions', 'quizzes']) {
      try {
        app.delete(app.findCollectionByNameOrId(n))
      } catch (e) {
        // ignore
      }
    }
  },
)
