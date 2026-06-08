import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { getToken, setSession } from '@/lib/auth';

// ─── Iconos SVG (Heroicons outline) ──────────────────────────────────────────
const IconMail = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const IconLock = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const IconEye = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const IconEyeOff = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);

const IconAlert = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const IconCheckCircle = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconShield = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

// ─── Slides del panel izquierdo con textos dinámicos ──────────────────────────
const SLIDES = [
    {
        image: 'https://images.unsplash.com/photo-1553413077-190dd305871cw=1200&q=80',
        title: 'Control total de tu inventario',
        subtitle: 'Gestiona entradas, salidas y series en tiempo real.',
    },
    {
        image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7w=1200&q=80',
        title: 'Monitorea tu flotilla en tiempo real',
        subtitle: 'Bitácoras, mantenimientos y kilometraje en un solo lugar.',
    },
    {
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475w=1200&q=80',
        title: 'Operaciones sin interrupciones',
        subtitle: 'Tecnología robusta y segura para empresas que no pueden parar.',
    },
    {
        image: 'https://images.unsplash.com/photo-1565891741441-64926e441838w=1200&q=80',
        title: 'Reportes y estadísticas al instante',
        subtitle: 'Toma decisiones basadas en datos reales.',
    },
];

// ─── Partículas flotantes decorativas ────────────────────────────────────────
function FloatingParticle({ delay, duration, x, y, size, opacity }) {
    return (
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
                left: `${x}%`,
                top: `${y}%`,
                width: size,
                height: size,
                background: `radial-gradient(circle, rgba(96,165,250,${opacity}) 0%, rgba(59,130,246,0) 70%)`,
            }}
            animate={{
                y: [0, -30, 0],
                x: [0, 15, -10, 0],
                scale: [1, 1.2, 0.9, 1],
                opacity: [opacity, opacity * 1.5, opacity * 0.6, opacity],
            }}
            transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        />
    );
}

