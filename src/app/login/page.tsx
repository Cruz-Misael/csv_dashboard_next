'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const users = {
  'rubz.codeflow@gmail.com': 'SM135513$',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    if (email in users && users[email as keyof typeof users] === password) {
      localStorage.setItem('user', email);
      router.push('/dashboard');
    } else {
      setError('Usuário ou senha inválidos');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar com Logo */}
      <aside className="w-64 bg-[#3c3c50] text-white p-6 flex flex-col">
        <div className="mb-8">
        <Image
          src="/assets/Logo.png"
          alt="Logo"
          width={320} // opcional se usar `w-*`
          height={128} // opcional se usar `h-*`
          className="mx-auto h-28 w-64 object-cover object-center rounded-lg"
        />
        </div>
      </aside>

      {/* Área de Login */}
      <div className="flex-1 flex justify-center items-center p-6">
        <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
          {/* Cabeçalho (visível apenas em mobile) */}
          <div className="md:hidden text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Sémi</h1>
            <h2 className="text-xl text-gray-600">Semijoias</h2>
            <div className="my-6 border-t border-gray-300"></div>
          </div>

          {/* Formulário de login */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome de Usuário:</label>
              <input
                className="border rounded w-full p-3 placeholder-gray-400"
                placeholder="Digite seu nome..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha:</label>
              <input
                type="password"
                className="border rounded w-full p-3 placeholder-gray-400"
                placeholder="Digite sua senha..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="my-6 border-t border-gray-300"></div>

            <button
              className="bg-[#3c3c50] text-white rounded-lg p-3 w-full hover:bg-[#2d2d3a] transition-colors"
              onClick={handleLogin}
            >
              Login
            </button>

            <div className="text-center">
              <a href="#" className="text-sm text-gray-600 hover:text-gray-800">
                Esqueci minha senha
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}