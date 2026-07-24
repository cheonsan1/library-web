import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import HTMLFlipBook from 'react-pageflip';
import { pdfjs, Document, Page as ReactPdfPage } from 'react-pdf';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ArrowLeft, Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js worker 설정 (react-pdf 최신 버전에 맞게 mjs 사용)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'white', background: '#7f1d1d', minHeight: '100vh' }}>
          <h2>컴포넌트 렌더링 중 치명적 오류가 발생했습니다.</h2>
          <pre style={{ background: 'rgba(0,0,0,0.5)', padding: '1rem', overflow: 'auto' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const Page = React.forwardRef(({ pageNumber }, ref) => {
  return (
    <div ref={ref} className="page" style={{ background: '#fff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.1)' }}>
      <ReactPdfPage pageNumber={pageNumber} width={400} renderTextLayer={false} renderAnnotationLayer={false} />
    </div>
  );
});

const BookViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [numPages, setNumPages] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingBook, setLoadingBook] = useState(true);
  const [pdfLoadError, setPdfLoadError] = useState(null);

  const toggleFullScreen = () => {
    const doc = document.documentElement;
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
      if (doc.requestFullscreen) {
        doc.requestFullscreen().catch(err => console.error(err));
      } else if (doc.webkitRequestFullscreen) {
        doc.webkitRequestFullscreen();
      } else if (doc.mozRequestFullScreen) {
        doc.mozRequestFullScreen();
      } else if (doc.msRequestFullscreen) {
        doc.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  useEffect(() => {
    const fetchBookInfo = async () => {
      try {
        const bookRef = doc(db, 'books', id);
        const bookSnap = await getDoc(bookRef);
        if (bookSnap.exists()) {
          setPdfUrl(bookSnap.data().pdfUrl);
        } else {
          console.error("No such book!");
        }
      } catch (error) {
        console.error("Error fetching book:", error);
      } finally {
        setLoadingBook(false);
      }
    };
    fetchBookInfo();
  }, [id]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  function onDocumentLoadError(error) {
    console.error("PDF Load Error Details:", error);
    setPdfLoadError(error.message || "알 수 없는 오류");
  }

  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', background: 'radial-gradient(circle at center, #334155, #0f172a)', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.6)', color: 'white', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
        <button 
          onClick={() => navigate('/')}
          className="btn-primary"
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px' }}
        >
          <ArrowLeft size={18} /> 도서관으로 돌아가기
        </button>
        <div style={{ fontWeight: '600', fontSize: '1.2rem', letterSpacing: '2px' }}>회의집 열람 ({id})</div>
        <button 
          onClick={toggleFullScreen} 
          className="btn-primary" 
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', cursor: 'pointer' }}
        >
          <Maximize2 size={18} /> 전체화면
        </button>
      </header>
      
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', padding: '2rem' }}>
        {loadingBook ? (
          <div style={{ color: 'white', fontSize: '1.2rem' }}>책 정보를 불러오는 중입니다...</div>
        ) : !pdfUrl ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <h3>PDF 파일을 찾을 수 없습니다.</h3>
            <p style={{ marginTop: '1rem', lineHeight: '1.5' }}>
              이 회의집(<b>{id}</b>)에 해당하는 PDF 파일이 삭제되었거나 존재하지 않습니다.
            </p>
          </div>
        ) : pdfLoadError ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ color: '#ef4444' }}>PDF 파일 로드 에러</h3>
            <p style={{ marginTop: '1rem', lineHeight: '1.5' }}>
              파이어베이스에서 PDF를 가져오지 못했습니다.<br/>
              <b>상세 에러:</b> {pdfLoadError}
            </p>
          </div>
        ) : (
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={4}
            centerOnInit={true}
            wheel={{ step: 0.1 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <React.Fragment>
                <div style={{ position: 'absolute', bottom: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '12px', zIndex: 10 }}>
                  <button onClick={() => zoomIn()} className="btn-primary" style={{ padding: '12px', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)' }} title="확대">
                    <ZoomIn size={24} />
                  </button>
                  <button onClick={() => zoomOut()} className="btn-primary" style={{ padding: '12px', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)' }} title="축소">
                    <ZoomOut size={24} />
                  </button>
                  <button onClick={() => resetTransform()} className="btn-primary" style={{ padding: '12px', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255,255,255,0.2)' }} title="원래 크기">
                    <RotateCcw size={24} />
                  </button>
                </div>
                <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={<div style={{ color: 'white', fontSize: '1.2rem' }}>PDF를 불러오는 중입니다... ({pdfUrl.substring(0, 30)}...)</div>}
                    error={
                      <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem', background: 'var(--glass-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
                        <h3>PDF 파일을 찾을 수 없습니다.</h3>
                        <p style={{ marginTop: '1rem', lineHeight: '1.5' }}>
                          아직 <b>{id}</b>에 해당하는 PDF 파일이 업로드되지 않았거나,<br/>
                          테스트를 위한 <code>public/sample.pdf</code> 파일이 없습니다.
                        </p>
                      </div>
                    }
                  >
                    {numPages && (
                      <div style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <HTMLFlipBook 
                          width={400} 
                          height={565} 
                          size="stretch"
                          minWidth={315}
                          maxWidth={1000}
                          minHeight={400}
                          maxHeight={1533}
                          maxShadowOpacity={0.5}
                          showCover={true}
                          mobileScrollSupport={true}
                          className="flipbook"
                        >
                          {Array.from(new Array(numPages), (el, index) => (
                            <Page key={`page_${index + 1}`} pageNumber={index + 1} />
                          ))}
                        </HTMLFlipBook>
                      </div>
                    )}
                  </Document>
                </TransformComponent>
              </React.Fragment>
            )}
          </TransformWrapper>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
};

export default BookViewer;
