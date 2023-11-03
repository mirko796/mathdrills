import React, { useState, useRef } from 'react';
import './styles.css';

const App: React.FC = () => {
  const [n, setN] = useState<number>(3); // Default number of circles
  const [m, setM] = useState<number>(1); // Default number of squares
  const [rows, setRows] = useState<number>(10); // Default number of rows
  const [cols, setCols] = useState<number>(6); // Default number of columns
  const [fontSize, setFontSize] = useState<number>(28); // Default font size
  const [operator, setOperator] = useState<string>('+'); // Default operator ['+', '-', 'x', '/')
  const [canvasWidth, _setCanvasWidth] = useState<number>(2100 / 2); // Default canvas width
  const [canvasHeight, _setCanvasHeight] = useState<number>(2970 / 2); // Default canvas height
  const [canvasVisible, setCanvasVisible] = useState<boolean>(false); 
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function renderMultilineText(context: CanvasRenderingContext2D, text: string, x: number, y: number, lineSpacing: number = 1.5, dryRun: boolean = false) {
    // Split the text into lines
    const lines = text.split('\n');
    // get the longest line length
    const longestLine = lines.reduce((a, b) => a.length > b.length ? a : b);
    // pad all lines to the same length by adding spaces to the start
    const paddedLines = lines.map(line => line.padStart(longestLine.length, ' '));

    const lineLength = context.measureText(longestLine).width;
    const startY = y;
    for (const line of paddedLines) {
      const metrics = context.measureText(line);
      const lineHeight = (metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) * lineSpacing;
      if (!dryRun) {
        context.fillText(line, x, y);
      }
      y += lineHeight;
    }
    if (!dryRun) {
      // draw thick line below
      const charWidth = context.measureText(' ').width;
      context.beginPath();
      context.moveTo(x + charWidth, y);
      context.lineTo(x + lineLength, y);
      context.lineWidth = 2;
      context.stroke();
    }
    return [lineLength, y - startY]
  }

  function generateText(numbers: number[], operator: string) {
    const [a, b] = numbers;
    const aStr = a.toString();
    const bStr = b.toString();
    // pad both aStr and bStr to same length
    const maxLen = Math.max(aStr.length, bStr.length) + 2;
    const aStrPadded = aStr.padStart(maxLen, ' ');
    let bStrPadded = bStr.padStart(maxLen, ' ');
    // replace first char in bStrPadded with operator
    bStrPadded = bStrPadded.replace(bStrPadded[0], operator);
    const text = `${aStrPadded}\n${bStrPadded}`;
    return text;
  }
  function getRandomIntegers(digits1: number, digits2: number) {
    const min1 = Math.pow(10, digits1 - 1);
    const max1 = Math.pow(10, digits1) - 1;
    const min2 = Math.pow(10, digits2 - 1);
    const max2 = Math.pow(10, digits2) - 1;
    const a = Math.floor(Math.random() * (max1 - min1 + 1)) + min1;
    const b = Math.floor(Math.random() * (max2 - min2 + 1)) + min2;
    return [a, b];
  }
  const handleGenerate = () => {
    setCanvasVisible(true); 
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const cellWidth = canvasWidth / cols;
        const marginTopAndBottom = 0.025
        const cellHeight = (canvasHeight * (1 - marginTopAndBottom * 2)) / rows;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            ctx.beginPath();
            ctx.rect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
            ctx.stroke();
          }
        }
        // fill whole canvas with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Set the font to a monospaced font
        ctx.font = `${fontSize}px monospace`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'black';
        let numbers = getRandomIntegers(n, m);
        let text = generateText(numbers, operator);
        const [textWidth, _textHeight] = renderMultilineText(ctx, text, 10, 10, 1.5, true);
        for (let col = 0; col < cols; col++) {
          for (let row = 0; row < rows; row++) {
            numbers = getRandomIntegers(n, m);
            text = generateText(numbers, operator);
            // center in current cell
            const x = col * cellWidth + (cellWidth - textWidth) / 2;
            const y = row * cellHeight + marginTopAndBottom * canvasHeight;
            renderMultilineText(ctx, text, x, y);
          }
        }

      }
    }
  };
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const image = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'math-drills.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (canvas) {

      // Create an image from the canvas
      const canvasImageUrl = canvas.toDataURL('image/png');

      // Create a new window or an iframe containing the image
      // and trigger the print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`<html><head><title>Print Canvas</title></head><body><img src="${canvasImageUrl}"></body></html>`);
        printWindow.document.close();
        printWindow.focus();

        // Use a timeout to allow the image to be rendered before printing
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };


  return (
    <div style={{display:'flex',flexDirection:'column'}}>
      <div className='container'>
        <h1>Math Drills</h1>
        <div className='horizontalflex'>
          <div className='verticalflex'>
            <label>
              Length of first number:
              <input type="number" value={n} onChange={e => setN(parseInt(e.target.value, 10))} />
            </label>
            <label>
              Length of second number:
              <input type="number" value={m} onChange={e => setM(parseInt(e.target.value, 10))} />
            </label>
            <label>
              Operator:
              {/* create select box with + - * / options */}
              <select value={operator} onChange={e => setOperator(e.target.value)}>
                <option value="+">+</option>
                <option value="-">-</option>
                <option value="*">*</option>
                <option value="/">/</option>
              </select>
            </label>
          </div>
          <div className="verticalflex">
            <label>
              Rows:
              <input type="number" value={rows} onChange={e => setRows(parseInt(e.target.value, 10))} />
            </label>
            <label>
              Columns:
              <input type="number" value={cols} onChange={e => setCols(parseInt(e.target.value, 10))} />
            </label>
            <label>
              Text size:
              <input type="number" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value, 10))} />
            </label>
          </div>
        </div>
        <div>
          <br />
          <button onClick={handleGenerate}>Generate</button> 
          &nbsp;&nbsp;&nbsp;&nbsp;
          <button onClick={handleDownload} disabled={!canvasVisible}>Download Image</button> 
          &nbsp;&nbsp;&nbsp;&nbsp;
          <button onClick={handlePrint} disabled={!canvasVisible}>Print Image</button>
        </div>
      </div>
      <canvas ref={canvasRef} width={canvasWidth} 
              height={canvasHeight} className="canvas"
              style={{ display: canvasVisible ? 'block' : 'none' }}
      />
    </div>
  );
};

export default App;
