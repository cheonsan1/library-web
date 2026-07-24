import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Settings, Type } from 'lucide-react';

const DynamicTableEditor = ({ data = { columns: [], rows: [] }, onChange }) => {
  const [columns, setColumns] = useState(data.columns || []);
  const [rows, setRows] = useState(data.rows || []);
  const [colWidths, setColWidths] = useState(data.colWidths || []);

  useEffect(() => {
    setColumns(data.columns || []);
    setRows(data.rows || []);
    setColWidths(data.colWidths || []);
  }, [data]);

  const notifyChange = (newCols, newRows, newWidths) => {
    onChange({ columns: newCols, rows: newRows, colWidths: newWidths || colWidths });
  };

  const addColumn = () => {
    const colName = prompt("새로운 열(Column)의 이름을 입력하세요. (예: 직위, 이름, 전화번호)");
    if (!colName) return;
    
    const newCols = [...columns, colName];
    const newWidths = [...colWidths, "auto"];
    // 기존 데이터 행에도 빈 데이터 채우기
    const newRows = rows.map(row => {
      const newRow = [...row];
      newRow[newCols.length - 1] = "";
      return newRow;
    });
    
    setColumns(newCols);
    setRows(newRows);
    setColWidths(newWidths);
    notifyChange(newCols, newRows, newWidths);
  };

  const removeColumn = (colIndex) => {
    if(!window.confirm(`'${columns[colIndex]}' 열을 삭제하시겠습니까? (입력된 데이터도 모두 삭제됩니다)`)) return;
    
    const newCols = columns.filter((_, i) => i !== colIndex);
    const newRows = rows.map(row => row.filter((_, i) => i !== colIndex));
    const newWidths = colWidths.filter((_, i) => i !== colIndex);
    
    setColumns(newCols);
    setRows(newRows);
    setColWidths(newWidths);
    notifyChange(newCols, newRows, newWidths);
  };

  const addRow = () => {
    const newRow = new Array(columns.length).fill("");
    const newRows = [...rows, newRow];
    setRows(newRows);
    notifyChange(columns, newRows, colWidths);
  };

  const removeRow = (rowIndex) => {
    const newRows = rows.filter((_, i) => i !== rowIndex);
    setRows(newRows);
    notifyChange(columns, newRows, colWidths);
  };

  const updateCell = (rowIndex, colIndex, value) => {
    const newRows = [...rows];
    newRows[rowIndex][colIndex] = value;
    setRows(newRows);
    notifyChange(columns, newRows, colWidths);
  };

  const handleKeyDown = (e, rowIndex, colIndex) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (colIndex < columns.length - 1) {
        // 같은 행의 다음 열로 이동
        const nextInput = document.getElementById(`cell-${rowIndex}-${colIndex + 1}`);
        if (nextInput) nextInput.focus();
      } else if (rowIndex < rows.length - 1) {
        // 다음 행의 첫 번째 열로 이동
        const nextInput = document.getElementById(`cell-${rowIndex + 1}-0`);
        if (nextInput) nextInput.focus();
      } else {
        // 마지막 행의 마지막 열인 경우 새로운 행 추가 후 포커스 이동
        addRow();
        setTimeout(() => {
          const nextInput = document.getElementById(`cell-${rowIndex + 1}-0`);
          if (nextInput) nextInput.focus();
        }, 50);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const targetRow = (e.ctrlKey || e.metaKey) ? rows.length - 1 : rowIndex + 1;
      const nextInput = document.getElementById(`cell-${targetRow}-${colIndex}`);
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const targetRow = (e.ctrlKey || e.metaKey) ? 0 : rowIndex - 1;
      const nextInput = document.getElementById(`cell-${targetRow}-${colIndex}`);
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowRight') {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const nextInput = document.getElementById(`cell-${rowIndex}-${columns.length - 1}`);
        if (nextInput) nextInput.focus();
      } else if (e.target.selectionStart === e.target.value.length) {
        e.preventDefault();
        const nextInput = document.getElementById(`cell-${rowIndex}-${colIndex + 1}`);
        if (nextInput) nextInput.focus();
      }
    } else if (e.key === 'ArrowLeft') {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const nextInput = document.getElementById(`cell-${rowIndex}-0`);
        if (nextInput) nextInput.focus();
      } else if (e.target.selectionStart === 0) {
        e.preventDefault();
        const nextInput = document.getElementById(`cell-${rowIndex}-${colIndex - 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const setWidth = (colIndex) => {
    const current = colWidths[colIndex] || "auto";
    const width = prompt(`'${columns[colIndex]}' 열의 너비를 입력하세요 (예: 20%, 50px, auto):`, current);
    if (width !== null) {
      // 희소 배열(Sparse Array) 방지를 위해 기존 값이 없으면 "auto"로 채움
      const newWidths = columns.map((_, i) => colWidths[i] || "auto");
      newWidths[colIndex] = width;
      setColWidths(newWidths);
      notifyChange(columns, rows, newWidths);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white', color: 'black' }}>
      <div style={{ padding: '1rem', display: 'flex', gap: '10px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <button 
          onClick={addColumn}
          style={{ padding: '8px 16px', background: '#3b82f6', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Settings size={16} /> 열(항목) 추가하기
        </button>
        <button 
          onClick={addRow}
          disabled={columns.length === 0}
          style={{ padding: '8px 16px', background: columns.length === 0 ? '#94a3b8' : '#10b981', border: 'none', color: 'white', borderRadius: '4px', cursor: columns.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> 데이터 행(Row) 추가
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
        {columns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <Type size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>상단의 [열(항목) 추가하기] 버튼을 눌러서 표의 제목을 먼저 만들어주세요.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'black' }}>
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} style={{ background: '#f1f5f9', padding: '12px', border: '1px solid #cbd5e1', position: 'relative', width: colWidths[idx] || 'auto' }}>
                    {col}
                    <div style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px' }}>
                      <button 
                        title="너비 조절"
                        onClick={() => setWidth(idx)}
                        style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '2px', fontWeight: 'bold' }}
                      >
                        W
                      </button>
                      <button 
                        title="열 삭제"
                        onClick={() => removeColumn(idx)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </th>
                ))}
                <th style={{ background: '#f1f5f9', padding: '12px', border: '1px solid #cbd5e1', width: '60px' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} style={{ padding: '0', border: '1px solid #cbd5e1' }}>
                      <input 
                        id={`cell-${rowIndex}-${colIndex}`}
                        type="text" 
                        value={cell} 
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                        style={{ width: '100%', padding: '12px', border: 'none', outline: 'none', background: 'white', color: 'black' }}
                      />
                    </td>
                  ))}
                  <td style={{ border: '1px solid #cbd5e1', textAlign: 'center' }}>
                    <button 
                      onClick={() => removeRow(rowIndex)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={columns.length + 1} style={{ padding: '2rem', textAlign: 'center', background: 'white', color: '#94a3b8' }}>
                    아직 입력된 데이터가 없습니다. 상단의 [데이터 행 추가]를 눌러주세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DynamicTableEditor;
