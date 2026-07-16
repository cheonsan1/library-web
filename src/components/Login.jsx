import React from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../firebase';
import { BookOpen } from 'lucide-react';

const Login = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      alert(`로그인 중 오류가 발생했습니다.\n\n에러 내용: ${error.message}\n\nFirebase Console에서 Authentication -> Google 로그인 제공업체가 '사용 설정' 되어 있는지 확인해주세요.`);
    }
  };

  return (
    <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo.png" alt="동인천노회 로고" style={{ height: '80px', objectFit: 'contain' }} />
        </div>
        <h1 style={{ marginBottom: '0.5rem', fontSize: '1.8rem' }}>동인천노회 촬요 도서관</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.5' }}>
          정회원 전용 도서관입니다.<br/>
          안전한 서비스 이용을 위해 로그인해주세요.
        </p>
        <button onClick={handleLogin} className="btn-primary" style={{ width: '100%', padding: '14px' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '24px', height: '24px', background: 'white', borderRadius: '50%', padding: '2px' }} />
          구글 계정으로 시작하기
        </button>
      </div>
    </div>
  );
};

export default Login;
