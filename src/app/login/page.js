"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, LogIn } from "lucide-react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from "../../lib/firebase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const auth = getAuth(app);
      await signInWithEmailAndPassword(auth, email, password);
      // Redirigir al panel de administración tras iniciar sesión con éxito
      router.push("/admin");
    } catch (err) {
      console.error(err);
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center"
      style={{
        backgroundImage: `url('https://thumbs.dreamstime.com/z/jugo-de-naranja-fresco-en-vidrio-con-naranjas-y-fondo-huerto-para-consumo-saludable-disfrute-la-frescura-esta-imagen-zumo-natural-396706649.jpg')`
      }}
    >
      {/* Capa de superposición oscura/translúcida para que el formulario resalte perfectamente */}
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"></div>

      {/* Contenedor principal del Login */}
      <div className="relative z-10 bg-white/95 backdrop-blur-md p-8 rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <img 
              src="/logo.png" 
              alt="Maxxy Jugos Logo" 
              className="w-20 h-20 object-contain rounded-2xl shadow-md bg-white p-1 border border-slate-100" 
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Maxxy Jugos</h1>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">Panel de Control Administrador</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs p-3 rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="admin@maxxyjugos.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white text-slate-900"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50"
          >
            {cargando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Iniciar Sesión
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
