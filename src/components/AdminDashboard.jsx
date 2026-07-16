import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Shield, User } from 'lucide-react';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = [];
      usersSnap.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      // 최신 가입자 순으로 정렬 (가상)
      usersList.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Error updating role:", error);
      alert("권한 업데이트에 실패했습니다.");
    }
  };

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={28} color="#3b82f6" /> 관리자 설정
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>도서관 회원 가입 승인 및 권한을 관리합니다.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> 도서관으로 돌아가기
        </button>
      </header>

      <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            회원 목록을 불러오는 중입니다...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>이름</th>
                  <th style={{ padding: '1rem' }}>이메일</th>
                  <th style={{ padding: '1rem' }}>상태</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <User size={16} />
                      </div>
                      {u.name}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ padding: '1rem' }}>
                      {u.role === 'admin' ? (
                        <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}>최고 관리자</span>
                      ) : u.role === 'approved' ? (
                        <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}>정회원 (승인됨)</span>
                      ) : (
                        <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '600' }}>가입 대기</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {u.role === 'admin' ? (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>변경 불가</span>
                      ) : u.role === 'approved' ? (
                        <button 
                          onClick={() => handleUpdateRole(u.id, 'pending')}
                          style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ef4444', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <XCircle size={14} /> 권한 회수
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateRole(u.id, 'approved')}
                          style={{ background: '#10b981', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          <CheckCircle size={14} /> 가입 승인
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>가입한 회원이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
