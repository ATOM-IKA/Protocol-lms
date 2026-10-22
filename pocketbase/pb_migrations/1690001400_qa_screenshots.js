/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — скриншоты к отчётам тест-режима. Привязаны к отчёту (qa_reports)
// и к конкретному пункту чек-листа. Загружает тестер, смотрит суперадмин.

migrate(
  (app) => {
    const reports = app.findCollectionByNameOrId('qa_reports')

    const shots = new Collection({
      type: 'base',
      name: 'qa_screenshots',
      listRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"',
      viewRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"',
      createRule: '@request.auth.id != ""',
      updateRule: '@request.auth.role = "superadmin"',
      deleteRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"',
      fields: [
        { name: 'report', type: 'relation', required: true, maxSelect: 1, collectionId: reports.id, cascadeDelete: true },
        { name: 'item', type: 'text' }, // id + название пункта
        { name: 'image', type: 'file', maxSelect: 1, maxSize: 5242880, mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      ],
    })
    app.save(shots)
  },

  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('qa_screenshots'))
    } catch (e) {
      // ignore
    }
  },
)
