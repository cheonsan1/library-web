import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { X, Upload, FileText } from 'lucide-react';
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const UploadModal = ({ onClose, onUploadSuccess }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [season, setSeason] = useState('가을');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return alert('PDF 파일을 선택해주세요.');
    if (!year) return alert('연도를 입력해주세요.');

    const bookId = `${year}-${season === '봄' ? '04' : '10'}`;
    const storageRef = ref(storage, `books/${bookId}.pdf`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    setUploading(true);
    setStatusText('Storage에 파일 업로드 중...');
    setErrorText('');

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progressValue = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progressValue);
      },
      (error) => {
        console.error("Upload failed:", error);
        setErrorText(`Storage 업로드 에러: ${error.message}`);
        setStatusText('업로드 실패');
        setUploading(false);
      },
      async () => {
        try {
          setStatusText('업로드 완료! 다운로드 URL을 가져오는 중...');
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          setStatusText('PDF 표지 썸네일 추출 중...');
          let thumbnailUrl = null;
          try {
            const fileUrl = URL.createObjectURL(file);
            const loadingTask = pdfjs.getDocument(fileUrl);
            const pdfDoc = await loadingTask.promise;
            const page = await pdfDoc.getPage(1);
            const viewport = page.getViewport({ scale: 1.5 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
            URL.revokeObjectURL(fileUrl);
            
            if (blob) {
              setStatusText('썸네일 이미지 Storage에 업로드 중...');
              const thumbRef = ref(storage, `books/${bookId}_thumb.jpg`);
              // uploadBytesResumable 대신 일반 uploadBytes 사용 후 URL 바로 획득 (프로그레스 생략)
              const uploadResult = await uploadBytesResumable(thumbRef, blob);
              thumbnailUrl = await getDownloadURL(uploadResult.ref);
            }
          } catch (thumbError) {
            console.error("Thumbnail extraction failed:", thumbError);
            // 썸네일 실패해도 본 파일은 올라갔으므로 계속 진행
          }
          
          setStatusText('데이터베이스(Firestore)에 정보 저장 중...');
          // Firestore에 정보 저장
          await setDoc(doc(db, 'books', bookId), {
            id: bookId,
            year: Number(year),
            season,
            title: `${year}년 ${season === '봄' ? '4월 봄' : '10월 가을'} 정기노회 촬요`,
            pdfUrl: downloadURL,
            thumbnailUrl: thumbnailUrl, // 추출된 썸네일 URL (실패 시 null)
            coverColor: season === '봄' ? '#0f766e' : '#1e3a8a',
            createdAt: new Date()
          });

          setStatusText('모든 작업 완료!');
          alert('업로드 성공!');
          setUploading(false);
          if(onUploadSuccess) onUploadSuccess();
          onClose();
        } catch (error) {
          console.error("DB Save failed:", error);
          setErrorText(`데이터베이스 저장 에러: ${error.message}`);
          setStatusText('저장 실패');
          setUploading(false);
        }
      }
    );
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="glass-panel" style={{ background: '#1e293b', width: '100%', maxWidth: '450px', padding: '2rem', position: 'relative' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={24} />
        </button>
        
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Upload size={24} color="var(--primary-color)" /> 새 촬요 업로드
        </h2>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>연도</label>
            <input 
              type="number" 
              value={year} 
              onChange={e => setYear(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>회기</label>
            <select 
              value={season} 
              onChange={e => setSeason(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: '#0f172a', color: 'white' }}
            >
              <option value="봄">봄 (4월)</option>
              <option value="가을">가을 (10월)</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>PDF 파일 선택</label>
          <div style={{ border: '2px dashed var(--glass-border)', padding: '2rem', textAlign: 'center', borderRadius: '8px', cursor: 'pointer', background: 'rgba(0,0,0,0.1)' }}>
            <input 
              type="file" 
              accept=".pdf" 
              onChange={handleFileChange}
              id="pdf-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="pdf-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <FileText size={32} color={file ? '#10b981' : 'var(--text-secondary)'} />
              <span style={{ color: file ? '#10b981' : 'var(--text-secondary)' }}>
                {file ? file.name : 'PDF 파일을 드래그하거나 클릭해서 선택'}
              </span>
            </label>
          </div>
        </div>

        {errorText && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '8px', color: '#fca5a5', fontSize: '0.9rem', wordBreak: 'keep-all' }}>
            {errorText}
          </div>
        )}

        {uploading && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
              <span>{statusText}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary-color)', transition: 'width 0.2s' }}></div>
            </div>
          </div>
        )}

        <button 
          onClick={handleUpload} 
          disabled={uploading}
          className="btn-primary" 
          style={{ width: '100%', opacity: uploading ? 0.7 : 1 }}
        >
          {uploading ? '처리 중...' : '업로드 시작'}
        </button>
      </div>
    </div>
  );
};

export default UploadModal;
