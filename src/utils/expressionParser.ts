export interface ExpressionData {
  sampleNames: string[];
  featureNames: string[];
  data: number[][];
  nonDataColumns: string[];
  metadata: Record<string, string[]>;
  // 单细胞特有字段
  hasPrecomputedCoordinates?: boolean;
  umapCoordinates?: { x: number[]; y: number[] };
  tsneCoordinates?: { x: number[]; y: number[] };
  markerGenes?: string[];
  cellTypes?: string[];
}

export type DataLayout = 'samples-as-rows' | 'features-as-rows' | 'single-cell';

export interface DetectedLayout {
  layout: DataLayout;
  sampleCount: number;
  featureCount: number;
  nonDataColumns: string[];
  isSingleCell?: boolean;
}

// 检测数据布局
export function detectDataLayout(content: string): DetectedLayout {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('文件至少需要2行数据（表头+数据）');
  }

  // 解析表头
  const separator = detectSeparator(lines[0]);
  const headers = lines[0].split(separator).map(h => h.trim());
  
  // 检查是否为单细胞数据格式
  const isSingleCellData = checkSingleCellFormat(headers);
  
  if (isSingleCellData) {
    return detectSingleCellLayout(content, headers, separator);
  }
  
  // 解析前几行数据来判断数值列
  const dataLines = lines.slice(1, Math.min(6, lines.length)); // 最多检查5行数据
  const numericColumns: number[] = [];
  
  for (let col = 0; col < headers.length; col++) {
    let isNumeric = true;
    let numericCount = 0;
    
    for (const line of dataLines) {
      const values = line.split(separator);
      if (values.length <= col) continue;
      
      const value = values[col].trim();
      if (value === '' || value === 'NA' || value === 'NaN' || value === 'null') {
        // 空值或缺失值不算作非数值
        continue;
      }
      
      if (!isNumericString(value)) {
        isNumeric = false;
        break;
      }
      numericCount++;
    }
    
    // 如果该列有数值数据且大部分是数值，认为是数值列
    if (isNumeric && numericCount > 0) {
      numericColumns.push(col);
    }
  }

  // 找出非数值列
  const nonDataColumnIndices = headers
    .map((_, index) => index)
    .filter(index => !numericColumns.includes(index));
  
  const nonDataColumns = nonDataColumnIndices.map(index => headers[index]);

  // 判断布局：如果数值列数 > 非数值列数，可能是行=样本；反之是行=基因
  const numericCount = numericColumns.length;
  const nonNumericCount = nonDataColumns.length;
  
  // 更智能的判断：如果第一列看起来像ID且非数值，可能是行=样本
  const firstColumnLooksLikeId = nonDataColumnIndices.includes(0) && 
    (headers[0].toLowerCase().includes('id') || 
     headers[0].toLowerCase().includes('sample') ||
     headers[0].toLowerCase().includes('gene'));

  let layout: DataLayout;
  if (firstColumnLooksLikeId && numericCount > nonNumericCount) {
    layout = 'samples-as-rows';
  } else if (numericCount > nonNumericCount * 2) {
    layout = 'samples-as-rows';
  } else {
    layout = 'features-as-rows';
  }

  const sampleCount = layout === 'samples-as-rows' ? lines.length - 1 : numericColumns.length;
  const featureCount = layout === 'samples-as-rows' ? numericColumns.length : lines.length - 1;

  return {
    layout,
    sampleCount,
    featureCount,
    nonDataColumns
  };
}

// 检查是否为单细胞数据格式
function checkSingleCellFormat(headers: string[]): boolean {
  const headerStr = headers.join(',').toLowerCase();
  
  // 检查典型的单细胞数据列名
  const singleCellIndicators = [
    'cell_id', 'cellid', 'barcode',
    'umap_1', 'umap1', 'umap_2', 'umap2',
    'tsne_1', 'tsne1', 'tsne_2', 'tsne2',
    'cell_type', 'celltype', 'cell.type',
    'cell_type_broad', 'cluster',
    'expr_'
  ];
  
  return singleCellIndicators.some(indicator => 
    headerStr.includes(indicator)
  );
}

