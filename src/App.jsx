import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import Login from './components/Login';
import PendingApproval from './components/PendingApproval';
import Library from './components/Library';
import BookViewer from './components/BookViewer';
import AdminDashboard from './components/AdminDashboard';
import BookEditor from './components/BookEditor';
import PrintView from './components/PrintView';
// ⭐ 1. 새로 만든 내 정보 관리 컴포넌트를 불러옵니다. (components 폴더 안에 넣으셨다고 가정)
import MyPage from './components/MyPage';
import AddressBook from './components/AddressBook';

// ⭐ 영구 관리자 권한을 가진 이메일 목록입니다. (이 계정들은 해임될 수 없습니다)
const SUPER_ADMIN_EMAILS = [
  'bagjaedeog@gmail.com', // 목사님 이메일
  'hssense@gmail.com', // 기존 최고 관리자
];

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check user role in Firestore with timeout
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);

          // 파이어베이스 DB가 미생성 상태일 때 무한 로딩 방지 (5초 타임아웃)
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firestore timeout')), 5000)
          );

          const userDoc = await Promise.race([getDoc(userDocRef), timeoutPromise]);

          if (userDoc.exists()) {
            let role = userDoc.data().role;
            // 최고 관리자 계정 자동 승급
            if (SUPER_ADMIN_EMAILS.includes(currentUser.email) && role !== 'admin') {
              role = 'admin';
              await setDoc(userDocRef, { role: 'admin' }, { merge: true });
            }
            setUserRole(role);
          } else {
            // New user, set default role 'pending'
            let role = SUPER_ADMIN_EMAILS.includes(currentUser.email) ? 'admin' : 'pending';
            await setDoc(userDocRef, {
              name: currentUser.displayName,
              email: currentUser.email,
              role: role,
              createdAt: new Date()
            });
            setUserRole(role);
          }
        } catch (error) {
          console.error("Error fetching user role: ", error);
          setUserRole('pending'); // 에러 시 기본적으로 pending 처리
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="page-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>로딩중...</h2>
          <p style={{ color: 'var(--text-secondary)' }}>정보를 확인하고 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />

        <Route path="/" element={
          !user ? <Navigate to="/login" /> :
            (userRole === 'approved' || userRole === 'admin') ? <Library userRole={userRole} /> : <Navigate to="/pending" />
        } />

        <Route path="/pending" element={
          !user ? <Navigate to="/login" /> :
            (userRole === 'approved' || userRole === 'admin') ? <Navigate to="/" /> : <PendingApproval user={user} />
        } />

        <Route path="/book/:id" element={
          !user ? <Navigate to="/login" /> :
            (userRole === 'approved' || userRole === 'admin') ? <BookViewer /> : <Navigate to="/pending" />
        } />

        {/* ⭐ 2. 내 정보 관리 라우트를 추가합니다. 승인된 사용자(approved)나 관리자(admin)만 접근 가능합니다. */}
        <Route path="/mypage" element={
          !user ? <Navigate to="/login" /> :
            (userRole === 'approved' || userRole === 'admin') ? <MyPage userRole={userRole} /> : <Navigate to="/pending" />
        } />

        <Route path="/addressbook" element={
          !user ? <Navigate to="/login" /> :
            (userRole === 'approved' || userRole === 'admin') ? <AddressBook userRole={userRole} /> : <Navigate to="/pending" />
        } />

        <Route path="/admin" element={
          !user ? <Navigate to="/login" /> :
            userRole === 'admin' ? <AdminDashboard userRole={userRole} /> : <Navigate to="/" />
        } />
        
        <Route path="/admin/editor" element={
          !user ? <Navigate to="/login" /> :
            userRole === 'admin' ? <BookEditor userRole={userRole} /> : <Navigate to="/" />
        } />

        <Route path="/print/:year/:season" element={
          !user ? <Navigate to="/login" /> :
            (userRole === 'approved' || userRole === 'admin') ? <PrintView /> : <Navigate to="/" />
        } />
      </Routes>
    </Router>
  );
}

export default App;