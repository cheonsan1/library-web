import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Header from './Header';

function MyPage({ userRole }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  
  // 신규 가입 관련 상태
  const [isNewUser, setIsNewUser] = useState(false);
  const [selectedTab, setSelectedTab] = useState('시무목사');

  // 시트의 각 열에 대응하는 상태
  const [sichal, setSichal] = useState('');
  const [church, setChurch] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tel, setTel] = useState('');
  const [address, setAddress] = useState('');
  const [zipcode, setZipcode] = useState('');

  // 주의: 본인이 마지막으로 성공했던 진짜 GAS_URL 주소를 아래에 넣으셔야 합니다!
  const GAS_URL = "https://script.google.com/macros/s/AKfycbzpcpTaZ0WjX724XfQ6Sx7YkjRkRXKo-O-2CK3hpSQAZP--kspr8reaozhHnO2oEdTm/exec";

  const auth = getAuth();

  const TABS = [
    "시무목사",
    "장로총대",
    "부목사",
    "원로 및 은퇴목사",
    "기관목사",
    "장로 증경부노회장",
    "무임목사",
    "별명부",
    "선교사",
    "총회기관"
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserEmail(user.email);
        fetchUserInfo(user.email);
      } else {
        setLoading(false);
        setErrorMsg("로그인이 필요합니다. 먼저 로그인해주세요.");
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserInfo = async (email) => {
    try {
      const response = await fetch(`${GAS_URL}?email=${email}`);
      const result = await response.json();

      if (result.status === 'success') {
        setUserInfo(result.data);
        setIsNewUser(false);

        // 불러온 데이터를 각 input 창에 뿌려주기
        setSichal(result.data['시찰'] || '');
        setChurch(result.data['교회명'] || '');
        setName(result.data['이름'] || '');
        setPhone(result.data['핸드폰번호'] || '');
        setTel(result.data['전화번호'] || '');
        setAddress(result.data['주소'] || '');
        setZipcode(result.data['우편번호'] || '');
      } else {
        // 이메일이 구글 시트에 없을 경우 신규 가입 모드로 전환
        setIsNewUser(true);
        setErrorMsg('');
      }
    } catch (error) {
      console.error("데이터 불러오기 에러:", error);
      setErrorMsg("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (isNewUser && !name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        email: currentUserEmail,
        sichal: sichal,
        church: church,
        name: name,
        phone: phone,
        tel: tel,
        address: address,
        zipcode: zipcode,
      };

      if (isNewUser) {
        payload.isNew = true;
        payload.sheetName = selectedTab;
      }

      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.status === 'success') {
        alert(isNewUser ? "신규 가입이 완료되었습니다!" : "정보가 성공적으로 저장되었습니다!");
        if (isNewUser) {
          // 가입 성공 후 기존 사용자로 모드 전환
          setIsNewUser(false);
          setUserInfo(payload); 
        }
      } else {
        alert("저장 실패: " + result.message);
      }
    } catch (error) {
      console.error("저장 중 에러 발생:", error);
      alert("통신 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div style={{ color: '#4CAF50', padding: '20px' }}>데이터를 불러오는 중입니다...</div>;
  if (errorMsg) return <div style={{ color: '#f44336', padding: '20px' }}>{errorMsg}</div>;
  if (!userInfo && !isNewUser) return null;

  // 공통 인풋 스타일
  const inputStyle = {
    padding: '10px',
    width: '100%',
    maxWidth: '400px',
    marginTop: '5px',
    borderRadius: '4px',
    border: '1px solid #555',
    backgroundColor: '#222',
    color: '#fff',
    boxSizing: 'border-box'
  };

  return (
    <div className="page-container" style={{ padding: '20px', fontFamily: 'sans-serif', color: '#eee' }}>
      <Header userRole={userRole} />
      
      {isNewUser ? (
        <>
          <h2 style={{ color: '#60a5fa' }}>신규 회원 등록</h2>
          <p style={{ fontSize: '0.9em', color: '#aaa' }}>
            등록된 정보가 없습니다. 본인의 소속을 선택하고 정보를 입력한 뒤 가입해주세요.<br/>
            (입력하신 정보는 선택하신 소속 탭으로 자동 저장됩니다.)
          </p>
        </>
      ) : (
        <>
          <h2>내 정보 관리</h2>
          <p style={{ fontSize: '0.9em', color: '#aaa' }}>수정하고자 하는 항목을 변경한 후 저장 버튼을 눌러주세요.</p>
        </>
      )}

      <div style={{ padding: '20px', borderRadius: '8px', backgroundColor: '#1e1e1e', marginTop: '20px' }}>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ color: '#aaa' }}><strong>접속 이메일 (수정 불가):</strong></label><br />
          <div style={{ marginTop: '5px', padding: '10px', backgroundColor: '#111', borderRadius: '4px', maxWidth: '400px' }}>
            {currentUserEmail}
          </div>
        </div>

        {isNewUser && (
          <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', borderRadius: '8px', maxWidth: '400px' }}>
            <label style={{ color: '#60a5fa' }}><strong>* 소속 분류 (어느 시트에 저장할지 선택):</strong></label><br />
            <select 
              value={selectedTab} 
              onChange={(e) => setSelectedTab(e.target.value)} 
              style={{ ...inputStyle, border: '1px solid #3b82f6' }}
            >
              {TABS.map(tab => (
                <option key={tab} value={tab}>{tab}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ marginBottom: '15px' }}>
          <label><strong>이름 (직함):</strong></label><br />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder="예: 홍길동 목사" />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label><strong>시찰:</strong></label><br />
          <input type="text" value={sichal} onChange={(e) => setSichal(e.target.value)} style={inputStyle} placeholder="예: 남부시찰" />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label><strong>교회명:</strong></label><br />
          <input type="text" value={church} onChange={(e) => setChurch(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label><strong>핸드폰 번호:</strong></label><br />
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label><strong>전화번호 (자택/사무실):</strong></label><br />
          <input type="text" value={tel} onChange={(e) => setTel(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label><strong>우편번호:</strong></label><br />
          <input type="text" value={zipcode} onChange={(e) => setZipcode(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label><strong>주소:</strong></label><br />
          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          style={{
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: isSaving ? '#555' : (isNewUser ? '#3b82f6' : '#4CAF50'),
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isSaving ? '처리 중...' : (isNewUser ? '신규 가입 완료하기' : '전체 정보 저장하기')}
        </button>
      </div>
    </div>
  );
}

export default MyPage;