// ─── Panel izquierdo con slider Ken Burns ────────────────────────────────────
function LeftPanel() {
    const [current, setCurrent] = useState(0);
    const [prev, setPrev] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setPrev(current);
            setCurrent((c) => (c + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [current]);

    const particles = [
        { delay: 0,   duration: 6,   x: 10, y: 20, size: 180, opacity: 0.15 },
        { delay: 1.5, duration: 8,   x: 70, y: 10, size: 220, opacity: 0.12 },
        { delay: 0.8, duration: 7,   x: 55, y: 65, size: 160, opacity: 0.18 },
        { delay: 2.2, duration: 9,   x: 20, y: 75, size: 130, opacity: 0.1  },
        { delay: 0.3, duration: 5.5, x: 85, y: 45, size: 100, opacity: 0.2  },
        { delay: 3,   duration: 7.5, x: 40, y: 88, size: 140, opacity: 0.13 },
    ];

    return (
        <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden bg-[#0d1b3e]">
            {/* Slides con efecto Ken Burns */}
            <AnimatePresence>
                <motion.div
                    key={current}
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${SLIDES[current].image})` }}
                    initial={{ opacity: 0, scale: 1.08 }}
                    animate={{ opacity: 1, scale: 1.0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                />
            </AnimatePresence>

            {/* Overlay degradado azul profundo */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0d1b3e]/90 via-[#1a2f70]/80 to-[#0a1628]/85" />

            {/* Partículas flotantes */}
            {particles.map((p, i) => (
                <FloatingParticle key={i} {...p} />
            ))}

            {/* Patrón de hexágonos decorativos (brand SmartLynk) */}
            <div className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='52' viewBox='0 0 60 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 17.3v17.4L30 52 0 34.7V17.3L30 0z' fill='none' stroke='%2360a5fa' stroke-width='1'/%3E%3C/svg%3E")`,
                    backgroundSize: '60px 52px',
                }}
            />

            {/* Contenido textual */}
            <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                >
                    <img
                        src="https://smartlynk.com.mx/uploads/settings/1755284902_47091f74f5c180651419.webp"
                        alt="Smartlynk Consultores"
                        className="h-12 object-contain brightness-0 invert"
                    />
                </motion.div>

                {/* Texto dinámico del slide */}
                <div className="mb-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={current}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                        >
                            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
                                {SLIDES[current].title}
                            </h2>
                            <p className="text-blue-200/80 text-lg">
                                {SLIDES[current].subtitle}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Indicadores del slider */}
                    <div className="flex gap-2 mt-8">
                        {SLIDES.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => { setPrev(current); setCurrent(i); }}
                                className="h-1 rounded-full transition-all duration-500 cursor-pointer"
                                style={{
                                    width: i === current ? '32px' : '8px',
                                    background: i === current ?
                                         'rgba(96,165,250,1)'
                                        : 'rgba(96,165,250,0.3)',
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Input con micro-interacciones ───────────────────────────────────────────
function AnimatedInput({ id, label, type: initialType, placeholder, icon, value, onChange, error }) {
    const [focused, setFocused] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const isPassword = initialType === 'password';
    const inputType = isPassword ? (showPass ? 'text' : 'password') : initialType;

    return (
        <div className="flex flex-col gap-2">
            <label htmlFor={id} className="text-sm font-medium text-slate-300">
                {label}
            </label>
            <motion.div
                animate={{
                    boxShadow: error ?
                         '0 0 0 2px rgba(239,68,68,0.7)'
                        : focused ?
                             '0 0 0 2px rgba(59,130,246,0.7)'
                            : '0 0 0 1px rgba(255,255,255,0.1)',
                }}
                transition={{ duration: 0.2 }}
                className="relative flex items-center rounded-xl bg-white/5 border border-white/10 overflow-hidden"
            >
                {/* Icono izquierdo */}
                <motion.span
                    animate={{ color: error ? '#ef4444' : focused ? '#60a5fa' : '#64748b' }}
                    transition={{ duration: 0.2 }}
                    className="pl-4 pr-2 flex items-center select-none"
                >
                    {icon}
                </motion.span>

                <input
                    id={id}
                    type={inputType}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className="flex-1 bg-transparent py-4 pr-4 text-white placeholder-slate-500 outline-none text-sm"
                    autoComplete={isPassword ? 'current-password' : 'email'}
                />

                {/* Toggle de contraseña */}
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPass((s) => !s)}
                        className="pr-4 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer flex items-center"
                        tabIndex={-1}
                        aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                        {showPass ? <IconEyeOff /> : <IconEye />}
                    </button>
                )}
            </motion.div>

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-1"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
}

