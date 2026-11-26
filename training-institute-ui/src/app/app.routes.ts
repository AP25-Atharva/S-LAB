import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/auth.guards';
import { LoginPage } from './pages/login/login';
import { ChangePasswordPage } from './pages/account/change-password';
import { UserFormPage } from './pages/users/user-form';
import { UserListPage } from './pages/users/user-list';
import { DashboardPage } from './pages/dashboard/dashboard';
import { CourseDetailPage } from './pages/courses/course-detail';
import { CourseFormPage } from './pages/courses/course-form';
import { CourseListPage } from './pages/courses/course-list';
import { TrainerDetailPage } from './pages/trainers/trainer-detail';
import { TrainerFormPage } from './pages/trainers/trainer-form';
import { TrainerListPage } from './pages/trainers/trainer-list';
import { StudentDetailPage } from './pages/students/student-detail';
import { StudentFormPage } from './pages/students/student-form';
import { StudentListPage } from './pages/students/student-list';
import { BatchDetailPage } from './pages/batches/batch-detail';
import { BatchFormPage } from './pages/batches/batch-form';
import { BatchListPage } from './pages/batches/batch-list';
import { EnrolmentFormPage } from './pages/enrolments/enrolment-form';
import { EnrolmentListPage } from './pages/enrolments/enrolment-list';

const t = (page: string) => `${page} · BatchWise`;

export const routes: Routes = [
  { path: 'login', component: LoginPage, title: t('Sign in'), canActivate: [guestGuard] },
  {
    path: '',
    canActivateChild: [authGuard],
    children: [
    { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    { path: 'dashboard', component: DashboardPage, title: t('Dashboard') },

    { path: 'courses', component: CourseListPage, title: t('Courses') },
    { path: 'courses/new', component: CourseFormPage, title: t('Add course') },
    { path: 'courses/:id', component: CourseDetailPage, title: t('Course') },
    { path: 'courses/:id/edit', component: CourseFormPage, title: t('Edit course') },

    { path: 'trainers', component: TrainerListPage, title: t('Trainers') },
    { path: 'trainers/new', component: TrainerFormPage, title: t('Add trainer') },
    { path: 'trainers/:id', component: TrainerDetailPage, title: t('Trainer') },
    { path: 'trainers/:id/edit', component: TrainerFormPage, title: t('Edit trainer') },

    { path: 'students', component: StudentListPage, title: t('Students') },
    { path: 'students/new', component: StudentFormPage, title: t('Add student') },
    { path: 'students/:id', component: StudentDetailPage, title: t('Student') },
    { path: 'students/:id/edit', component: StudentFormPage, title: t('Edit student') },

    { path: 'batches', component: BatchListPage, title: t('Batches') },
    { path: 'batches/new', component: BatchFormPage, title: t('Schedule batch') },
    { path: 'batches/:id', component: BatchDetailPage, title: t('Batch summary') },
    { path: 'batches/:id/edit', component: BatchFormPage, title: t('Edit batch') },

    { path: 'enrolments', component: EnrolmentListPage, title: t('Enrolments') },
    { path: 'enrolments/new', component: EnrolmentFormPage, title: t('Enrol student') },
    { path: 'enrolments/:id/edit', component: EnrolmentFormPage, title: t('Edit enrolment') },

      { path: 'account/password', component: ChangePasswordPage, title: t('Change password') },

      { path: 'users', component: UserListPage, title: t('Users'), canActivate: [adminGuard] },
      { path: 'users/new', component: UserFormPage, title: t('Add user'), canActivate: [adminGuard] },
      { path: 'users/:id/edit', component: UserFormPage, title: t('Edit user'), canActivate: [adminGuard] },
    ],
  },

  { path: '**', redirectTo: 'dashboard' },
];
