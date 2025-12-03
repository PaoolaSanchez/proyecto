import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtener el usuario del localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser && currentUser.token) {
          const authReq = req.clone({
            setHeaders: {
              Authorization: `Bearer ${currentUser.token}`
            }
          });
          return next(authReq);
        }
      }
    } catch (e) {
      console.error('Error al leer token:', e);
    }
  }
  
  return next(req);
};
