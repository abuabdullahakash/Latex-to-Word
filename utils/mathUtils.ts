import temml from 'temml';

/**
 * Replaces HTML named entities with XML-safe numeric entities.
 * Word/OnlyOffice XML parsers often fail on entities like &nbsp; or &infty; 
 * because they are not defined in standard XML.
 */
const sanitizeMathML = (mathml: string): string => {
  // 1. Ensure the math tag has the correct namespace
  let cleanMath = mathml;
  if (!cleanMath.includes('xmlns="http://www.w3.org/1998/Math/MathML"')) {
    cleanMath = cleanMath.replace('<math', '<math xmlns="http://www.w3.org/1998/Math/MathML"');
  }

  // 2. Replace common named entities with numeric equivalents or safe characters
  // This list can be expanded, but these are common culprits in MathML
  const entityMap: Record<string, string> = {
    '&nbsp;': '&#160;',
    '&thinsp;': '&#8201;',
    '&ensp;': '&#8194;',
    '&emsp;': '&#8195;',
    '&af;': '&#8289;', // ApplyFunction
    '&it;': '&#8290;', // InvisibleTimes
    '&ApplyFunction;': '&#8289;',
    '&InvisibleTimes;': '&#8290;',
    // Add basic XML entities just in case, though usually handled
    '&lt;': '&#60;',
    '&gt;': '&#62;',
    '&amp;': '&#38;',
    '&quot;': '&#34;',
    '&apos;': '&#39;'
  };

  // Replace named entities like &name; with numeric versions
  // We use a regex to find &...; patterns that are NOT numeric (&#...;)
  cleanMath = cleanMath.replace(/&([a-zA-Z]+);/g, (match) => {
    return entityMap[match] || match; // Return mapped value or keep original if unknown
  });

  return cleanMath;
};

/**
 * Converts a LaTeX string to MathML markup suitable for MS Word.
 */
export const latexToMathML = (latex: string): string => {
  try {
    // Temml is a lightweight library for LaTeX to MathML conversion.
    const mathml = temml.renderToString(latex, {
      displayMode: true,
      xml: true, // Generate XML-compatible output
      trust: true, // Allow more commands
    });
    
    // Post-process to ensure strict XML validity for Word
    return sanitizeMathML(mathml);
  } catch (e) {
    console.error("MathML conversion failed", e);
    return "";
  }
};

/**
 * Copies the provided MathML to the clipboard in a format MS Word accepts.
 */
export const copyToWordClipboard = async (mathml: string, originalLatex: string): Promise<void> => {
  if (!mathml) throw new Error("No MathML to copy");

  // MS Word is very picky about the clipboard format.
  // We use a specific HTML wrapper that Word recognizes as "Source: Word".
  // NOTE: The <title> tag MUST be empty or absent to prevent "Equation" text from appearing in Word.
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
 * Downloads the MathML as a .docx compatible file (using HTML trick).
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