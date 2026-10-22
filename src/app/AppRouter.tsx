import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { RootLayout } from './RootLayout'
import { RouteError } from './RouteError'
import i18n from '@/shared/i18n/config'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { RequireRole } from '@/features/auth/RequireRole'
import { AppLayout } from '@/widgets/app/AppLayout'

const LandingPage = lazy(() => import('@/pages/LandingPage/LandingPage').then((m) => ({ default: m.LandingPage })))
const LoginPage = lazy(() => import('@/pages/LoginPage/LoginPage').then((m) => ({ default: m.LoginPage })))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage/PrivacyPage').then((m) => ({ default: m.PrivacyPage })))
const FeaturesPage = lazy(() => import('@/pages/FeaturesPage/FeaturesPage').then((m) => ({ default: m.FeaturesPage })))
const PortalPage = lazy(() => import('@/pages/PortalPage/PortalPage').then((m) => ({ default: m.PortalPage })))
const CabinetPage = lazy(() => import('@/pages/PortalPage/CabinetPage').then((m) => ({ default: m.CabinetPage })))
const QAChecklistPage = lazy(() => import('@/pages/QAChecklistPage').then((m) => ({ default: m.QAChecklistPage })))
const DashboardPage = lazy(() => import('@/pages/app/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const CoursesPage = lazy(() => import('@/pages/app/CoursesPage').then((m) => ({ default: m.CoursesPage })))
const CoursePage = lazy(() => import('@/pages/app/CoursePage').then((m) => ({ default: m.CoursePage })))
const AppProfilePage = lazy(() => import('@/pages/app/AppProfilePage').then((m) => ({ default: m.AppProfilePage })))
const PlaygroundPage = lazy(() => import('@/pages/app/PlaygroundPage').then((m) => ({ default: m.PlaygroundPage })))
const BoardPage = lazy(() => import('@/pages/app/BoardPage').then((m) => ({ default: m.BoardPage })))
const QuizzesPage = lazy(() => import('@/pages/app/QuizzesPage').then((m) => ({ default: m.QuizzesPage })))
const QuizTakePage = lazy(() => import('@/pages/app/QuizTakePage').then((m) => ({ default: m.QuizTakePage })))
const LeaderboardPage = lazy(() => import('@/pages/app/LeaderboardPage').then((m) => ({ default: m.LeaderboardPage })))
const TeachPage = lazy(() => import('@/pages/app/TeachPage').then((m) => ({ default: m.TeachPage })))
const CourseEditorPage = lazy(() => import('@/pages/app/CourseEditorPage').then((m) => ({ default: m.CourseEditorPage })))
const LessonEditorPage = lazy(() => import('@/pages/app/LessonEditorPage').then((m) => ({ default: m.LessonEditorPage })))
const LessonViewPage = lazy(() => import('@/pages/app/LessonViewPage').then((m) => ({ default: m.LessonViewPage })))
const SubmissionsPage = lazy(() => import('@/pages/app/SubmissionsPage').then((m) => ({ default: m.SubmissionsPage })))
const JournalPage = lazy(() => import('@/pages/app/JournalPage').then((m) => ({ default: m.JournalPage })))
const AdminPage = lazy(() => import('@/pages/app/AdminPage').then((m) => ({ default: m.AdminPage })))

function Fallback() {
  return <div className="flex min-h-screen items-center justify-center text-ink-muted">{i18n.t('common.loading')}</div>
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <PortalPage /> },
      { path: '/about', element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '/features', element: <FeaturesPage /> },
      { path: '/portal', element: <PortalPage /> },
      { path: '/cabinet', element: <CabinetPage /> },
      { path: '/qa', element: <QAChecklistPage /> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/app', element: <DashboardPage /> },
              { path: '/app/courses', element: <CoursesPage /> },
              { path: '/app/courses/:id', element: <CoursePage /> },
              { path: '/app/courses/:courseId/lessons/:lessonId', element: <LessonViewPage /> },
              { path: '/app/profile', element: <AppProfilePage /> },
              { path: '/app/playground', element: <PlaygroundPage /> },
              { path: '/app/board', element: <BoardPage /> },
              { path: '/app/quizzes', element: <QuizzesPage /> },
              { path: '/app/quiz/:id', element: <QuizTakePage /> },
              { path: '/app/leaderboard', element: <LeaderboardPage /> },
              {
                element: <RequireRole roles={['teacher', 'admin', 'superadmin']} />,
                children: [
                  { path: '/app/teach', element: <TeachPage /> },
                  { path: '/app/journal', element: <JournalPage /> },
                  { path: '/app/teach/:id', element: <CourseEditorPage /> },
                  { path: '/app/teach/:courseId/submissions', element: <SubmissionsPage /> },
                  { path: '/app/teach/:courseId/lessons/:lessonId', element: <LessonEditorPage /> },
                ],
              },
              {
                element: <RequireRole roles={['admin', 'superadmin']} />,
                children: [{ path: '/app/admin', element: <AdminPage /> }],
              },
            ],
          },
        ],
      },
      // неизвестный адрес → аккуратная страница вместо системной ошибки
      { path: '*', element: <RouteError /> },
    ],
  },
])

export function AppRouter() {
  return (
    <Suspense fallback={<Fallback />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
