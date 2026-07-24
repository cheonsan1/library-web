import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Plus, User, LogOut, Library as LibraryIcon } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

const Header = ({ userRole, onUploadClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if(window.confirm('로그아웃 하시겠습니까?')) {
      try {
        await signOut(auth);
        navigate('/login');
      } catch (error) {
        console.error("로그아웃 실패:", error);
      }
    }
  };

  return (
    <header className="library-header" style={{ marginBottom: '2rem' }}>
      <div className="header-title-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <img src="/logo.png" alt="동인천노회 로고" style={{ height: '40px', objectFit: 'contain' }} />
        <h1 className="header-title-text">동인천노회 촬요 도서관</h1>
      </div>
      <div className="header-actions">
        {userRole === 'admin' && (
          <button 
            onClick={() => navigate('/admin')} 
            className={`btn-primary ${location.pathname === '/admin' ? 'action-btn-solid' : 'action-btn-outline'}`}
          >
            <Settings size={16} /> <span className="action-text">관리자 대시보드</span>
          </button>
        )}
        
        {userRole === 'admin' && onUploadClick && (
          <button 
            onClick={onUploadClick} 
            className="btn-primary action-btn-solid" 
          >
            <Plus size={16} /> <span className="action-text">새 촬요 업로드</span>
          </button>
        )}

        <button 
          onClick={() => navigate('/')} 
          className={`btn-primary ${location.pathname === '/' ? 'action-btn-solid' : 'action-btn-outline'}`}
        >
          <LibraryIcon size={16} /> <span className="action-text">도서관</span>
        </button>

        <button 
          onClick={() => navigate('/addressbook')} 
          className={`btn-primary ${location.pathname === '/addressbook' ? 'action-btn-solid' : 'action-btn-outline'}`}
        >
          <User size={16} /> <span className="action-text">노회 주소록</span>
        </button>

        <button 
          onClick={() => navigate('/mypage')} 
          className={`btn-primary ${location.pathname === '/mypage' ? 'action-btn-solid' : 'action-btn-outline'}`}
        >
          <Settings size={16} /> <span className="action-text">내 정보</span>
        </button>

        <button 
          onClick={handleLogout} 
          className="btn-primary action-btn-outline" 
          style={{ borderColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444' }}
        >
          <LogOut size={16} /> <span className="action-text">로그아웃</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
