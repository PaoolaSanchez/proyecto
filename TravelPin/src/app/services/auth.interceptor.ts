import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtener el usuario del localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser && currentUser.token) {
          console.log('🔐 Interceptor: Agregando token a', req.url);
          const authReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${currentUser.token}`
            }
          });
          return next(authReq);
        } else {
          console.warn('⚠️ Interceptor: Usuario sin token', currentUser);
        }
      } else {
        console.warn('⚠️ Interceptor: No hay currentUser en localStorage');
      }
    } catch (e) {
      console.error('❌ Interceptor: Error al leer token:', e);
    }
  }
  
  return next(req);
};
