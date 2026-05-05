import { Routes } from '@angular/router';
import { authGuard, adminGuard, adminOrDespachadorGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'fleet', pathMatch: 'full' },

  // Auth — sin guard
  {
    path: 'auth/login',
    loadComponent: () => import('./modules/auth/components/login/login.component').then(m => m.LoginComponent)
  },

  // Acceso denegado
  {
    path: 'acceso-denegado',
    loadComponent: () => import('./shared/components/acceso-denegado/acceso-denegado.component').then(m => m.AccesoDenegadoComponent)
  },

  // Admin + Despachador
  { path: 'fleet',       canActivate: [authGuard, adminOrDespachadorGuard], loadComponent: () => import('./modules/fleet/components/fleet-dashboard/fleet-dashboard.component').then(m => m.FleetDashboardComponent) },
  { path: 'dispatch',    canActivate: [authGuard, adminOrDespachadorGuard], loadComponent: () => import('./modules/dispatch/components/dispatch-form/dispatch-form.component').then(m => m.DispatchFormComponent) },
  { path: 'clients',     canActivate: [authGuard, adminOrDespachadorGuard], loadComponent: () => import('./modules/clients/components/client-list/client-list.component').then(m => m.ClientListComponent) },
  { path: 'drivers',     canActivate: [authGuard, adminOrDespachadorGuard], loadComponent: () => import('./modules/drivers/components/driver-list/driver-list.component').then(m => m.DriverListComponent) },
  { path: 'reports',     canActivate: [authGuard, adminOrDespachadorGuard], loadComponent: () => import('./modules/reports/components/trip-history/trip-history.component').then(m => m.TripHistoryComponent) },
  { path: 'entregas',    canActivate: [authGuard, adminOrDespachadorGuard], loadComponent: () => import('./modules/entregas/components/entregas/entregas.component').then(m => m.EntregasComponent) },
  { path: 'incidencias', canActivate: [authGuard, adminOrDespachadorGuard], loadComponent: () => import('./modules/incidencias/components/incidencias/incidencias.component').then(m => m.IncidenciasComponent) },
  { path: 'conductor',   canActivate: [authGuard],loadComponent: () => import('./modules/conductor/components/conductor/conductor.component').then(m => m.ConductorComponent) },
{
  path: 'mantenimientos',
  canActivate: [authGuard, adminOrDespachadorGuard],
  loadComponent: () =>
    import('./modules/mantenimientos/components/mantenimientos/mantenimientos.component')
      .then(m => m.MantenimientosComponent)
},
{
  path: 'mapa',
  canActivate: [authGuard, adminOrDespachadorGuard],
  loadComponent: () =>
    import('./modules/fleet/components/mapa-conductores/mapa-conductores.component')
      .then(m => m.MapaConductoresComponent)
},

  // Solo Admin
  { path: 'dashboard',  canActivate: [authGuard, adminGuard], loadComponent: () => import('./modules/dashboard/components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'inventario', canActivate: [authGuard, adminGuard], loadComponent: () => import('./modules/inventario/components/inventario/inventario.component').then(m => m.InventarioComponent) },
{
  path: 'facturas',
  canActivate: [authGuard, adminGuard],
  loadComponent: () =>
    import('./modules/facturas/components/facturas/facturas.component')
      .then(m => m.FacturasComponent)
},
  { path: '**', redirectTo: 'fleet' }
];