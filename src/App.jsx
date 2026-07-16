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
            if (currentUser.email === 'hssense@gmail.com' && role !== 'admin') {
              role = 'admin';
              await setDoc(userDocRef, { role: 'admin' }, { merge: true });
            }
            setUserRole(role);
          } else {
            // New user, set default role 'pending'
            let role = currentUser.email === 'hssense@gmail.com' ? 'admin' : 'pending';
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

        <Route path="/admin" element={
          !user ? <Navigate to="/login" /> :
          userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
