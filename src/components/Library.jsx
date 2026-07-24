import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import { Library as LibraryIcon, User, BookOpen, Plus, Trash2, Settings } from 'lucide-react';
import UploadModal from './UploadModal';
import Header from './Header';
const Library = ({ userRole }) => {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "books"), orderBy("id", "desc"));
      const querySnapshot = await getDocs(q);
      const booksData = [];
      querySnapshot.forEach((doc) => {
        booksData.push(doc.data());
      });
      setBooks(booksData);
    } catch (error) {
      console.error("Error fetching books: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleDelete = async (e, book) => {
    e.stopPropagation(); // 클릭 시 상세 페이지로 넘어가는 이벤트 방지
    if (window.confirm(`정말로 '${book.title}' 자료를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 원본 파일도 완전히 삭제됩니다.`)) {
      try {
        setLoading(true);
        // 1. 데이터베이스(Firestore) 문서 삭제
        await deleteDoc(doc(db, 'books', book.id));
        
        // 2. Storage의 PDF 원본 삭제 시도
        try {
          await deleteObject(ref(storage, `books/${book.id}.pdf`));
        } catch (err) {
          console.warn("PDF 삭제 실패 (이미 없을 수 있음):", err);
        }
        
        // 3. Storage의 썸네일 이미지 삭제 시도
        if (book.thumbnailUrl) {
          try {
            await deleteObject(ref(storage, `books/${book.id}_thumb.jpg`));
          } catch (err) {
            console.warn("썸네일 삭제 실패:", err);
          }
        }
        
        // 목록 새로고침
        await fetchBooks();
      } catch (error) {
        console.error("삭제 중 오류 발생:", error);
        alert("삭제 중 오류가 발생했습니다.");
        setLoading(false);
      }
    }
  };

  return (
    <div className="page-container">
      <Header userRole={userRole} onUploadClick={() => setShowUpload(true)} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>책을 불러오는 중입니다...</div>
      ) : books.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <BookOpen size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
          <h3>아직 업로드된 책이 없습니다.</h3>
          <p style={{ marginTop: '0.5rem' }}>상단의 [새 촬요 업로드] 버튼을 눌러 PDF를 추가해보세요.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2rem' }}>
          {books.map((book, index) => (
            <div 
              key={book.id}
            className="glass-panel animate-fade-in"
            style={{ 
              cursor: 'pointer', 
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animationDelay: `${index * 0.1}s`,
              opacity: 0,
              animationFillMode: 'forwards'
            }}
            onClick={() => navigate(`/book/${book.id}`)}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 32px 0 rgba(0, 0, 0, 0.05)';
            }}
          >
            {/* Book Cover Concept */}
            <div style={{ 
              height: '280px', 
              background: book.thumbnailUrl ? `url(${book.thumbnailUrl}) center/cover no-repeat` : book.coverColor, 
              position: 'relative', 
              display: 'flex', 
              flexDirection: 'column', 
              padding: '1.5rem', 
              borderLeft: '12px solid rgba(0,0,0,0.1)',
              color: 'white'
            }}>
              {/* 썸네일 이미지가 있을 때 글씨가 잘 보이도록 어두운 오버레이 추가 */}
              {book.thumbnailUrl && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)' }} />}

              <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '600', backdropFilter: 'blur(4px)' }}>
                  {book.year} {book.season}
                </span>
              </div>
              <h3 style={{ position: 'relative', zIndex: 1, fontSize: '1.2rem', lineHeight: '1.4', margin: 0, textShadow: '0px 2px 4px rgba(0,0,0,0.8)' }}>
                {book.title}
              </h3>
              
              {/* Binder details effect */}
              <div style={{ position: 'absolute', left: '-12px', top: '10%', bottom: '10%', width: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', zIndex: 2 }} />
            </div>
            
            {/* Book Meta */}
            <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderTop: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} color="var(--primary-color)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>PDF 열람</span>
              </div>
              
              {userRole === 'admin' && (
                <button 
                  onClick={(e) => handleDelete(e, book)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="이 자료 삭제하기"
                  onMouseOver={(e) => e.currentTarget.style.color = '#f87171'}
                  onMouseOut={(e) => e.currentTarget.style.color = '#ef4444'}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploadSuccess={fetchBooks} />}
    </div>
  );
};

export default Library;
