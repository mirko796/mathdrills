import React, { useState, useRef } from 'react';
import './styles.css';
import { IntlProvider } from 'react-intl';
import messages_en from './translations/en.json';
import messages_srlat from './translations/sr_lat.json';
import { FormattedMessage } from 'react-intl';

const messages: any = {
  'en': messages_en,
  'sr': messages_srlat,
};
const App: React.FC = () => {
  const [language, setLanguage] = useState<string>('en');
  const [n, setN] = useState<number>(3); // Default number of circles
  const [m, setM] = useState<number>(1); // Default number of squares
  const [rows, setRows] = useState<number>(10); // Default number of rows
  const [cols, setCols] = useState<number>(6); // Default number of columns
  const [fontSize, setFontSize] = useState<number>(28); // Default font size
  const [operator, setOperator] = useState<string>('+'); // Default operator ['+', '-', 'x', '/')
  const [canvasWidth, _setCanvasWidth] = useState<number>(2100 / 2); // Default canvas width
  const [canvasHeight, _setCanvasHeight] = useState<number>(2970 / 2); // Default canvas height
  const [canvasVisible, setCanvasVisible] = useState<boolean>(false);
  const [singleLine, setSingleLine] = useState<boolean>(false);
  const [maxNumber, setMaxNumber] = useState<number>(20); // Used only when n and m are 2 or 1
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  function renderMultilineText(context: CanvasRenderingContext2D, text: string, x: number, y: number, lineSpacing: number = 1.5, singleLine: boolean = false, dryRun: boolean = false) {
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
      if (!singleLine) {
        // draw thick line below
        const charWidth = context.measureText(' ').width;
        context.beginPath();
        context.moveTo(x + charWidth, y);
        context.lineTo(x + lineLength, y);
        context.lineWidth = 2;
        context.stroke();
      }
    }
    return [lineLength, y - startY]
  }

  function generateText(numbers: number[], operator: string, singleLine: boolean) {
    const [a, b] = numbers;
    const aStr = a.toString();
    const bStr = b.toString();
    let text = '';
    if (singleLine) {
      text = `${aStr} ${operator} ${bStr} = `;
    } else {
      // pad both aStr and bStr to same length
      const maxLen = Math.max(aStr.length, bStr.length) + 2;
      const aStrPadded = aStr.padStart(maxLen, ' ');
      let bStrPadded = bStr.padStart(maxLen, ' ');
      // replace first char in bStrPadded with operator
      bStrPadded = bStrPadded.replace(bStrPadded[0], operator);
      text = `${aStrPadded}\n${bStrPadded}`;
    }
    return text;
  }
  function getRandomIntegers(digits1: number, digits2: number, operator: string = '+') {
    if (operator == '-') {
      if (digits1 < digits2) {
        const tmp = digits1;
        digits1 = digits2;
        digits2 = tmp;
      }
    }
    const min1 = Math.pow(10, digits1 - 1);
    const max1 = Math.pow(10, digits1) - 1;
    const min2 = Math.pow(10, digits2 - 1);
    const max2 = Math.pow(10, digits2) - 1;
    let a, b;
    while (true) {
      a = Math.floor(Math.random() * (max1 - min1 + 1)) + min1;
      b = Math.floor(Math.random() * (max2 - min2 + 1)) + min2;
      if (operator == '-') {
        if (a <= b) {
          continue;
        }
      }
      if (digits1 < 3 && digits2 < 3 && Math.max(digits1, digits2) == 2) {
        if (a >= maxNumber || b >= maxNumber) {
          continue;
        }
      }
      break;
    }
    return [a, b];
  }
  const handleGenerate = () => {
    setCanvasVisible(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let cellWidth, cellHeight;
        const marginTopAndBottom = 0.025
        if (!singleLine) {
          cellWidth = canvasWidth / cols;
          cellHeight = (canvasHeight * (1 - marginTopAndBottom * 2)) / rows;
        } else {
          cellWidth = (canvasWidth * (1 - marginTopAndBottom * 2)) / cols;
          cellHeight = canvasHeight / rows;
        }
        // for (let i = 0; i < rows; i++) {
        //   for (let j = 0; j < cols; j++) {
        //     ctx.beginPath();
        //     ctx.rect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
        //     ctx.stroke();
        //   }
        // }
        // fill whole canvas with white
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Set the font to a monospaced font
        ctx.font = `${fontSize}px monospace`;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.fillStyle = 'black';
        let numbers = getRandomIntegers(n, m, operator);
        let text = generateText(numbers, operator, singleLine);
        const [textWidth, textHeight] = renderMultilineText(ctx, text, 10, 10, 1.5, singleLine, true);
        for (let col = 0; col < cols; col++) {
          for (let row = 0; row < rows; row++) {
            numbers = getRandomIntegers(n, m, operator);
            text = generateText(numbers, operator, singleLine);
            // center in current cell
            let x = col * cellWidth;
            if (!singleLine) {
              x += (cellWidth - textWidth) / 2;
            } else {
              x += marginTopAndBottom * canvasWidth;
            }
            let y = row * cellHeight;
            if (singleLine) {
              y += (cellHeight - textHeight) / 2;
            } else {
              y += marginTopAndBottom * canvasHeight;
            }
            renderMultilineText(ctx, text, x, y, 1.5, singleLine);
          }
        }
        const footerText = "Generated by mirko796.github.io/mathdrills";
        // draw text at bottom of canvas horizontally centered using gray color with some Tahoma italic font
        ctx.fillStyle = 'gray';
        ctx.textBaseline = 'bottom';
        ctx.textAlign = 'center';
        ctx.font = `italic 14px Tahoma`;
        ctx.fillText(footerText, canvasWidth / 2, canvasHeight - 10);

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
    <IntlProvider locale={language} messages={messages[language]}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div className='container'>
          <div className='horizontalflex'>
            <div className='horizontalflex' style={{flexGrow:1}}></div>
            <h1><FormattedMessage id="TITLE" /></h1>
            <div className='horizontalflex' style={{flexGrow:1}}></div>
            <button onClick={() => setLanguage('sr')} title="Srpski">
              <img src="./serbia.png" alt="Srpski" className='langicon' />
            </button>
            <button onClick={() => setLanguage('en')} title="English">
              <img src="./united-kingdom.png" alt="English" className='langicon' />
            </button>
          </div>
          <div className='horizontalflex'>
            <div className='verticalflex'>
              <label>
                <FormattedMessage id="N1LEN" />
                <input type="number" value={n} onChange={e => setN(parseInt(e.target.value, 10))} />
              </label>
              <label>
                <FormattedMessage id="N2LEN" />
                <input type="number" value={m} onChange={e => setM(parseInt(e.target.value, 10))} />
              </label>
              {/* if m and n are both 2 show control for maxNumber */}
              {(m < 3 && n < 3 && Math.max(m, n) == 2) && <label>
                <FormattedMessage id="MAXNUMBER" />
                <input type="number" value={maxNumber} onChange={e => setMaxNumber(parseInt(e.target.value, 10))} />
              </label>}
              <label>
                <FormattedMessage id="OPERATOR" />
                {/* create select box with + - * / options */}
                <select value={operator} onChange={e => setOperator(e.target.value)}>
                  <option value="+">+</option>
                  <option value="-">-</option>
                  <option value="*">*</option>
                </select>
              </label>
            </div>
            <div className="verticalflex">
              <label>
                <FormattedMessage id="ROWS" />
                <input type="number" value={rows} onChange={e => setRows(parseInt(e.target.value, 10))} />
              </label>
              <label>
                <FormattedMessage id="COLS" />
                <input type="number" value={cols} onChange={e => setCols(parseInt(e.target.value, 10))} />
              </label>
              <label>
                <FormattedMessage id="TEXTSIZE" />
                <input type="number" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value, 10))} />
              </label>
              <label>
                <FormattedMessage id="SINGLELINE" />

                <input type="checkbox" checked={singleLine} onChange={e => setSingleLine(e.target.checked)} />
              </label>
            </div>
          </div>
          <div>
            <br />
            <button onClick={handleGenerate}>
              <FormattedMessage id="BTN_GENERATE" />
            </button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <button onClick={handleDownload} disabled={!canvasVisible}>
              <FormattedMessage id="BTN_DOWNLOAD" />
            </button>
            &nbsp;&nbsp;&nbsp;&nbsp;
            <button onClick={handlePrint} disabled={!canvasVisible}>
              <FormattedMessage id="BTN_PRINT" />
            </button>
          </div>
        </div>
        <canvas ref={canvasRef} width={canvasWidth}
          height={canvasHeight} className="canvas"
          style={{ display: canvasVisible ? 'block' : 'none' }}
        />
      </div>
    </IntlProvider>
  );
};

export default App;
