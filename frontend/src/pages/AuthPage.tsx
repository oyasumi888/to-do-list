import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '../hooks/useToast.js';
import { ToastContainer } from '../components/Toast.js';

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

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#E8E4D9',
    backgroundImage: `
      linear-gradient(rgba(0,0,0,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.07) 1px, transparent 1px)
    `,
    backgroundSize: '32px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Space Mono", monospace',
    padding: '16px',
  },
  container: { width: '100%', maxWidth: '480px' },
  headerTag: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '11px',
    letterSpacing: '4px',
    color: '#E85D00',
    marginBottom: '8px',
  },
  title: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '64px',
    lineHeight: 0.9,
    color: '#1A1A1A',
    marginBottom: '4px',
    letterSpacing: '2px',
  },
  subtitleBar: {
    background: '#1A1A1A',
    color: '#E85D00',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '11px',
    letterSpacing: '6px',
    padding: '6px 12px',
    marginBottom: '32px',
    display: 'flex',
    justifyContent: 'space-between',
  },
  card: {
    background: '#1A1A1A',
    padding: '32px',
  },
  screenTitle: {
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '22px',
    letterSpacing: '4px',
    color: '#E8E4D9',
    marginBottom: '24px',
    paddingBottom: '12px',
    borderBottom: '1px solid #2A2A2A',
  },
  label: {
    display: 'block',
    fontSize: '10px',
    letterSpacing: '3px',
    color: '#666',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
  },
  input: {
    width: '100%',
    background: '#111',
    border: '1px solid #333',
    color: '#E8E4D9',
    fontFamily: '"Space Mono", monospace',
    fontSize: '13px',
    padding: '12px 14px',
    outline: 'none',
  },
  inputError: {
    width: '100%',
    background: '#111',
    border: '1px solid #E83030',
    color: '#E8E4D9',
    fontFamily: '"Space Mono", monospace',
    fontSize: '13px',
    padding: '12px 14px',
    outline: 'none',
  },
  errorMsg: {
    fontSize: '10px',
    color: '#E83030',
    letterSpacing: '1px',
    marginTop: '4px',
  },
  btn: {
    width: '100%',
    background: '#E85D00',
    color: '#1A1A1A',
    border: 'none',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '20px',
    letterSpacing: '4px',
    padding: '14px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '24px 0 20px',
  },
  dividerLine: { flex: 1, height: '1px', background: '#2A2A2A' },
  dividerText: { fontSize: '9px', letterSpacing: '3px', color: '#444' },
  registerLink: {
    width: '100%',
    background: 'transparent',
    color: '#E8E4D9',
    border: '1px solid #333',
    fontFamily: '"Bebas Neue", sans-serif',
    fontSize: '16px',
    letterSpacing: '3px',
    padding: '12px',
    cursor: 'pointer',
    textAlign: 'center' as const,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#555',
    fontFamily: '"Space Mono", monospace',
    fontSize: '10px',
    letterSpacing: '2px',
    cursor: 'pointer',
    marginBottom: '20px',
    padding: 0,
  },
  footerTag: {
    fontSize: '9px',
    letterSpacing: '3px',
    color: '#444',
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'space-between',
  },
};

