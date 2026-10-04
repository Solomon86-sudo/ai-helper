import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

// Тестовые пользователи (пока нет реальной БД)
const MOCK_USERS = {
  'admin@ea.ru': { id: 1, name: 'Иван (Админ)', role: 'admin', password: '123' },
  'pto@ea.ru': { id: 2, name: 'Анна (ПТО)', role: 'pto', password: '123' },
  'gip@ea.ru': { id: 3, name: 'Сергей (ГИП)', role: 'gip', password: '123' },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = (email, password) => {
    const foundUser = MOCK_USERS[email];
    if (foundUser && foundUser.password === password) {
      // В реальной системе пароль не хранится в user, и тут возвращается токен
      const userInfo = { id: foundUser.id, name: foundUser.name, role: foundUser.role, email };
      setUser(userInfo);
      return { success: true };
    }
    return { success: false, error: 'Неверный логин или пароль' };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
