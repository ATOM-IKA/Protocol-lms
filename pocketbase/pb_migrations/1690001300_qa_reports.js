/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — отчёты тест-режима (чек-лист). Студент/препод/админ отправляет отчёт,
// суперадмин видит: кто тестировал, по какой роли, результат и детали.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    const qa = new Collection({
      type: 'base',
      name: 'qa_reports',
      listRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"',
      viewRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"',
      createRule: '@request.body.reporter = @request.auth.id',
      updateRule: '@request.auth.role = "superadmin"',
      deleteRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"',
      fields: [
        { name: 'reporter', type: 'relation', required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
        { name: 'name', type: 'text' },
        { name: 'role', type: 'text' },
        { name: 'score', type: 'number' }, // общее соответствие, %
        { name: 'problems', type: 'number' }, // число пунктов «не работает»
        { name: 'payload', type: 'json' }, // полный снимок: секции, отметки, заметки
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      ],
    })
    app.save(qa)
  },

  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('qa_reports'))
    } catch (e) {
      // ignore
    }
  },
)
