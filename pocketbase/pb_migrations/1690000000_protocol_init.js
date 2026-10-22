/// <reference path="../pb_data/types.d.ts" />
//
// PROTOCOL — начальная схема (PocketBase v0.22+).
// Кладётся в pb_migrations/ — PocketBase применит автоматически при старте.
// Если ваша версия отличается по API миграций — сверьтесь со SCHEMA.md
// и при необходимости соберите коллекции в админке вручную.

migrate(
  (app) => {
    // ---------- 1. institutions ----------
    const institutions = new Collection({
      type: 'base',
      name: 'institutions',
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.role = "admin"',
      updateRule: '@request.auth.role = "admin"',
      deleteRule: '@request.auth.role = "admin"',
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'short_name', type: 'text', required: true },
        { name: 'logo', type: 'file', maxSelect: 1 },
        { name: 'default_accent', type: 'select', maxSelect: 1, values: ['aqua', 'lime', 'teal'] },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_inst_short ON institutions (short_name)'],
    })
    app.save(institutions)

    // ---------- 2. users (расширяем встроенную auth-коллекцию) ----------
    const users = app.findCollectionByNameOrId('users')
    users.fields.add(new Field({ name: 'full_name', type: 'text', required: true }))
    users.fields.add(new Field({ name: 'student_id', type: 'text', required: true }))
    users.fields.add(new Field({ name: 'callsign', type: 'text' }))
    users.fields.add(new Field({ name: 'role', type: 'select', maxSelect: 1, values: ['student', 'teacher', 'admin'] }))
    users.fields.add(new Field({ name: 'institution', type: 'relation', maxSelect: 1, collectionId: institutions.id, cascadeDelete: false }))
    users.fields.add(new Field({ name: 'xp', type: 'number' }))
    users.fields.add(new Field({ name: 'level', type: 'number' }))
    users.fields.add(new Field({ name: 'rank', type: 'text' }))
    users.addIndex('idx_users_student', true, 'student_id', '')
    users.listRule = 'id = @request.auth.id || @request.auth.role = "admin"'
    users.viewRule = 'id = @request.auth.id || @request.auth.role = "admin"'
    users.createRule = '@request.auth.role = "admin"'
    users.updateRule = 'id = @request.auth.id || @request.auth.role = "admin"'
    users.deleteRule = '@request.auth.role = "admin"'
    app.save(users)

    // ---------- 3. courses ----------
    const courses = new Collection({
      type: 'base',
      name: 'courses',
      listRule: '(status = "published" && institution = @request.auth.institution) || owner = @request.auth.id || @request.auth.role = "admin"',
      viewRule: '(status = "published" && institution = @request.auth.institution) || owner = @request.auth.id || @request.auth.role = "admin"',
      createRule: '(@request.auth.role = "teacher" || @request.auth.role = "admin") && @request.body.owner = @request.auth.id',
      updateRule: 'owner = @request.auth.id || @request.auth.role = "admin"',
      deleteRule: 'owner = @request.auth.id || @request.auth.role = "admin"',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'subtitle', type: 'text' },
        { name: 'category', type: 'text' },
        { name: 'icon', type: 'text' },
        { name: 'accent', type: 'select', maxSelect: 1, values: ['aqua', 'lime', 'teal'] },
        { name: 'instructor', type: 'text' },
        { name: 'owner', type: 'relation', required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: false },
        { name: 'institution', type: 'relation', required: true, maxSelect: 1, collectionId: institutions.id, cascadeDelete: false },
        { name: 'status', type: 'select', maxSelect: 1, values: ['draft', 'published'] },
        { name: 'total_hours', type: 'number' },
        { name: 'thumbnail', type: 'file', maxSelect: 1 },
      ],
    })
    app.save(courses)

    // ---------- 4. sections ----------
    const sections = new Collection({
      type: 'base',
      name: 'sections',
      listRule: 'course.status = "published" || course.owner = @request.auth.id || @request.auth.role = "admin"',
      viewRule: 'course.status = "published" || course.owner = @request.auth.id || @request.auth.role = "admin"',
      createRule: 'course.owner = @request.auth.id || @request.auth.role = "admin"',
      updateRule: 'course.owner = @request.auth.id || @request.auth.role = "admin"',
      deleteRule: 'course.owner = @request.auth.id || @request.auth.role = "admin"',
      fields: [
        { name: 'course', type: 'relation', required: true, maxSelect: 1, collectionId: courses.id, cascadeDelete: true },
        { name: 'title', type: 'text', required: true },
        { name: 'order', type: 'number' },
      ],
    })
    app.save(sections)

    // ---------- 5. lessons ----------
    const lessons = new Collection({
      type: 'base',
      name: 'lessons',
      listRule: 'course.status = "published" || course.owner = @request.auth.id || @request.auth.role = "admin"',
      viewRule: 'course.status = "published" || course.owner = @request.auth.id || @request.auth.role = "admin"',
      createRule: 'course.owner = @request.auth.id || @request.auth.role = "admin"',
      updateRule: 'course.owner = @request.auth.id || @request.auth.role = "admin"',
      deleteRule: 'course.owner = @request.auth.id || @request.auth.role = "admin"',
      fields: [
        { name: 'section', type: 'relation', required: true, maxSelect: 1, collectionId: sections.id, cascadeDelete: true },
        { name: 'course', type: 'relation', required: true, maxSelect: 1, collectionId: courses.id, cascadeDelete: true },
        { name: 'title', type: 'text', required: true },
        { name: 'type', type: 'select', maxSelect: 1, values: ['lecture', 'video', 'practice', 'quiz', 'assignment'] },
        { name: 'content', type: 'editor' },
        { name: 'duration_hours', type: 'number', required: true },
        { name: 'xp', type: 'number' },
        { name: 'order', type: 'number' },
      ],
    })
    app.save(lessons)

    // ---------- 6. enrollments ----------
    const enrollments = new Collection({
      type: 'base',
      name: 'enrollments',
      listRule: 'student = @request.auth.id || course.owner = @request.auth.id || @request.auth.role = "admin"',
      viewRule: 'student = @request.auth.id || course.owner = @request.auth.id || @request.auth.role = "admin"',
      createRule: '@request.body.student = @request.auth.id || @request.auth.role = "admin"',
      updateRule: 'student = @request.auth.id || course.owner = @request.auth.id || @request.auth.role = "admin"',
      deleteRule: 'student = @request.auth.id || course.owner = @request.auth.id || @request.auth.role = "admin"',
      fields: [
        { name: 'student', type: 'relation', required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
        { name: 'course', type: 'relation', required: true, maxSelect: 1, collectionId: courses.id, cascadeDelete: true },
        { name: 'enrolled_at', type: 'date' },
        { name: 'progress_percent', type: 'number' },
        { name: 'completed_at', type: 'date' },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_enroll ON enrollments (student, course)'],
    })
    app.save(enrollments)

    // ---------- 7. session_progress ----------
    const progress = new Collection({
      type: 'base',
      name: 'session_progress',
      listRule: 'student = @request.auth.id || course.owner = @request.auth.id || @request.auth.role = "admin"',
      viewRule: 'student = @request.auth.id || course.owner = @request.auth.id || @request.auth.role = "admin"',
      createRule: '@request.body.student = @request.auth.id || @request.auth.role = "admin"',
      updateRule: 'student = @request.auth.id || @request.auth.role = "admin"',
      deleteRule: 'student = @request.auth.id || @request.auth.role = "admin"',
      fields: [
        { name: 'student', type: 'relation', required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
        { name: 'course', type: 'relation', required: true, maxSelect: 1, collectionId: courses.id, cascadeDelete: true },
        { name: 'lesson', type: 'relation', required: true, maxSelect: 1, collectionId: lessons.id, cascadeDelete: true },
        { name: 'completed', type: 'bool' },
        { name: 'completed_at', type: 'date' },
        { name: 'xp_earned', type: 'number' },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_progress ON session_progress (student, lesson)'],
    })
    app.save(progress)

    // ---------- 8. comments ----------
    const comments = new Collection({
      type: 'base',
      name: 'comments',
      listRule: 'course.status = "published" || course.owner = @request.auth.id || @request.auth.role = "admin"',
      viewRule: 'course.status = "published" || course.owner = @request.auth.id || @request.auth.role = "admin"',
      createRule: '@request.auth.id != "" && @request.body.author = @request.auth.id',
      updateRule: 'author = @request.auth.id || @request.auth.role = "admin"',
      deleteRule: 'author = @request.auth.id || @request.auth.role = "admin"',
      fields: [
        { name: 'course', type: 'relation', required: true, maxSelect: 1, collectionId: courses.id, cascadeDelete: true },
        { name: 'author', type: 'relation', required: true, maxSelect: 1, collectionId: users.id, cascadeDelete: true },
        { name: 'text', type: 'text', required: true, max: 1000 },
      ],
    })
    app.save(comments)

    // ---------- 9. audit_logs ----------
    const audit = new Collection({
      type: 'base',
      name: 'audit_logs',
      listRule: '@request.auth.role = "admin"',
      viewRule: '@request.auth.role = "admin"',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'user', type: 'text' },
        { name: 'action', type: 'text', required: true },
        { name: 'target', type: 'text' },
        { name: 'meta', type: 'json' },
      ],
    })
    app.save(audit)
  },

  // ---------- down ----------
  (app) => {
    const names = ['audit_logs', 'comments', 'session_progress', 'enrollments', 'lessons', 'sections', 'courses']
    for (let i = 0; i < names.length; i++) {
      try {
        app.delete(app.findCollectionByNameOrId(names[i]))
      } catch (e) {
        // ignore
      }
    }
    // откат кастомных полей users опущен намеренно
  },
)
