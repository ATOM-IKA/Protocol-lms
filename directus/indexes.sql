-- Составные уникальные ключи (сгенерировано apply.mjs). Выполнить один раз после создания схемы.
CREATE UNIQUE INDEX uq_enrollments_student_course ON `enrollments` (`student`, `course`);
CREATE UNIQUE INDEX uq_session_progress_student_lesson ON `session_progress` (`student`, `lesson`);
CREATE UNIQUE INDEX uq_attendance_lesson_student ON `attendance` (`lesson`, `student`);
CREATE UNIQUE INDEX uq_board_completions_task_student ON `board_completions` (`task`, `student`);
CREATE UNIQUE INDEX uq_leaderboard_user ON `leaderboard` (`user`);
