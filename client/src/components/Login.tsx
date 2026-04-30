import React, { useState } from 'react';

interface LoginProps {
  handleLogin: (email: string, password: string, role: string) => Promise<void>;
  handleRegister: (email: string, password: string, role: string) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ handleLogin, handleRegister }) => {
  const [role, setRole] = useState<'faculty' | 'student'>('faculty');
  const [email, setEmail] = useState('prof.sarah@srmist.edu.in');
  const [password, setPassword] = useState('password123');

  const onRoleToggle = (selectedRole: 'faculty' | 'student') => {
    setRole(selectedRole);
    if (selectedRole === 'faculty') {
      setEmail('prof.sarah@srmist.edu.in');
    } else {
      setEmail('john.doe@srmist.edu.in');
    }
    setPassword('password123');
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="display-title" style={{ color: 'var(--primary)', textAlign: 'center', marginBottom: '0.25rem' }}>STaMS</h1>
        <p className="text-muted" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>Academic Task Management</p>
        
        <div className="role-tabs">
          <button className={`role-tab ${role === 'faculty' ? 'active' : ''}`} onClick={() => onRoleToggle('faculty')}>Faculty</button>
          <button className={`role-tab ${role === 'student' ? 'active' : ''}`} onClick={() => onRoleToggle('student')}>Student</button>
        </div>

        <div className="input-group">
          <label className="label">Email Address (@srmist.edu.in)</label>
          <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        
        <div className="input-group" style={{ marginBottom: '2rem' }}>
          <label className="label">Password</label>
          <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button className="btn btn-primary w-full" onClick={() => handleLogin(email, password, role)}>Sign In</button>
        
        <button 
          className="btn btn-ghost w-full mt-4" 
          onClick={() => handleRegister(email, password, role)}
        >
          Register New Account
        </button>
      </div>
    </div>
  );
};

export default Login;