// ─── Panel derecho: Formulario ────────────────────────────────────────────────
function RightPanel() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [shakeKey, setShakeKey] = useState(0);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (getToken()) {
            window.location.replace('/dashboard');
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        try {
            const res = await axios.post('/api/auth/login', { email, password }, {
                headers: { Accept: 'application/json' },
            });
            setSession(res.data.token, res.data.usuario);
            setSuccess(true);
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 800);
        } catch (err) {
            setLoading(false);
            // Disparar animación de shake
            setShakeKey((k) => k + 1);

            if (err.response.status === 422) {
                const serverErrors = err.response.data.errors || {};
                setErrors({
                    email: serverErrors.email?.[0] || null,
                    general: 'Las credenciales son incorrectas.',
                });
            } else if (err.response.status === 429) {
                setErrors({ general: 'Demasiados intentos. Espera un momento.' });
            } else if (err.response.status === 403 && err.response.data.requiere_cambio) {
                setErrors({ general: err.response.data.mensaje || 'Debes actualizar tu contrasena antes de continuar.' });
            } else {
                setErrors({ general: 'Error de conexión. Intenta de nuevo.' });
            }
        }
    };

    // Variante de shake para error
    const shakeVariants = {
        initial: { x: 0 },
        shake: {
            x: [0, -14, 14, -10, 10, -6, 6, -3, 3, 0],
            transition: { duration: 0.6, ease: 'easeInOut' },
        },
    };

    return (
        <div className="flex w-full lg:w-1/2 items-center justify-center bg-[#0a1628] p-8">
            {/* Fondo de partículas en móvil */}
            <div className="absolute inset-0 lg:hidden overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-600/20 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-blue-400/15 blur-3xl" />
            </div>

            <motion.div
                className="relative w-full max-w-lg"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
            >
                {/* Tarjeta glassmorphism */}
                <motion.div
                    key={shakeKey}
                    variants={shakeKey > 0 ? shakeVariants : {}}
                    initial="initial"
                    animate={shakeKey > 0 ? 'shake' : 'initial'}
                    className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 sm:p-12 shadow-2xl shadow-black/40"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
                    }}
                >
                    {/* Logo centrado (visible solo en móvil) */}
                    <div className="flex justify-center mb-6 lg:hidden">
                        <img
                            src="https://smartlynk.com.mx/uploads/settings/1755284902_47091f74f5c180651419.webp"
                            alt="Smartlynk"
                            className="h-10 object-contain brightness-0 invert"
                        />
                    </div>

                    {/* Header */}
                    <div className="mb-10">
                        <motion.div
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/20 mb-4"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            <span className="text-blue-300 text-xs font-medium">Sistema Interno</span>
                        </motion.div>
                        <h1 className="text-2xl font-bold text-white">Bienvenido de vuelta</h1>
                        <p className="text-slate-400 text-sm mt-1">Ingresa tus credenciales para continuar</p>
                    </div>

                    {/* Error general */}
                    <AnimatePresence>
                        {errors.general && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3"
                            >
                                <span className="text-red-400 flex items-center gap-2 text-sm">
                                    <IconAlert />
                                    {errors.general}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Éxito */}
                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-4 flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3"
                            >
                                <span className="text-green-400 flex items-center gap-2 text-sm">
                                    <IconCheckCircle />
                                    Sesión iniciada. Redirigiendo...
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                        <AnimatedInput
                            id="email"
                            label="Correo electrónico"
                            type="email"
                            placeholder="usuario@smartlynk.com.mx"
                            icon={<IconMail />}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={errors.email}
                        />

                        <AnimatedInput
                            id="password"
                            label="Contraseña"
                            type="password"
                            placeholder="••••••••"
                            icon={<IconLock />}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={errors.password}
                        />

                        {/* Botón de submit */}
                        <motion.button
                            type="submit"
                            disabled={loading || success}
                            whileHover={{ scale: loading ? 1 : 1.02 }}
                            whileTap={{ scale: loading ? 1 : 0.98 }}
                            className="relative mt-6 w-full rounded-xl py-4 font-bold text-white overflow-hidden cursor-pointer disabled:cursor-not-allowed"
                            style={{
                                background: loading || success ?
                                     'rgba(59,130,246,0.5)'
                                    : 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                            }}
                        >
                            {/* Brillo animado en el botón */}
                            {!loading && !success && (
                                <motion.div
                                    className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 60%)',
                                    }}
                                />
                            )}

                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? (
                                    <>
                                        <motion.span
                                            className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                        />
                                        Verificando...
                                    </>
                                ) : success ? (
                                    <span className="flex items-center gap-2">
                                        <IconCheckCircle />
                                        Sesión iniciada
                                    </span>
                                ) : (
                                    'Ingresar al sistema'
                                )}
                            </span>
                        </motion.button>
                    </form>

                    {/* Footer de la tarjeta */}
                    <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-center gap-2">
                        <span className="text-slate-400 flex items-center gap-1 text-xs">
                            <IconShield />
                            Protegido por
                        </span>
                        <span className="text-blue-400 text-xs font-semibold">SmartLynk Security</span>
                        <span className="text-slate-600 text-xs">•</span>
                        <span className="text-slate-500 text-xs">Laravel Sanctum</span>
                    </div>
                </motion.div>

                {/* Decoración exterior de la tarjeta */}
                <div
                    className="absolute -inset-1 rounded-3xl opacity-20 -z-10 blur-xl"
                    style={{
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8, #6366f1)',
                    }}
                />
            </motion.div>
        </div>
    );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function LoginPage() {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0a1628]">
            <LeftPanel />
            <RightPanel />
        </div>
    );
}
