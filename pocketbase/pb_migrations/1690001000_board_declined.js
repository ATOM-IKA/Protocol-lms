/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — статус «отменено» для заданий с доски (студент отказался выполнять).

migrate(
  (app) => {
    const c = app.findCollectionByNameOrId('board_completions')
    const field = c.fields.getByName('status')
    field.values = ['submitted', 'approved', 'rejected', 'declined']
    app.save(c)
  },

  (app) => {
    try {
      const c = app.findCollectionByNameOrId('board_completions')
      const field = c.fields.getByName('status')
      field.values = ['submitted', 'approved', 'rejected']
      app.save(c)
    } catch (e) {
      // ignore
    }
  },
)