// 检测单细胞数据布局
function detectSingleCellLayout(content: string, headers: string[], separator: string): DetectedLayout {
  const lines = content.trim().split('\n');
  const dataLines = lines.slice(1);
  
  // 找出所有列的类型
  const columnTypes: Array<'coordinate' | 'marker' | 'metadata' | 'other'> = [];
  
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase();
    
    if (header.includes('umap_') || header.includes('tsne_')) {
      columnTypes.push('coordinate');
    } else if (header.startsWith('expr_')) {
      columnTypes.push('marker');
    } else if (['cell_id', 'cell_type', 'cell_type_broad', 'sample', 'condition', 'cluster'].some(h => header.includes(h))) {
      columnTypes.push('metadata');
    } else {
      columnTypes.push('other');
    }
  }
  
  // 统计各类型列数
  const coordinateColumns = columnTypes.map((type, index) => type === 'coordinate' ? index : -1).filter(i => i !== -1);
  const markerColumns = columnTypes.map((type, index) => type === 'marker' ? index : -1).filter(i => i !== -1);
  const metadataColumns = columnTypes.map((type, index) => type === 'metadata' ? index : -1).filter(i => i !== -1);
  
  return {
    layout: 'single-cell',
    sampleCount: dataLines.length,
    featureCount: markerColumns.length,
    nonDataColumns: metadataColumns.map(i => headers[i]),
    isSingleCell: true
  };
}

// 解析表达数据
export function parseExpressionData(content: string, layout: DataLayout): ExpressionData | { error: string } {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    return { error: '文件至少需要2行数据（表头+数据）' };
  }

  const separator = detectSeparator(lines[0]);
  const headers = lines[0].split(separator).map(h => h.trim());
  
  if (layout === 'single-cell') {
    return parseSingleCellData(content, headers, separator);
  }
  
  // 找出数值列
  const numericColumns = findNumericColumns(lines, separator);
  const nonDataColumnIndices = headers
    .map((_, index) => index)
    .filter(index => !numericColumns.includes(index));
  
  const nonDataColumns = nonDataColumnIndices.map(index => headers[index]);

  let sampleNames: string[];
  let featureNames: string[];
  let data: number[][];

  if (layout === 'samples-as-rows') {
    // 行是样本，列是基因
    sampleNames = [];
    featureNames = numericColumns.map(index => headers[index]);
    data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator);
      
      // 第一列通常是样本ID
      if (values.length > 0) {
        sampleNames.push(values[0].trim());
      }

      const rowData: number[] = [];
      for (const colIndex of numericColumns) {
        if (colIndex < values.length) {
          const value = parseFloat(values[colIndex]);
          rowData.push(isNaN(value) ? 0 : value);
        } else {
          rowData.push(0);
        }
      }
      data.push(rowData);
    }
  } else {
    // 行是基因，列是样本
    featureNames = [];
    sampleNames = numericColumns.map(index => headers[index]);
    
    // 转置数据
    const transposedData: number[][] = [];
    
    // 初始化转置数据结构
    for (let i = 0; i < numericColumns.length; i++) {
      transposedData.push([]);
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator);
      
      // 第一列通常是基因名
      if (values.length > 0) {
        featureNames.push(values[0].trim());
      }

      for (let j = 0; j < numericColumns.length; j++) {
        const colIndex = numericColumns[j];
        if (colIndex < values.length) {
          const value = parseFloat(values[colIndex]);
          transposedData[j].push(isNaN(value) ? 0 : value);
        } else {
          transposedData[j].push(0);
        }
      }
    }

    data = transposedData;
  }

  // 解析元数据
  const metadata: Record<string, string[]> = {};
  for (const colIndex of nonDataColumnIndices) {
    const columnName = headers[colIndex];
    metadata[columnName] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator);
      if (colIndex < values.length) {
        metadata[columnName].push(values[colIndex].trim());
      } else {
        metadata[columnName].push('');
      }
    }
  }

  return {
    sampleNames,
    featureNames,
    data,
    nonDataColumns,
    metadata
  };
}

