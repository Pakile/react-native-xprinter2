import { printTSCLabel, Rotation } from 'react-native-xprinter2';
import type { TSCLabelOptions } from 'react-native-xprinter2';

const processVietnameseText = (text: string): string => {
  if (!text) return '';
  
  const vietnameseMap: { [key: string]: string } = {
    'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    'È': 'E', 'É': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
    'Đ': 'D'
  };

  let processedText = text;
  for (const [vietnamese, ascii] of Object.entries(vietnameseMap)) {
    processedText = processedText.replace(new RegExp(vietnamese, 'g'), ascii);
  }

  return processedText;
};

export const printItemLabel = async (item: any, index: number) => {
  const processProductName = (name: string): string[] => {
    const processedName = processVietnameseText(name);
    const nameWithIndex = `${index}.${processedName}`;
    const maxCharsPerLine = 18;
    
    if (nameWithIndex.length <= maxCharsPerLine) {
      return [nameWithIndex];
    }
    
    const words = nameWithIndex.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [nameWithIndex];
  };

  const processNote = (note: string): string[] => {
    if (!note) return [];
    
    const processedNote = processVietnameseText(note);
    const maxCharsPerLine = 20;
    
    if (processedNote.length <= maxCharsPerLine) {
      return [processedNote];
    }
    
    const parts = processedNote.split(/[,.]/).map(part => part.trim()).filter(part => part);
    
    const lines: string[] = [];
    let currentLine = '';
    
    for (const part of parts) {
      if (currentLine.length + part.length + 2 <= maxCharsPerLine) {
        currentLine += (currentLine ? ', ' : '') + part;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = part;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines.length > 0 ? lines : [processedNote];
  };

  const nameLines = processProductName(item.name);
  const noteLines = processNote(item.note);
  
  const texts = [
    {
      x: 5,
      y: 5,
      content: nameLines[0] || '',
      font: '3',
      rotation: Rotation.ROTATION_0,
      xMul: 1,
      yMul: 1,
    },
  ];

  for (let i = 1; i < nameLines.length; i++) {
    texts.push({
      x: 5,
      y: 5 + (i * 20),
      content: nameLines[i] || '',
      font: '3',
      rotation: Rotation.ROTATION_0,
      xMul: 1,
      yMul: 1,
    });
  }

  const priceY = 5 + (nameLines.length * 20) + 20;

  texts.push({
    x: 5,
    y: priceY,
    content: `${item.price.toLocaleString()} VND`,
    font: '2',
    rotation: Rotation.ROTATION_0,
    xMul: 1,
    yMul: 1,
  });

  const noteStartY = priceY + 30;
  noteLines.forEach((line, index) => {
    texts.push({
      x: 5,
      y: noteStartY + (index * 20),
      content: line,
      font: '2',
      rotation: Rotation.ROTATION_0,
      xMul: 1,
      yMul: 1,
    });
  });

  const totalHeight = 25 + (nameLines.length - 1) * 5 + (noteLines.length > 1 ? (noteLines.length - 1) * 5 : 0);

  const options: TSCLabelOptions = {
    width: 40,
    height: totalHeight,
    gap: 2,
    density: 8,
    speed: 4,
    copies: item.quantity,
    texts: texts,
  };

  await printTSCLabel(options);
}; 