/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — роль superadmin.
// superadmin видит и управляет всем; admin ограничен своим колледжем (скоуп на клиенте).

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const field = users.fields.getByName('role')
    field.values = ['student', 'teacher', 'admin', 'superadmin']
    app.save(users)
  },

  (app) => {
    try {
      const users = app.findCollectionByNameOrId('users')
      const field = users.fields.getByName('role')
      field.values = ['student', 'teacher', 'admin']
      app.save(users)
    } catch (e) {
      // ignore
    }
  },
)
