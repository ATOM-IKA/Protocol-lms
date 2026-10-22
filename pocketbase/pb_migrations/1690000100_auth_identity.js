/// <reference path="../pb_data/types.d.ts" />
//
// Разрешаем вход по student_id (не только по email).
// Если ваша версия PocketBase не примет этот API — включите поле вручную:
// Users → настройки коллекции → Options/Auth → Identity fields → добавьте student_id.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (users.passwordAuth) {
      users.passwordAuth.identityFields = ['email', 'student_id']
    }
    app.save(users)
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    if (users.passwordAuth) {
      users.passwordAuth.identityFields = ['email']
    }
    app.save(users)
  },
)
