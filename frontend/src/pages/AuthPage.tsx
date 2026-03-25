import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/Toast.js';
import './AuthPage.css';

const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Campo requerido'),
});

const registerSchema = z.object({
  nombre:   z.string().min(1, 'Campo requerido'),
  email:    z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm    = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export function AuthPage() {
  const [screen, setScreen] = useState<'login' | 'register'>('login');
  
  // Estados para mostrar/ocultar contraseñas
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showRegPass, setShowRegPass] = useState(false);

  const { toasts, showToast, removeToast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onLogin = async (data: LoginForm) => {
    const loadingId = showToast('loading', 'PROCESANDO', 'Verificando credenciales...');
    try {
      let res;
      try {
        res = await fetch('http://localhost:3000/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } catch (networkError) {
        removeToast(loadingId);
        showToast('error', 'ERROR DE CONEXIÓN', 'No se pudo contactar al servidor.');
        return;
      }

      removeToast(loadingId);
      if (!res.ok) {
        showToast('error', 'ACCESO DENEGADO', 'Credenciales incorrectas.');
        return;
      }

      showToast('success', 'ACCESO CONCEDIDO', 'Bienvenido al sistema.');
    } catch (error) {
      removeToast(loadingId);
      showToast('error', 'ERROR', 'Ocurrió un problema inesperado.');
    }
  };

  const onRegister = async (data: RegisterForm) => {
    const loadingId = showToast('loading', 'PROCESANDO', 'Creando cuenta...');
    try {
      let res;
      try {
        res = await fetch('http://localhost:3000/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      } catch (networkError) {
        removeToast(loadingId);
        showToast('error', 'ERROR DE CONEXIÓN', 'No se pudo contactar al servidor.');
        return;
      }

      removeToast(loadingId);
      if (!res.ok) {
        // Validamos si el backend devuelve 409 (Conflicto) o 400 por cuenta existente
        if (res.status === 409 || res.status === 400) {
          showToast('error', 'CUENTA EXISTENTE', 'Este correo ya se encuentra registrado.');
        } else {
          showToast('error', 'ERROR AL REGISTRAR', 'No se pudo crear la cuenta. Verifica los datos.');
        }
        return;
      }

      showToast('success', 'CUENTA CREADA', 'Ya puedes iniciar sesión.');
      setScreen('login');
      registerForm.reset(); // Limpia el formulario al tener éxito
    } catch (error) {
      removeToast(loadingId);
      showToast('error', 'ERROR', 'Ocurrió un problema inesperado.');
    }
  };

  return (
    <>
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header-tag">// SISTEMA DE ACCESO</div>
          <div className="auth-title">TO-DO<br />LIST</div>
          <div className="auth-subtitle-bar">
            <span>AUTENTICACIÓN REQUERIDA</span>
            <span>v1.0</span>
          </div>

          <div className="auth-card">
            {screen === 'login' ? (
              <>
                <div className="auth-screen-title">
                  ACCESO <span>[_]</span>
                </div>

                <form onSubmit={loginForm.handleSubmit(onLogin)}>
                  <div className="auth-field">
                    <label className="auth-label">Email</label>
                    <input
                      {...loginForm.register('email')}
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      className={`auth-input ${loginForm.formState.errors.email ? "error" : ""}`}
                    />
                    {loginForm.formState.errors.email && (
                      <div className="auth-error-msg">{loginForm.formState.errors.email.message}</div>
                    )}
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Contraseña</label>
                    <div className="auth-password-wrapper">
                      <input
                        {...loginForm.register('password')}
                        type={showLoginPass ? "text" : "password"}
                        placeholder="••••••••"
                        className={`auth-input ${loginForm.formState.errors.password ? "error" : ""}`}
                      />
                      <button
                        type="button"
                        className="auth-show-pass-btn"
                        onMouseDown={() => setShowLoginPass(true)}
                        onMouseUp={() => setShowLoginPass(false)}
                        onMouseLeave={() => setShowLoginPass(false)}
                        onTouchStart={() => setShowLoginPass(true)}
                        onTouchEnd={() => setShowLoginPass(false)}
                      >
                        {showLoginPass ? '[O]' : '[-]'}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && (
                      <div className="auth-error-msg">{loginForm.formState.errors.password.message}</div>
                    )}
                  </div>

                  <button type="submit" className="auth-btn">INGRESAR →</button>
                </form>

                <div className="auth-divider">
                  <div className="auth-divider-line" />
                  <div className="auth-divider-text">¿AÚN NO TIENES CUENTA?</div>
                  <div className="auth-divider-line" />
                </div>

                <button className="auth-register-link" onClick={() => setScreen('register')}>
                  CREAR CUENTA →
                </button>
              </>
            ) : (
              <>
                <button className="auth-back-btn" onClick={() => setScreen('login')}>
                  ← VOLVER
                </button>
                <div className="auth-screen-title">
                  NUEVA CUENTA <span>[+]</span>
                </div>

                <form onSubmit={registerForm.handleSubmit(onRegister)}>
                  <div className="auth-field">
                    <label className="auth-label">Nombre</label>
                    <input
                      {...registerForm.register('nombre')}
                      type="text"
                      placeholder="Tu nombre"
                      className={`auth-input ${registerForm.formState.errors.nombre ? "error" : ""}`}
                    />
                    {registerForm.formState.errors.nombre && (
                      <div className="auth-error-msg">{registerForm.formState.errors.nombre.message}</div>
                    )}
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Email</label>
                    <input
                      {...registerForm.register('email')}
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      className={`auth-input ${registerForm.formState.errors.email ? "error" : ""}`}
                    />
                    {registerForm.formState.errors.email && (
                      <div className="auth-error-msg">{registerForm.formState.errors.email.message}</div>
                    )}
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Contraseña</label>
                    <div className="auth-password-wrapper">
                      <input
                        {...registerForm.register('password')}
                        type={showRegPass ? "text" : "password"}
                        placeholder="••••••••"
                        className={`auth-input ${registerForm.formState.errors.password ? "error" : ""}`}
                      />
                      <button
                        type="button"
                        className="auth-show-pass-btn"
                        onMouseDown={() => setShowRegPass(true)}
                        onMouseUp={() => setShowRegPass(false)}
                        onMouseLeave={() => setShowRegPass(false)}
                        onTouchStart={() => setShowRegPass(true)}
                        onTouchEnd={() => setShowRegPass(false)}
                      >
                        {showRegPass ? '[O]' : '[-]'}
                      </button>
                    </div>
                    {registerForm.formState.errors.password && (
                      <div className="auth-error-msg">{registerForm.formState.errors.password.message}</div>
                    )}
                  </div>

                  <button type="submit" className="auth-btn">REGISTRARSE →</button>
                </form>
              </>
            )}

            <div className="auth-footer">
              <span>
                <span className="bracket">[</span> SISTEMA SEGURO <span className="bracket">]</span>
              </span>
              <span>UAG — 2026</span>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}