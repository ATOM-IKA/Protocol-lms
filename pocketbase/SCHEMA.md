# PROTOCOL — Схема бэкенда PocketBase (с нуля)

Целевая версия: **PocketBase v0.22+** (современный JSVM, поля `fields`, правила через `@request`).
Это авторитетная спецификация. `pb_migrations/` создаёт всё автоматически; при желании
можно собрать вручную в админке по этой таблице.

## Принципы безопасности

- **XP/level/rank — только сервер.** Клиент не может менять эти поля напрямую (хук `guardUserFields`).
- **Изоляция по колледжам.** Студент видит только опубликованные курсы **своего** `institution`.
- **Владение.** Преподаватель редактирует только свои курсы (`owner = @request.auth.id`).
- **Анти-инъекция.** На фронте фильтры собираются через параметры SDK, не конкатенацией строк.
- **Минимум прав.** Личные данные пользователей закрыты (видит владелец или админ).

---

## Коллекции

### 1. `institutions` (base) — учебные заведения
| Поле | Тип | Опции |
|---|---|---|
| name | text | required |
| short_name | text | required, **unique** |
| logo | file | maxSelect 1 |
| default_accent | select | aqua / lime / teal |

**Индекс:** `UNIQUE (short_name)`
**Правила:** list `""` (публично — выбор на входе) · view `""` · create/update/delete `@request.auth.role = "admin"`

### 2. `users` (auth) — пользователи
Базовые auth-поля PocketBase + кастомные:
| Поле | Тип | Опции |
|---|---|---|
| full_name | text | required |
| student_id | text | required, **unique** |
| callsign | text | |
| role | select | student / teacher / admin · required · default `student` |
| institution | relation → institutions | required, maxSelect 1 |
| avatar | file | maxSelect 1 |
| xp | number | default 0 · **сервер-only** |
| level | number | default 1 · **сервер-only** |
| rank | text | default `F` · **сервер-only** |

**Индекс:** `UNIQUE (student_id)`
**Правила:**
- list/view: `id = @request.auth.id || @request.auth.role = "admin" || course_teacher` (по умолчанию — владелец/админ)
- create: `@request.auth.role = "admin"` (пользователей заводит админ колледжа)
- update: `id = @request.auth.id || @request.auth.role = "admin"` (поля xp/level/rank/role/institution защищены хуком)
- delete: `@request.auth.role = "admin"`

### 3. `courses` (base)
| Поле | Тип | Опции |
|---|---|---|
| title | text | required |
| subtitle | text | |
| category | text | |
| icon | text | default `code` |
| accent | select | aqua / lime / teal |
| instructor | text | |
| owner | relation → users | required, maxSelect 1 |
| institution | relation → institutions | required, maxSelect 1 |
| status | select | draft / published · default `draft` |
| total_hours | number | default 0 |
| thumbnail | file | maxSelect 1 |

**Правила:**
- list/view: `(status = "published" && institution = @request.auth.institution) || owner = @request.auth.id || @request.auth.role = "admin"`
- create: `(@request.auth.role = "teacher" || @request.auth.role = "admin") && @request.body.owner = @request.auth.id`
- update/delete: `owner = @request.auth.id || @request.auth.role = "admin"`

### 4. `sections` (base)
| Поле | Тип | Опции |
|---|---|---|
| course | relation → courses | required |
| title | text | required |
| order | number | default 0 |

**Правила:**
- list/view: `course.status = "published" || course.owner = @request.auth.id || @request.auth.role = "admin"`
- create/update/delete: `course.owner = @request.auth.id || @request.auth.role = "admin"`

### 5. `lessons` (base)
| Поле | Тип | Опции |
|---|---|---|
| section | relation → sections | required |
| course | relation → courses | required |
| title | text | required |
| type | select | lecture / video / practice / quiz / assignment |
| content | editor | |
| duration_hours | number | required, min 0 |
| xp | number | default 40 |
| order | number | default 0 |

**Правила:** как у `sections` (через `course.owner`).

### 6. `enrollments` (base)
| Поле | Тип | Опции |
|---|---|---|
| student | relation → users | required |
| course | relation → courses | required |
| enrolled_at | date | |
| progress_percent | number | default 0 · **сервер-only** |
| completed_at | date | |

**Индекс:** `UNIQUE (student, course)`
**Правила:**
- list/view: `student = @request.auth.id || course.owner = @request.auth.id || @request.auth.role = "admin"`
- create: `@request.body.student = @request.auth.id || @request.auth.role = "admin"`
- update/delete: `student = @request.auth.id || course.owner = @request.auth.id || @request.auth.role = "admin"`
- (`progress_percent` пересчитывает хук.)

### 7. `session_progress` (base) — прогресс по урокам
| Поле | Тип | Опции |
|---|---|---|
| student | relation → users | required |
| course | relation → courses | required |
| lesson | relation → lessons | required |
| completed | bool | default false |
| completed_at | date | |
| xp_earned | number | default 0 · **сервер-only** |

**Индекс:** `UNIQUE (student, lesson)`
**Правила:**
- list/view: `student = @request.auth.id || course.owner = @request.auth.id || @request.auth.role = "admin"`
- create/update: `@request.body.student = @request.auth.id || (student = @request.auth.id) || @request.auth.role = "admin"`
- delete: `student = @request.auth.id || @request.auth.role = "admin"`
- (`xp_earned` и начисление XP — только хук.)

### 8. `comments` (base)
| Поле | Тип | Опции |
|---|---|---|
| course | relation → courses | required |
| author | relation → users | required |
| text | text | required, max 1000 |

**Правила:**
- list/view: `course.status = "published" || course.owner = @request.auth.id || @request.auth.role = "admin"`
- create: `@request.auth.id != "" && @request.body.author = @request.auth.id`
- update/delete: `author = @request.auth.id || @request.auth.role = "admin"`

### 9. `audit_logs` (base) — журнал доступа (GDPR/152-ФЗ)
| Поле | Тип | Опции |
|---|---|---|
| user | text | |
| action | text | required |
| target | text | |
| meta | json | |

**Правила:** list/view `@request.auth.role = "admin"` · create/update/delete `null` (пишет только хук с правами суперюзера).

---

## Что делает хук (`pb_hooks/main.pb.js`)

1. **Начисление XP** — при `session_progress.completed = true` берёт `lesson.xp`, добавляет к `users.xp`, пересчитывает `level` и `rank`, ставит `xp_earned`. При снятии галочки — вычитает.
2. **Прогресс курса** — пересчитывает `enrollments.progress_percent` по завершённым урокам.
3. **Защита полей** — на update `users` не-админом откатывает изменения `xp/level/role/institution`.
4. **Аудит** — пишет `audit_logs` на вход, экспорт, удаление данных.

Формула уровня/ранга совпадает с фронтом (`src/shared/lib/levels.ts`), чтобы не расходились.
