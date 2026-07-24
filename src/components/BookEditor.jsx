import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Header from './Header';
import { Save, ArrowLeft, CheckCircle, FileText, LayoutList, Table2, Type, Printer } from 'lucide-react';
import { EditorProvider, DefaultEditor as Editor } from 'react-simple-wysiwyg';
import DynamicTableEditor from './DynamicTableEditor';

const SECTIONS = [
  "1. 개회예배", "2. 성찬예식", "3. 사무처리", "4. 회원명단", "5. 임원 및 시찰, 총대",
  "6. 상비부 조직현황", "7. 회의록", "8. 서기 사무보고", "9. 회계감사보고", "10. 각부 보고",
  "11. 각 시찰 보고", "12. 노회 주소록 및 별명부", "13. 규칙 및 서식", "14. 역대 임원 명단"
]; // 14개 섹션을 직관적으로 정리

// 에디터가 필요한 텍스트 중심 탭 인덱스 (11번 추가)
const TEXT_HEAVY_TABS = [0, 1, 2, 6, 9, 11, 12];
// 동적 표 입력 폼이 필요한 탭 인덱스 (11번 제거)
const TABLE_HEAVY_TABS = [3, 4, 5, 7, 8, 10, 13];

const BookEditor = ({ userRole }) => {
  const navigate = useNavigate();
  const [year, setYear] = useState(new Date().getFullYear());
  const [season, setSeason] = useState('봄');
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // 1. 임시 데이터 로드
  const loadData = async () => {
    const docId = `${year}-${season === '봄' ? '04' : '10'}`;
    try {
      const docRef = doc(db, 'books_content', docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const rawData = docSnap.data().sections || {};
        const processed = {};
        Object.keys(rawData).forEach(key => {
          const val = rawData[key];
          if (val && typeof val === 'object' && val.rows) {
            processed[key] = { ...val, rows: val.rows.map(r => r.cells ? r.cells : r) };
          } else {
            processed[key] = val;
          }
        });
        setFormData(processed);
      } else {
        setFormData({});
      }
    } catch (error) {
      console.error("Error loading data", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [year, season]);

  // 2. 임시 저장
  const handleSave = async () => {
    setIsSaving(true);
    const docId = `${year}-${season === '봄' ? '04' : '10'}`;
    // Firestore 중첩 배열(Nested Array) 지원 불가 에러 방지를 위한 변환 작업
    const dataToSave = {};
    Object.keys(formData).forEach(key => {
      const val = formData[key];
      if (val && typeof val === 'object' && val.rows) {
        dataToSave[key] = { 
          ...val, 
          rows: val.rows.map(r => ({ cells: r })),
          colWidths: val.colWidths ? val.colWidths.map(w => w === undefined ? 'auto' : w) : undefined
        };
        // undefined 속성이 객체에 있으면 에러나므로 제거
        if (dataToSave[key].colWidths === undefined) {
          delete dataToSave[key].colWidths;
        }
      } else {
        dataToSave[key] = val;
      }
    });

    try {
      await setDoc(doc(db, 'books_content', docId), {
        year: Number(year),
        season,
        updatedAt: new Date(),
        sections: dataToSave
      }, { merge: true });
      
      setSaveMessage('성공적으로 저장되었습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error("Error saving data", error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 3. 직전 회기 데이터 복사해오기 (Save As 기능)
  const loadPreviousData = async () => {
    if(!window.confirm(`직전 회기 촬요 데이터를 불러오시겠습니까?\n현재 화면에 작성 중이던 내용은 덮어씌워집니다.`)) return;
    
    let prevYear = Number(year);
    let prevSeason = season === '봄' ? '가을' : '봄';
    if (season === '봄') {
      prevYear -= 1;
    }
    const prevDocId = `${prevYear}-${prevSeason === '봄' ? '04' : '10'}`;
    
    try {
      const docRef = doc(db, 'books_content', prevDocId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const rawData = docSnap.data().sections || {};
        const processed = {};
        Object.keys(rawData).forEach(key => {
          const val = rawData[key];
          if (val && typeof val === 'object' && val.rows) {
            processed[key] = { ...val, rows: val.rows.map(r => r.cells ? r.cells : r) };
          } else {
            processed[key] = val;
          }
        });
        setFormData(processed);
        alert(`${prevYear}년 ${prevSeason}노회 데이터를 성공적으로 불러왔습니다! 이제 수정 후 임시 저장을 누르시면 현재 회기로 복사됩니다.`);
      } else {
        alert(`불러올 직전 회기(${prevYear}년 ${prevSeason}) 데이터가 존재하지 않습니다.`);
      }
    } catch (error) {
      console.error("Error loading previous data", error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleTextChange = (text) => {
    setFormData(prev => ({
      ...prev,
      [activeTab]: text
    }));
  };

  const handleSyncAddressBook = async () => {
    if (!window.confirm("구글 시트의 모든 탭(시트) 데이터를 불러와 12번 항목을 자동으로 작성하시겠습니까?\n(기존에 작성된 12번 내용은 덮어씌워집니다)")) return;
    
    setIsSaving(true);
    try {
      const GAS_URL = "https://script.google.com/macros/s/AKfycbzpcpTaZ0WjX724XfQ6Sx7YkjRkRXKo-O-2CK3hpSQAZP--kspr8reaozhHnO2oEdTm/exec";
      const response = await fetch(`${GAS_URL}?action=getAll`);
      const result = await response.json();
      
      if (result.status === 'success') {
        const tabsData = result.data;
        let htmlContent = `<div style="font-family: 'Malgun Gothic', sans-serif;">`;
        
        Object.keys(tabsData).forEach(tabName => {
          const contacts = tabsData[tabName];
          if (!contacts || contacts.length === 0) return;
          
          htmlContent += `<h3 style="color: #1f2937; border-bottom: 2px solid #1f2937; padding-bottom: 5px; margin-top: 30px;">[${tabName}]</h3>`;
          
          // 별명부인 경우 단순 텍스트 나열
          if (tabName.includes('별명부')) {
            const rollCall = contacts.map(c => c['이름']).filter(Boolean);
            htmlContent += `<p style="line-height: 1.8; word-break: break-all; margin-bottom: 20px;">${rollCall.join(', ')}</p>`;
            return;
          }
          
          // 그 외의 경우 표 생성
          // '시찰'과 '교회명' 필드가 둘 다 존재하면 시찰별 그룹핑 표, 아니면 단순 명단 표
          const hasSichalAndChurch = contacts[0] && ('시찰' in contacts[0]) && ('교회명' in contacts[0]);
          
          if (hasSichalAndChurch) {
            const sichalGroups = {};
            contacts.forEach(c => {
              const sichal = c['시찰'] || '기타/미분류';
              const church = c['교회명'] || '미분류';
              if (!sichalGroups[sichal]) sichalGroups[sichal] = {};
              if (!sichalGroups[sichal][church]) sichalGroups[sichal][church] = [];
              sichalGroups[sichal][church].push(c);
            });
            
            Object.keys(sichalGroups).forEach(sichal => {
              htmlContent += `<h4 style="margin: 15px 0 5px 0; color: #374151;">- ${sichal}</h4>`;
              htmlContent += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">`;
              htmlContent += `<thead><tr>
                <th style="border: 1px solid #cbd5e1; background: #f1f5f9; padding: 8px; width: 20%;">교회명</th>
                <th style="border: 1px solid #cbd5e1; background: #f1f5f9; padding: 8px; width: 40%;">이름</th>
                <th style="border: 1px solid #cbd5e1; background: #f1f5f9; padding: 8px; width: 40%;">주소 및 연락처</th>
              </tr></thead><tbody>`;

              Object.keys(sichalGroups[sichal]).forEach(church => {
                const members = sichalGroups[sichal][church];
                const first = members[0] || {};
                const address = first['주소'] || '';
                const allNames = members.map(m => m['이름']).filter(Boolean).join(', ');
                const phones = members.map(m => m['전화번호'] || m['핸드폰번호']).filter(Boolean).join(', ');
                
                htmlContent += `<tr>
                  <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;"><strong>${church}</strong></td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${allNames}</td>
                  <td style="border: 1px solid #cbd5e1; padding: 8px;">${address}<br/>${phones}</td>
                </tr>`;
              });
              htmlContent += `</tbody></table>`;
            });
            
          } else {
            // 단순 명단 표
            htmlContent += `<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">`;
            htmlContent += `<thead><tr>
              <th style="border: 1px solid #cbd5e1; background: #f1f5f9; padding: 8px; width: 30%;">이름</th>
              <th style="border: 1px solid #cbd5e1; background: #f1f5f9; padding: 8px; width: 70%;">연락처 및 기타</th>
            </tr></thead><tbody>`;
            
            contacts.forEach(c => {
              const name = c['이름'] || '';
              const phone = [c['핸드폰번호'], c['전화번호']].filter(Boolean).join(' / ');
              const address = c['주소'] || '';
              const info = [phone, address].filter(Boolean).join('<br/>');
              
              htmlContent += `<tr>
                <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;"><strong>${name}</strong></td>
                <td style="border: 1px solid #cbd5e1; padding: 8px;">${info}</td>
              </tr>`;
            });
            htmlContent += `</tbody></table>`;
          }
        });
        
        htmlContent += `</div>`;
        
        handleTextChange(htmlContent);
        alert("성공적으로 모든 탭 데이터를 불러와 에디터에 삽입했습니다.");
      } else {
        alert("구글 시트 연동 에러: " + (result.message || ""));
      }
    } catch (error) {
      console.error(error);
      alert("데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header userRole={userRole} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={28} color="#10b981" /> 촬요 내용 편집기 (CMS)
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>차기 촬요 책자에 들어갈 텍스트와 표를 웹에서 편하게 작성하세요.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-primary action-btn-solid" onClick={() => navigate(`/print/${year}/${season}`)}>
            <Printer size={16} /> PDF/인쇄 렌더링
          </button>
          <button className="btn-primary action-btn-outline" onClick={() => navigate('/admin')}>
            <ArrowLeft size={16} /> 관리자 설정으로
          </button>
        </div>
      </div>

      <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', gap: '20px', flex: 1 }}>
        {/* 사이드바 (14개 항목 탭) */}
        <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '1rem', borderRight: '1px solid var(--glass-border)', paddingRight: '1rem' }}>
          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>발간 회기 선택</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="number" 
                value={year} 
                onChange={(e) => setYear(e.target.value)}
                style={{ width: '80px', padding: '6px', borderRadius: '4px', background: 'white', border: '1px solid #cbd5e1', color: 'var(--text-primary)' }} 
              />
              <select 
                value={season} 
                onChange={(e) => setSeason(e.target.value)}
                style={{ flex: 1, padding: '6px', borderRadius: '4px', background: 'white', border: '1px solid #cbd5e1', color: 'var(--text-primary)' }}
              >
                <option value="봄">봄 (4월)</option>
                <option value="가을">가을 (10월)</option>
              </select>
            </div>
            
            {/* 직전 회기 불러오기 버튼 추가 */}
            <button 
              onClick={loadPreviousData}
              style={{ marginTop: '10px', width: '100%', padding: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: 'var(--text-primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              이전 회기 불러오기 (복사)
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {SECTIONS.map((section, idx) => {
              const isText = TEXT_HEAVY_TABS.includes(idx);
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: activeTab === idx ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                    color: activeTab === idx ? 'var(--primary-color)' : 'var(--text-secondary)',
                    border: activeTab === idx ? '1px solid rgba(14, 165, 233, 0.3)' : '1px solid transparent',
                    fontWeight: activeTab === idx ? '600' : '400',
                    transition: 'all 0.2s',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isText ? <Type size={14} /> : <Table2 size={14} />} {section}
                </button>
              );
            })}
          </div>
        </div>

        {/* 메인 편집 영역 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>{SECTIONS[activeTab]} 작성</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {activeTab === 11 && (
                <button 
                  onClick={handleSyncAddressBook} 
                  disabled={isSaving}
                  className="btn-primary" 
                  style={{ background: '#3b82f6', border: 'none', marginRight: '10px' }}
                >
                  <FileText size={16} /> 구글 시트 주소록 동기화
                </button>
              )}
              {saveMessage && <span style={{ color: '#34d399', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> {saveMessage}</span>}
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="btn-primary" 
                style={{ background: '#10b981', border: 'none' }}
              >
                <Save size={16} /> {isSaving ? '저장 중...' : '임시 저장'}
              </button>
            </div>
          </div>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
            {TEXT_HEAVY_TABS.includes(activeTab) ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'black' }}>
                <EditorProvider>
                  <Editor 
                    value={typeof formData[activeTab] === 'string' ? formData[activeTab] : ''} 
                    onChange={(e) => handleTextChange(e.target.value)} 
                    containerProps={{ style: { height: '100%', resize: 'none' } }}
                  />
                </EditorProvider>
              </div>
            ) : (
              <DynamicTableEditor 
                data={formData[activeTab] || { columns: [], rows: [] }} 
                onChange={(data) => handleTextChange(data)} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookEditor;
