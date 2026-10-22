/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — геймификация и группы.
// - users.coins  — внутренняя валюта (приватна: видна только владельцу и админу);
// - groups       — учебные группы (специальность + год поступления + куратор);
// - users.group  — группа студента;
// - notifications — уведомления пользователя;
// - board_tasks / board_completions — доска заданий и их выполнение.

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    const institutions = app.findCollectionByNameOrId('institutions')

    // ---- groups ----
    const groups = new Collection({
      type: 'base',
      name: 'groups',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"',
      updateRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"',
      deleteRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"',
      fields: [
        { name: 'specialty', type: 'text', required: true }, // напр. ИСиП-ИИ
        { name: 'index', type: 'number' }, // номер группы в потоке (1..)
        { name: 'start_year', type: 'number', required: true }, // год поступления (напр. 2025)
        { name: 'curator', type: 'relation', maxSelect: 1, collectionId: users.id, cascadeDelete: false },
        { name: 'institution', type: 'relation', maxSelect: 1, collectionId: institutions.id, cascadeDelete: false },
      ],
    })
    app.save(groups)

    // ---- users: валюта + группа ----
    users.fields.add(new Field({ name: 'coins', type: 'number' }))
    users.fields.add(new Field({ name: 'group', type: 'relation', maxSelect: 1, collectionId: groups.id, cascadeDelete: false }))
    app.save(users)

    // ---- notifications ----
    const notifications = new Collection({
      type: 'base',
      name: 'notifications',
      listRule: 'user = @request.auth.id',
      viewRule: 'user = @request.auth.id',
      createRule: '@request.auth.role = "admin" || @request.auth.role = "superadmin"', // обычно создаёт сервер (хук)
      updateRule: 'user = @request.auth.id',
      deleteRule: 'user = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      fields: [
        { name: 'user', type: 'relation', required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
        { name: 'kind', type: 'select', maxSelect: 1, values: ['grade', 'board', 'system'] },
        { name: 'title', type: 'text', required: true },
        { name: 'text', type: 'text', max: 500 },
        { name: 'link', type: 'text' },
        { name: 'read', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      ],
    })
    app.save(notifications)

    // ---- board_tasks (доска заданий) ----
    const board = new Collection({
      type: 'base',
      name: 'board_tasks',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: '@request.auth.role = "teacher" || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      updateRule: 'author = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      deleteRule: 'author = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      fields: [
        { name: 'author', type: 'relation', required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: false },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text', max: 2000 },
        { name: 'target', type: 'select', maxSelect: 1, values: ['all', 'group'] },
        { name: 'group', type: 'relation', maxSelect: 1, collectionId: groups.id, cascadeDelete: false },
        { name: 'reward_coins', type: 'number' },
        { name: 'reward_xp', type: 'number' },
        { name: 'institution', type: 'relation', maxSelect: 1, collectionId: institutions.id, cascadeDelete: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      ],
    })
    app.save(board)

    // ---- board_completions ----
    const comp = new Collection({
      type: 'base',
      name: 'board_completions',
      listRule: 'student = @request.auth.id || task.author = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      viewRule: 'student = @request.auth.id || task.author = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      createRule: '@request.body.student = @request.auth.id',
      updateRule: 'task.author = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      deleteRule: 'student = @request.auth.id || @request.auth.role = "admin" || @request.auth.role = "superadmin"',
      fields: [
        { name: 'task', type: 'relation', required: true, maxSelect: 1, collectionId: board.id, cascadeDelete: true },
        { name: 'student', type: 'relation', required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
        { name: 'status', type: 'select', maxSelect: 1, values: ['submitted', 'approved', 'rejected'] },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_board_comp ON board_completions (task, student)'],
    })
    app.save(comp)
  },

  (app) => {
    for (const n of ['board_completions', 'board_tasks', 'notifications', 'groups']) {
      try {
        app.delete(app.findCollectionByNameOrId(n))
      } catch (e) {
        // ignore
      }
    }
  },
)