export function AuthPage() {
  const [screen, setScreen] = useState<'login' | 'register'>('login');
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
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      removeToast(loadingId);
      if (!res.ok) throw new Error();
      showToast('success', 'ACCESO CONCEDIDO', 'Bienvenido al sistema.');
      // aquí redirigirás al dashboard cuando lo tengas
    } catch {
      removeToast(loadingId);
      showToast('error', 'ACCESO DENEGADO', 'Credenciales incorrectas.');
    }
  };

  const onRegister = async (data: RegisterForm) => {
    const loadingId = showToast('loading', 'PROCESANDO', 'Creando cuenta...');
    try {
      const res = await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      removeToast(loadingId);
      if (!res.ok) throw new Error();
      showToast('success', 'CUENTA CREADA', 'Ya puedes iniciar sesión.');
      setScreen('login');
    } catch {
      removeToast(loadingId);
      showToast('error', 'ERROR', 'No se pudo crear la cuenta.');
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');
        @keyframes slideIn { from { transform: translateX(120%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes fadeOut { to   { transform: translateX(120%); opacity:0; } }
        @keyframes spin    { to   { transform: rotate(360deg); } }
        @keyframes progress { from { width: 100%; } to { width: 0%; } }
        input:focus { border-color: #E85D00 !important; }
      `}</style>

      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.headerTag}>// SISTEMA DE ACCESO</div>
          <div style={styles.title}>TO-DO<br />LIST</div>
          <div style={styles.subtitleBar}>
            <span>AUTENTICACIÓN REQUERIDA</span>
            <span>v1.0</span>
          </div>

          <div style={styles.card}>
            {screen === 'login' ? (
              <>
                <div style={styles.screenTitle}>
                  ACCESO <span style={{ color: '#E85D00' }}>[_]</span>
                </div>

                <form onSubmit={loginForm.handleSubmit(onLogin)}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={styles.label}>Email</label>
                    <input
                      {...loginForm.register('email')}
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      style={loginForm.formState.errors.email ? styles.inputError : styles.input}
                    />
                    {loginForm.formState.errors.email && (
                      <div style={styles.errorMsg}>{loginForm.formState.errors.email.message}</div>
                    )}
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={styles.label}>Contraseña</label>
                    <input
                      {...loginForm.register('password')}
                      type="password"
                      placeholder="••••••••"
                      style={loginForm.formState.errors.password ? styles.inputError : styles.input}
                    />
                    {loginForm.formState.errors.password && (
                      <div style={styles.errorMsg}>{loginForm.formState.errors.password.message}</div>
                    )}
                  </div>

                  <button type="submit" style={styles.btn}>INGRESAR →</button>
                </form>

                <div style={styles.divider}>
                  <div style={styles.dividerLine} />
                  <div style={styles.dividerText}>¿AÚN NO TIENES CUENTA?</div>
                  <div style={styles.dividerLine} />
                </div>

                <button style={styles.registerLink} onClick={() => setScreen('register')}>
                  CREAR CUENTA →
                </button>
              </>
            ) : (
              <>
                <button style={styles.backBtn} onClick={() => setScreen('login')}>
                  ← VOLVER
                </button>
                <div style={styles.screenTitle}>
                  NUEVA CUENTA <span style={{ color: '#E85D00' }}>[+]</span>
                </div>

                <form onSubmit={registerForm.handleSubmit(onRegister)}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={styles.label}>Nombre</label>
                    <input
                      {...registerForm.register('nombre')}
                      type="text"
                      placeholder="Tu nombre"
                      style={registerForm.formState.errors.nombre ? styles.inputError : styles.input}
                    />
                    {registerForm.formState.errors.nombre && (
                      <div style={styles.errorMsg}>{registerForm.formState.errors.nombre.message}</div>
                    )}
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={styles.label}>Email</label>
                    <input
                      {...registerForm.register('email')}
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      style={registerForm.formState.errors.email ? styles.inputError : styles.input}
                    />
                    {registerForm.formState.errors.email && (
                      <div style={styles.errorMsg}>{registerForm.formState.errors.email.message}</div>
                    )}
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={styles.label}>Contraseña</label>
                    <input
                      {...registerForm.register('password')}
                      type="password"
                      placeholder="••••••••"
                      style={registerForm.formState.errors.password ? styles.inputError : styles.input}
                    />
                    {registerForm.formState.errors.password && (
                      <div style={styles.errorMsg}>{registerForm.formState.errors.password.message}</div>
                    )}
                  </div>

                  <button type="submit" style={styles.btn}>REGISTRARSE →</button>
                </form>
              </>
            )}

            <div style={styles.footerTag}>
              <span><span style={{ color: '#E85D00', fontFamily: '"Bebas Neue", sans-serif' }}>[</span> SISTEMA SEGURO <span style={{ color: '#E85D00', fontFamily: '"Bebas Neue", sans-serif' }}>]</span></span>
              <span>UAG — 2026</span>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </>
  );
}