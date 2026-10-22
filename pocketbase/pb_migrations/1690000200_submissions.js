/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — коллекция submissions.
// Студент сдаёт работу по уроку: текстовый ответ + файлы.
// Преподаватель (владелец курса) видит их и выставляет оценку с отзывом.
// Оценка/статус проставляются ТОЛЬКО сервером (pb_hooks/main.pb.js).

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const courses = app.findCollectionByNameOrId('courses')
    const lessons = app.findCollectionByNameOrId('lessons')

    const submissions = new Collection({
      type: 'base',
      name: 'submissions',
      listRule: 'student = @request.auth.id || course.owner = @request.auth.id || @request.auth.role = "admin"',
      viewRule: 'student = @request.auth.id || course.owner = @request.auth.id || @request.auth.role = "admin"',
      createRule: '@request.body.student = @request.auth.id || @request.auth.role = "admin"',
      updateRule: 'student = @request.auth.id || course.owner = @request.auth.id || @request.auth.role = "admin"',
      deleteRule: 'student = @request.auth.id || @request.auth.role = "admin"',
      fields: [
        { name: 'student', type: 'relation', required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
        { name: 'course', type: 'relation', required: true, maxSelect: 1, collectionId: courses.id, cascadeDelete: true },
        { name: 'lesson', type: 'relation', required: true, maxSelect: 1, collectionId: lessons.id, cascadeDelete: true },
        { name: 'text', type: 'text', max: 5000 },
        { name: 'files', type: 'file', maxSelect: 3, maxSize: 10485760 },
        { name: 'status', type: 'select', maxSelect: 1, values: ['submitted', 'graded'] },
        { name: 'grade', type: 'number' },
        { name: 'feedback', type: 'text', max: 2000 },
        { name: 'submitted_at', type: 'date' },
        { name: 'graded_at', type: 'date' },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_submission ON submissions (student, lesson)'],
    })
    app.save(submissions)
  },

  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('submissions'))
    } catch (e) {
      // ignore
    }
  },
)
