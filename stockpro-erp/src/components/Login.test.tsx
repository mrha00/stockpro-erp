import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import Login from './Login';
import { I18nProvider } from '../i18n/I18nContext';

function renderLogin(onLoginSuccess = vi.fn().mockResolvedValue(undefined)) {
  return render(
    <I18nProvider>
      <Login onLoginSuccess={onLoginSuccess} />
    </I18nProvider>
  );
}

function submitForm() {
  const form = document.getElementById('loginForm');
  expect(form).toBeTruthy();
  fireEvent.submit(form!);
}

describe('Login', () => {
  afterEach(() => cleanup());

  it('renders login form', () => {
    renderLogin();
    expect(document.getElementById('loginBtn')).toBeInTheDocument();
    expect(screen.getByLabelText(/用户名/i)).toBeInTheDocument();
  });

  it('shows error for empty fields', async () => {
    renderLogin();
    submitForm();
    await waitFor(() => {
      expect(screen.getByText(/请输入有效的用户名和密码/i)).toBeInTheDocument();
    });
  });

  it('calls onLoginSuccess with credentials', async () => {
    const onLoginSuccess = vi.fn().mockResolvedValue(undefined);
    renderLogin(onLoginSuccess);

    fireEvent.change(document.getElementById('username')!, { target: { value: 'admin' } });
    fireEvent.change(document.getElementById('password')!, { target: { value: '123456' } });
    submitForm();

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledWith('admin', '123456');
    });
  });
});
