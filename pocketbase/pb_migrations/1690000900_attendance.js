/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — посещаемость (учёт присутствия студентов на занятиях/уроках).
// Отметку ставит преподаватель (владелец курса) или админ. Студент видит только своё.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const courses = app.findCollectionByNameOrId('courses')
    const lessons = app.findCollectionByNameOrId('lessons')

    const attendance = new Collection({
      type: 'base',
      name: 'attendance',
      listRule: 'student = @request.auth.id || course.owner = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      viewRule: 'student = @request.auth.id || course.owner = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      createRule: '@request.auth.role = "teacher" || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      updateRule: 'course.owner = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      deleteRule: 'course.owner = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      fields: [
        { name: 'course', type: 'relation', required: true, maxSelect: 1, collectionId: courses.id, cascadeDelete: true },
        { name: 'lesson', type: 'relation', required: true, maxSelect: 1, collectionId: lessons.id, cascadeDelete: true },
        { name: 'student', type: 'relation', required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
        { name: 'status', type: 'select', maxSelect: 1, values: ['present', 'absent', 'late', 'excused'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_attendance ON attendance (lesson, student)'],
    })
    app.save(attendance)
  },

  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('attendance'))
    } catch (e) {
      // ignore
    }
  },
)
