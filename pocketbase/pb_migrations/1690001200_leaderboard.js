/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — денормализованный рейтинг (лидерборд).
// Коллекция users закрыта правилами приватности, поэтому для публичного рейтинга
// держим отдельную безопасную таблицу: только позывной, опыт, уровень, ранг, группа.
// Наполняется сервером (хук recomputeUser).

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const groups = app.findCollectionByNameOrId('groups')
    const institutions = app.findCollectionByNameOrId('institutions')

    const lb = new Collection({
      type: 'base',
      name: 'leaderboard',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"',
      updateRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"',
      deleteRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"',
      fields: [
        { name: 'user', type: 'relation', required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
        { name: 'name', type: 'text' },
        { name: 'xp', type: 'number' },
        { name: 'level', type: 'number' },
        { name: 'rank', type: 'text' },
        { name: 'institution', type: 'relation', maxSelect: 1, collectionId: institutions.id, cascadeDelete: false },
        { name: 'group', type: 'relation', maxSelect: 1, collectionId: groups.id, cascadeDelete: false },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_leaderboard_user ON leaderboard (user)'],
    })
    app.save(lb)
  },

  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('leaderboard'))
    } catch (e) {
      // ignore
    }
  },
)