// 解析单细胞数据
function parseSingleCellData(content: string, headers: string[], separator: string): ExpressionData | { error: string } {
  const lines = content.trim().split('\n');
  const dataLines = lines.slice(1);
  
  // 找出各类型列的索引
  const umap1Index = headers.findIndex(h => h.toLowerCase() === 'umap_1');
  const umap2Index = headers.findIndex(h => h.toLowerCase() === 'umap_2');
  const tsne1Index = headers.findIndex(h => h.toLowerCase() === 'tsne_1');
  const tsne2Index = headers.findIndex(h => h.toLowerCase() === 'tsne_2');
  const cellIdIndex = headers.findIndex(h => h.toLowerCase() === 'cell_id');
  const cellTypeIndex = headers.findIndex(h => h.toLowerCase() === 'cell_type');
  const cellTypeBroadIndex = headers.findIndex(h => h.toLowerCase() === 'cell_type_broad');
  
  // 找出标记基因列（以expr_开头的列）
  const markerColumns = headers
    .map((h, index) => h.toLowerCase().startsWith('expr_') ? index : -1)
    .filter(index => index !== -1);
  
  const markerGeneNames = markerColumns.map(index => 
    headers[index].substring(5) // 移除 'expr_' 前缀
  );
  
  // 找出元数据列
  const metadataColumns = headers
    .map((h, index) => {
      const h_lower = h.toLowerCase();
      return ['cell_id', 'cell_type', 'cell_type_broad', 'sample', 'condition', 'cluster'].some(
        keyword => h_lower.includes(keyword)
      ) ? index : -1;
    })
    .filter(index => index !== -1);
  
  // 解析数据
  const cellIds: string[] = [];
  const umapCoordinates = { x: [] as number[], y: [] as number[] };
  const tsneCoordinates = { x: [] as number[], y: [] as number[] };
  const markerExpression: number[][] = [];
  const metadata: Record<string, string[]> = {};
  
  // 初始化元数据
  for (const colIndex of metadataColumns) {
    metadata[headers[colIndex]] = [];
  }
  
  for (let i = 0; i < dataLines.length; i++) {
    const values = dataLines[i].split(separator);
    
    // 解析细胞ID
    if (cellIdIndex >= 0 && cellIdIndex < values.length) {
      cellIds.push(values[cellIdIndex].trim());
    } else {
      cellIds.push(`cell_${String(i).padStart(6, '0')}`);
    }
    
    // 解析UMAP坐标
    if (umap1Index >= 0 && umap1Index < values.length) {
      umapCoordinates.x.push(parseFloat(values[umap1Index]) || 0);
    }
    if (umap2Index >= 0 && umap2Index < values.length) {
      umapCoordinates.y.push(parseFloat(values[umap2Index]) || 0);
    }
    
    // 解析tSNE坐标
    if (tsne1Index >= 0 && tsne1Index < values.length) {
      tsneCoordinates.x.push(parseFloat(values[tsne1Index]) || 0);
    }
    if (tsne2Index >= 0 && tsne2Index < values.length) {
      tsneCoordinates.y.push(parseFloat(values[tsne2Index]) || 0);
    }
    
    // 解析标记基因表达
    const expressionRow: number[] = [];
    for (const colIndex of markerColumns) {
      if (colIndex < values.length) {
        const value = parseFloat(values[colIndex]);
        expressionRow.push(isNaN(value) ? 0 : value);
      } else {
        expressionRow.push(0);
      }
    }
    markerExpression.push(expressionRow);
    
    // 解析元数据
    for (const colIndex of metadataColumns) {
      const columnName = headers[colIndex];
      if (colIndex < values.length) {
        metadata[columnName].push(values[colIndex].trim());
      } else {
        metadata[columnName].push('');
      }
    }
  }
  
  // 获取细胞类型信息
  const cellTypes = cellTypeIndex >= 0 ? metadata[headers[cellTypeIndex]] : [];
  const cellTypesBroad = cellTypeBroadIndex >= 0 ? metadata[headers[cellTypeBroadIndex]] : [];
  
  return {
    sampleNames: cellIds,
    featureNames: markerGeneNames,
    data: markerExpression,
    nonDataColumns: metadataColumns.map(i => headers[i]),
    metadata,
    hasPrecomputedCoordinates: true,
    umapCoordinates: umapCoordinates.x.length > 0 ? umapCoordinates : undefined,
    tsneCoordinates: tsneCoordinates.x.length > 0 ? tsneCoordinates : undefined,
    markerGenes: markerGeneNames,
    cellTypes: cellTypes.length > 0 ? cellTypes : undefined
  };
}

// 检测分隔符
function detectSeparator(line: string): string {
  const commaCount = (line.match(/,/g) || []).length;
  const tabCount = (line.match(/\t/g) || []).length;
  
  return tabCount > commaCount ? '\t' : ',';
}

// 检查字符串是否为数值
function isNumericString(str: string): boolean {
  const trimmed = str.trim();
  return !isNaN(parseFloat(trimmed)) && isFinite(parseFloat(trimmed));
}

// 找出数值列
function findNumericColumns(lines: string[], separator: string): number[] {
  const headers = lines[0].split(separator);
  const numericColumns: number[] = [];
  
  // 检查前几行数据
  const dataLines = lines.slice(1, Math.min(6, lines.length));
  
  for (let col = 0; col < headers.length; col++) {
    let isNumeric = true;
    let hasValue = false;
    
    for (const line of dataLines) {
      const values = line.split(separator);
      if (values.length <= col) continue;
      
      const value = values[col].trim();
      if (value === '' || value === 'NA' || value === 'NaN' || value === 'null') {
        continue;
      }
      
      hasValue = true;
      if (!isNumericString(value)) {
        isNumeric = false;
        break;
      }
    }
    
    if (isNumeric && hasValue) {
      numericColumns.push(col);
    }
  }
  
  return numericColumns;
}