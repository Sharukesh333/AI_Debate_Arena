import React from 'react';

type ThemeToggleProps = {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
};

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button
      className="btn-theme"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      style={{
        background: 'none',
        border: 'none',
        fontSize: '1.25rem',
        cursor: 'pointer',
        padding: '0.5rem',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s ease',
      }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};
