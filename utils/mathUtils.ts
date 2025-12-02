import temml from 'temml';

/**
 * Replaces HTML named entities with XML-safe numeric entities.
 */
const sanitizeMathML = (mathml: string): string => {
  let cleanMath = mathml;
  if (!cleanMath.includes('xmlns="http://www.w3.org/1998/Math/MathML"')) {
    cleanMath = cleanMath.replace('<math', '<math xmlns="http://www.w3.org/1998/Math/MathML"');
  }

  const entityMap: Record<string, string> = {
    '&nbsp;': '&#160;',
    '&thinsp;': '&#8201;',
    '&ensp;': '&#8194;',
    '&emsp;': '&#8195;',
    '&af;': '&#8289;',
    '&it;': '&#8290;',
    '&ApplyFunction;': '&#8289;',
    '&InvisibleTimes;': '&#8290;',
    '&lt;': '&#60;',
    '&gt;': '&#62;',
    '&amp;': '&#38;',
    '&quot;': '&#34;',
    '&apos;': '&#39;'
  };

  cleanMath = cleanMath.replace(/&([a-zA-Z]+);/g, (match) => {
    return entityMap[match] || match;
  });

  return cleanMath;
};

/**
 * Cleans raw LaTeX input from Gemini to prevent crashes.
 * Removes Markdown code blocks, extra dollars, etc.
 */
const cleanRawLatex = (latex: string): string => {
  if (!latex) return "";
  
  // 1. Remove Markdown code blocks (```latex ... ```)
  let clean = latex.replace(/```latex/gi, '').replace(/```/g, '');
  
  // 2. Remove "Here is the equation:" type text if mixed (naive check)
  // (Ideally, we just strip the delimiters)
  
  // 3. Remove standard LaTeX delimiters commonly returned by AI
  clean = clean.replace(/^\\\[/, '').replace(/\\\]$/, ''); // Remove \[ ... \]
  clean = clean.replace(/^\$\$/, '').replace(/\$\$$/, ''); // Remove $$ ... $$
  clean = clean.replace(/^\$/, '').replace(/\$/, '');      // Remove $ ... $

  return clean.trim();
};

/**
 * Converts a LaTeX string to MathML markup suitable for MS Word.
 * NOW CRASH-PROOF!
 */
export const latexToMathML = (latex: string): string => {
  if (!latex) return "";

  try {
    // Step 1: Clean the input first
    const safeLatex = cleanRawLatex(latex);

    // Step 2: Render with error handling
    const mathml = temml.renderToString(safeLatex, {
      displayMode: true,
      xml: true,
      trust: true,
      errorColor: '#cc0000', // Show error in red instead of crashing
      throwOnError: false    // CRITICAL: This prevents the white screen crash
    });
    
    return sanitizeMathML(mathml);
  } catch (e) {
    console.error("MathML conversion failed", e);
    // Return a safe placeholder so the app doesn't die
    return `<math xmlns="http://www.w3.org/1998/Math/MathML"><mtext style="color:red">Error parsing LaTeX</mtext></math>`;
  }
};

/**
 * Copies the provided MathML to the clipboard in a format MS Word accepts.
 */
export const copyToWordClipboard = async (mathml: string, originalLatex: string): Promise<void> => {
  if (!mathml) throw new Error("No MathML to copy");

  const htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title></title>
</head>
<body>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>100</w:Zoom>
<w:DoNotOptimizeForBrowser/>
</w:WordDocument>
</xml>
<![endif]-->
${mathml}
</body>
</html>`;

  const blobHtml = new Blob([htmlContent], { type: 'text/html' });
  const blobText = new Blob([originalLatex], { type: 'text/plain' });

  const item = new ClipboardItem({
    'text/html': blobHtml,
    'text/plain': blobText,
  });

  await navigator.clipboard.write([item]);
};

/**
 * Downloads the MathML as a .docx compatible file.
 */
export const downloadAsDocFile = (mathml: string, filename: string = 'equation') => {
    const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><title></title></head>
    <body>
    ${mathml}
    </body>
    </html>`;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
