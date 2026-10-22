/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — поле `open` у уроков.
// Урок закрыт по умолчанию и открывается преподавателем.
// Студент видит закрытые уроки как «замок», без доступа к содержимому.

migrate(
  (app) => {
    const lessons = app.findCollectionByNameOrId('lessons')
    lessons.fields.add(new Field({ name: 'open', type: 'bool' }))
    app.save(lessons)
  },

  (app) => {
    try {
      const lessons = app.findCollectionByNameOrId('lessons')
      lessons.fields.removeByName('open')
      app.save(lessons)
    } catch (e) {
      // ignore
    }
  },
)
