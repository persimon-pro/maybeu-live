import React, { useState } from 'react';
// ВНИМАНИЕ: Проверь, чтобы путь к твоему firebase.js был правильным.
// Если Auth.jsx лежит в src/components, а firebase.js в src, то путь '../firebase'
import { auth } from '../firebase'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth';

const Auth = () => {
  // Состояния для хранения почты, пароля, ошибок и режима (вход или регистрация)
  const [isLogin, setIsLogin] = useState(true); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Функция, которая срабатывает при нажатии на кнопку отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault(); // Останавливаем перезагрузку страницы
    setError(''); // Очищаем прошлые ошибки
    
    try {
      if (isLogin) {
        // Запрос к Firebase на ВХОД
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Запрос к Firebase на РЕГИСТРАЦИЮ
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // Если все прошло успешно, Firebase сам поймет, что пользователь вошел.
      // Нам здесь больше ничего делать не нужно.
    } catch (err) {
      // Если пароль неверный или почта занята — выводим ошибку на экран
      setError(err.message); 
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
        {isLogin ? 'Вход в панель управления' : 'Регистрация ведущего'}
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="email" 
          placeholder="Твой Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ padding: '12px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <input 
          type="password" 
          placeholder="Пароль (минимум 6 символов)" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: '12px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        
        {/* Блок вывода ошибки красным цветом */}
        {error && <p style={{ color: 'red', fontSize: '14px', margin: '0' }}>{error}</p>}
        
        <button type="submit" style={{ padding: '12px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
          {isLogin ? 'Войти' : 'Зарегистрироваться'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
        {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          type="button"
          style={{ background: 'none', border: 'none', color: '#007bff', textDecoration: 'underline', cursor: 'pointer', fontSize: '14px', padding: '0' }}
        >
          {isLogin ? 'Создать' : 'Войти'}
        </button>
      </p>
    </div>
  );
};

export default Auth;
