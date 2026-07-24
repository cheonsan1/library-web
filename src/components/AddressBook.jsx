import React, { useState, useEffect } from 'react';
import Header from './Header';
import { Phone, MessageSquare, Users, CheckSquare, Square, Search } from 'lucide-react';

const GAS_URL = "https://script.google.com/macros/s/AKfycbzpcpTaZ0WjX724XfQ6Sx7YkjRkRXKo-O-2CK3hpSQAZP--kspr8reaozhHnO2oEdTm/exec";

const AddressBook = ({ userRole }) => {
  const [contactsData, setContactsData] = useState({}); // 탭 이름이 키가 되는 객체
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhones, setSelectedPhones] = useState(new Set());
  const [activeTabName, setActiveTabName] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${GAS_URL}?action=getAll`);
      const result = await response.json();
      if (result.status === 'success') {
        setContactsData(result.data);
        const tabs = Object.keys(result.data);
        if (tabs.length > 0) setActiveTabName(tabs[0]);
      } else {
        setErrorMsg(result.message || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error("Error fetching address book:", error);
      setErrorMsg("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const sanitizePhone = (phone) => {
    if (!phone) return '';
    return phone.toString().replace(/[^0-9]/g, '');
  };

  const toggleSelection = (phone) => {
    const cleanPhone = sanitizePhone(phone);
    if (!cleanPhone) return;
    
    const newSelected = new Set(selectedPhones);
    if (newSelected.has(cleanPhone)) {
      newSelected.delete(cleanPhone);
    } else {
      newSelected.add(cleanPhone);
    }
    setSelectedPhones(newSelected);
  };

  const sendBulkSMS = () => {
    if (selectedPhones.size === 0) {
      alert("단체 문자를 보낼 대상을 먼저 선택해주세요.");
      return;
    }
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const separator = isIOS ? ',' : ',';
    const finalNumbers = Array.from(selectedPhones).join(separator);
    
    window.location.href = `sms:${finalNumbers}`;
  };

  const currentTabContacts = contactsData[activeTabName] || [];

  // 검색 필터링
  const filteredContacts = currentTabContacts.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      (c['이름'] && c['이름'].toString().toLowerCase().includes(term)) ||
      (c['교회명'] && c['교회명'].toString().toLowerCase().includes(term)) ||
      (c['시찰'] && c['시찰'].toString().toLowerCase().includes(term))
    );
  });

  // 그룹핑: '교회명' 필드가 있는 데이터면 시찰->교회로 그룹화, 아니면 단순 리스트로 표시
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    // 탭 이름이 별명부이거나 특수목적이면 시찰/교회 구분이 없을 수 있음
    const sichal = contact['시찰'] || '기타/미분류';
    const church = contact['교회명'] || '소속없음';
    
    if (!acc[sichal]) acc[sichal] = {};
    if (!acc[sichal][church]) acc[sichal][church] = [];
    
    acc[sichal][church].push(contact);
    return acc;
  }, {});

  const renderContactCard = (person, idx) => {
    const cleanPhone = sanitizePhone(person['핸드폰번호']);
    const isSelected = selectedPhones.has(cleanPhone);
    
    return (
      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div onClick={() => cleanPhone && toggleSelection(person['핸드폰번호'])} style={{ cursor: cleanPhone ? 'pointer' : 'default', color: isSelected ? '#3b82f6' : 'var(--text-secondary)' }}>
            {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'white' }}>{person['이름']}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {person['핸드폰번호'] && <span>📱 {person['핸드폰번호']}</span>}
              {person['핸드폰번호'] && person['전화번호'] && <span style={{ margin: '0 6px', color: 'var(--glass-border)' }}>|</span>}
              {person['전화번호'] && <span>☎️ {person['전화번호']}</span>}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {person['핸드폰번호'] && (
            <>
              <a href={`tel:${cleanPhone}`} style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="전화걸기">
                <Phone size={16} />
              </a>
              <a href={`sms:${cleanPhone}`} style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="문자보내기">
                <MessageSquare size={16} />
              </a>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ padding: '0 0 2rem 0' }}>
      <Header userRole={userRole} />
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '2rem', margin: '0 0 0.5rem 0' }}>
              <Users size={32} color="#3b82f6" /> 노회 주소록
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>구글 시트에 등록된 실시간 다중 탭 회원 명단입니다.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '400px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                placeholder="현재 탭에서 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'white', boxSizing: 'border-box' }}
              />
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-secondary)' }} />
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        {!loading && Object.keys(contactsData).length > 0 && (
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', whiteSpace: 'nowrap' }}>
            {Object.keys(contactsData).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTabName(tab); setSearchTerm(''); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  background: activeTabName === tab ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  color: activeTabName === tab ? 'white' : 'var(--text-secondary)',
                  transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {/* 단체 문자 플로팅 바 */}
        <div style={{ 
          position: 'sticky', 
          top: '80px', 
          zIndex: 50, 
          background: 'var(--glass-bg)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <div>
            <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>{selectedPhones.size}</span> 명 선택됨
          </div>
          <button 
            onClick={sendBulkSMS}
            style={{ padding: '10px 20px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
          >
            <MessageSquare size={18} /> 단체 문자 보내기
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>주소록을 불러오는 중입니다...</div>
        ) : errorMsg ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>{errorMsg}</div>
        ) : (
          Object.keys(groupedContacts).map(sichal => (
            <div key={sichal} style={{ marginBottom: '3rem' }}>
              {sichal !== '기타/미분류' && (
                <h2 style={{ color: 'var(--primary-color)', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
                  {sichal}
                </h2>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {Object.keys(groupedContacts[sichal]).map(church => (
                  <div key={church} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px' }}>
                    {church !== '소속없음' && (
                      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }}></span>
                        {church}
                      </h3>
                    )}
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {groupedContacts[sichal][church].map((person, idx) => renderContactCard(person, idx))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AddressBook;
