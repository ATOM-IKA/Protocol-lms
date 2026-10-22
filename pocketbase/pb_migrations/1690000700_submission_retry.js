/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — поле retry у сдачи.
// Ставится сервером, когда студент пересдаёт работу, ранее оценённую на 2.
// Опыт за такую работу капится на уровне оценки «4» (см. pb_hooks/main.pb.js и фронт).

migrate(
  (app) => {
    const submissions = app.findCollectionByNameOrId('submissions')
    submissions.fields.add(new Field({ name: 'retry', type: 'bool' }))
    app.save(submissions)
  },

  (app) => {
    try {
      const submissions = app.findCollectionByNameOrId('submissions')
      submissions.fields.removeByName('retry')
      app.save(submissions)
    } catch (e) {
      // ignore
    }
  },
)
