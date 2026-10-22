/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — поле `submission` у урока.
// Если включено — урок принимает работы студентов (текст + файлы) и помечается
// как контрольная точка. Управляется преподавателем независимо от типа урока,
// поэтому сдачу можно требовать и на лекции, и не требовать на практике.

migrate(
  (app) => {
    const lessons = app.findCollectionByNameOrId('lessons')
    lessons.fields.add(new Field({ name: 'submission', type: 'bool' }))
    app.save(lessons)
  },

  (app) => {
    try {
      const lessons = app.findCollectionByNameOrId('lessons')
      lessons.fields.removeByName('submission')
      app.save(lessons)
    } catch (e) {
      // ignore
    }
  },
)
