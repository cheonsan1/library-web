import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { ShieldAlert, LogOut } from 'lucide-react';

const PendingApproval = ({ user, bypassApproval }) => {
  return (
    <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', textAlign: 'center', maxWidth: '450px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '50%', display: 'inline-flex' }}>
            <ShieldAlert size={48} color="#fbbf24" />
          </div>
        </div>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>승인 대기 중</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.6' }}>
          <strong>{user?.displayName}</strong>님의 계정은<br/>현재 관리자 승인 대기 상태입니다.
        </p>
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: '#b45309', margin: 0, lineHeight: '1.5' }}>
            개인정보 보호를 위해 관리자의 승인이 완료된 정회원만 도서관을 이용하실 수 있습니다. 승인 처리가 완료될 때까지 잠시만 기다려주세요.
          </p>
        </div>

        <button 
          onClick={() => signOut(auth)} 
          className="btn-primary" 
          style={{ width: '100%', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', color: 'var(--text-primary)' }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(0,0,0,0.05)';
            e.currentTarget.style.border = '1px solid rgba(0,0,0,0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.border = '1px solid rgba(0,0,0,0.1)';
          }}
        >
          <LogOut size={18} />
          다른 계정으로 로그인 (로그아웃)
        </button>
      </div>
    </div>
  );
};

export default PendingApproval;
