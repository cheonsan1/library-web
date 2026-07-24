import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Printer, ArrowLeft } from 'lucide-react';
import '../print.css';

const SECTIONS = [
  "1. 개회예배", "2. 성찬예식", "3. 사무처리", "4. 회원명단", "5. 임원 및 시찰, 총대",
  "6. 상비부 조직현황", "7. 회의록", "8. 서기 사무보고", "9. 회계감사보고", "10. 각부 보고",
  "11. 각 시찰 보고", "12. 부목사 및 증경/원로 명단", "13. 규칙 및 서식", "14. 역대 임원 명단"
];

// 에디터(텍스트) 탭과 표(테이블) 탭 구분
const TEXT_HEAVY_TABS = [0, 1, 2, 3, 6, 9, 11, 12];
const TABLE_HEAVY_TABS = [4, 5, 7, 8, 10, 13];

const PrintView = () => {
  const { year, season } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const docId = `${year}-${season === '봄' ? '04' : '10'}`;
      try {
        const docRef = doc(db, 'books_content', docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data().sections || {});
        } else {
          setData({});
        }
      } catch (error) {
        console.error("Error loading data for print", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [year, season]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>;
  }

  // 데이터가 없을 경우
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="no-print" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>작성된 촬요 데이터가 없습니다.</h2>
        <button onClick={() => navigate('/admin/editor')} style={{ marginTop: '1rem', padding: '10px 20px', cursor: 'pointer' }}>
          편집기로 돌아가기
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-container">
      {/* 화면에서만 보이고 인쇄 시에는 숨겨질 컨트롤 패널 */}
      <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100%', background: '#1e293b', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1000, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <h2 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Printer size={24} /> {year}년 {season}노회 촬요 인쇄 미리보기
        </h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/admin/editor')} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid white', color: 'white', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> 편집기로 돌아가기
          </button>
          <button onClick={handlePrint} style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
            <Printer size={16} /> 인쇄하기 (A5)
          </button>
        </div>
      </div>

      {/* 인쇄될 본문 영역 */}
      <div className="print-content" style={{ marginTop: '80px' }}>
        {/* 표지 페이지 (예시) */}
        <div className="page-break" style={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>대한예수교 장로회 동인천노회</h3>
          <h1 style={{ fontSize: '3rem', marginBottom: '2rem' }}>제 {year}년 {season}노회<br/>정기노회 촬요</h1>
          <p style={{ fontSize: '1.2rem' }}>※ 본 문서는 웹 편집기에서 자동 생성되었습니다.</p>
        </div>

        {/* 14개 목차 순회 렌더링 */}
        {SECTIONS.map((sectionName, idx) => {
          const sectionData = data[idx];
          // 데이터가 없으면 인쇄에서 제외
          if (!sectionData || (typeof sectionData === 'object' && sectionData.columns?.length === 0)) return null;

          const isTextHeavy = TEXT_HEAVY_TABS.includes(idx);

          return (
            <div key={idx} className="page-break" style={{ padding: '20px 0' }}>
              <h2 style={{ borderBottom: '2px solid black', paddingBottom: '10px', marginBottom: '20px', fontSize: '1.5rem', color: 'black' }}>
                {sectionName}
              </h2>
              
              {isTextHeavy ? (
                // 텍스트 기반 섹션 렌더링
                <div 
                  className="rich-text-content" 
                  style={{ color: 'black', lineHeight: '1.8' }}
                  dangerouslySetInnerHTML={{ __html: sectionData }} 
                />
              ) : (
                // 표 기반 섹션 렌더링
                <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', color: 'black', fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      {Array.isArray(sectionData.columns) && sectionData.columns.map((col, cIdx) => (
                        <th key={cIdx} style={{ border: '1px solid black', padding: '8px', background: '#f1f1f1', textAlign: 'center', width: sectionData.colWidths?.[cIdx] || 'auto' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(sectionData.rows) && sectionData.rows.map((row, rIdx) => {
                      const cells = row.cells ? row.cells : row;
                      if (!Array.isArray(cells)) return null;
                      return (
                        <tr key={rIdx}>
                          {cells.map((cell, cIdx) => (
                            <td key={cIdx} style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrintView;
