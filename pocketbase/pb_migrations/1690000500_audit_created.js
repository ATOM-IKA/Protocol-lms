/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — автодата created для audit_logs.
// Нужна, чтобы админ мог сортировать журнал аудита по времени.

migrate(
  (app) => {
    const audit = app.findCollectionByNameOrId('audit_logs')
    audit.fields.add(new Field({ name: 'created', type: 'autodate', onCreate: true, onUpdate: false }))
    app.save(audit)
  },

  (app) => {
    try {
      const audit = app.findCollectionByNameOrId('audit_logs')
      audit.fields.removeByName('created')
      app.save(audit)
    } catch (e) {
      // ignore
    }
  },
)
