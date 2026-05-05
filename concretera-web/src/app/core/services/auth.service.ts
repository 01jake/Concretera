import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, LoginDto, AuthResponse } from '../models/user';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = `${environment.apiUrl}/auth`;
  private userSubject = new BehaviorSubject<User | null>(null);

  user$: Observable<User | null> = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // sessionStorage es por pestaña — no se comparte entre pestañas
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('user');
      if (stored) this.userSubject.next(JSON.parse(stored));
    }
  }

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/login`, dto).pipe(
      tap(res => {
        sessionStorage.setItem('token', res.token);
        sessionStorage.setItem('user', JSON.stringify(res.user));
        this.userSubject.next(res.user);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    this.userSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage.getItem('token');
  }

  get currentUser(): User | null { return this.userSubject.value; }
  get isLoggedIn(): boolean { return !!this.userSubject.value; }

  get rol(): string {
    return this.userSubject.value?.rol?.toString() || '';
  }

  get isAdmin(): boolean {
    return ['ADMIN', '0'].includes(this.rol);
  }

  get isDespachador(): boolean {
    return ['DESPACHADOR', '1'].includes(this.rol);
  }

  get isConductor(): boolean {
    return ['CONDUCTOR', '2'].includes(this.rol);
  }

  get isAdminOrDespachador(): boolean {
    return this.isAdmin || this.isDespachador;
  }

  hasAccess(ruta: string): boolean {
    if (this.isAdmin) return true;
    const permisosDespachador = [
      'fleet', 'dispatch', 'clients', 'drivers', 'reports', 'entregas'
    ];
    const permisosConductor = ['conductor'];
    if (this.isDespachador) return permisosDespachador.includes(ruta);
    if (this.isConductor) return permisosConductor.includes(ruta);
    return false;
  }
}