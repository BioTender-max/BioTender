import { ExpressionData } from './expressionParser';

export interface PCAResult {
  scores: number[][];  // PCA scores (n_samples x n_components)
  loadings: number[][];  // PCA loadings (n_features x n_components)
  explainedVariance: number[];  // Explained variance for each component
  explainedVarianceRatio: number[];  // Explained variance ratio
  featureNames: string[];
  sampleNames: string[];
}

// 标准化数据（z-score标准化）
export function standardizeData(data: number[][]): number[][] {
  const nSamples = data.length;
  const nFeatures = data[0].length;
  
  // 计算每列的均值和标准差
  const means: number[] = [];
  const stds: number[] = [];
  
  for (let j = 0; j < nFeatures; j++) {
    let sum = 0;
    let sumSquared = 0;
    let count = 0;
    
    for (let i = 0; i < nSamples; i++) {
      const value = data[i][j];
      if (!isNaN(value) && isFinite(value)) {
        sum += value;
        sumSquared += value * value;
        count++;
      }
    }
    
    const mean = sum / count;
    const variance = (sumSquared / count) - (mean * mean);
    const std = Math.sqrt(variance);
    
    means.push(mean);
    stds.push(std);
  }
  
  // 标准化数据
  const standardized: number[][] = [];
  for (let i = 0; i < nSamples; i++) {
    const row: number[] = [];
    for (let j = 0; j < nFeatures; j++) {
      const value = data[i][j];
      if (stds[j] === 0 || isNaN(value) || !isFinite(value)) {
        row.push(0); // 标准差为0或无效值时设为0
      } else {
        row.push((value - means[j]) / stds[j]);
      }
    }
    standardized.push(row);
  }
  
  return standardized;
}

// 矩阵转置
export function transpose(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  const result: number[][] = [];
  for (let j = 0; j < cols; j++) {
    result[j] = [];
    for (let i = 0; i < rows; i++) {
      result[j][i] = matrix[i][j];
    }
  }
  
  return result;
}

// 矩阵乘法
export function matrixMultiply(A: number[][], B: number[][]): number[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const rowsB = B.length;
  const colsB = B[0].length;
  
  if (colsA !== rowsB) {
    throw new Error('矩阵维度不匹配，无法相乘');
  }
  
  const result: number[][] = [];
  for (let i = 0; i < rowsA; i++) {
    result[i] = [];
    for (let j = 0; j < colsB; j++) {
      let sum = 0;
      for (let k = 0; k < colsA; k++) {
        sum += A[i][k] * B[k][j];
      }
      result[i][j] = sum;
    }
  }
  
  return result;
}

// 计算协方差矩阵
export function covarianceMatrix(data: number[][]): number[][] {
  const nSamples = data.length;
  const nFeatures = data[0].length;
  
  // 数据已经是标准化的，协方差矩阵 = (X^T * X) / (n-1)
  const dataT = transpose(data);
  const covMatrix = matrixMultiply(dataT, data);
  
  // 除以 n-1
  for (let i = 0; i < nFeatures; i++) {
    for (let j = 0; j < nFeatures; j++) {
      covMatrix[i][j] = covMatrix[i][j] / (nSamples - 1);
    }
  }
  
  return covMatrix;
}

// 简化的特征值分解（使用幂迭代法，适用于小型矩阵）
export function eigenDecomposition(matrix: number[][]): {
  eigenvalues: number[],
  eigenvectors: number[][]
} {
  const n = matrix.length;
  
  // 对于小型矩阵，我们可以使用简化的幂迭代法
  // 这里我们实现一个简化版本，适用于PCA
  
  // 首先创建一个单位矩阵作为初始特征向量
  const eigenvectors: number[][] = [];
  const eigenvalues: number[] = [];
  
  // 使用简化的方法：假设矩阵是对称的（协方差矩阵确实是对称的）
  // 我们将找到前几个最大的特征值和对应的特征向量
  
  const maxIterations = 100;
  const tolerance = 1e-6;
  
  for (let comp = 0; comp < Math.min(3, n); comp++) { // 只计算前3个主成分
    let vector: number[] = [];
    for (let i = 0; i < n; i++) {
      vector.push(Math.random());
    }
    
    // 归一化
    let norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    vector = vector.map(val => val / norm);
    
    // 幂迭代
    for (let iter = 0; iter < maxIterations; iter++) {
      const newVector: number[] = [];
      
      // 矩阵向量乘法
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < n; j++) {
          sum += matrix[i][j] * vector[j];
        }
        newVector.push(sum);
      }
      
      // 计算特征值（Rayleigh商）
      let eigenvalue = 0;
      for (let i = 0; i < n; i++) {
        eigenvalue += newVector[i] * vector[i];
      }
      
      // 归一化
      norm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
      if (norm === 0) break;
      
      const newVectorNormalized = newVector.map(val => val / norm);
      
      // 检查收敛
      let converged = true;
      for (let i = 0; i < n; i++) {
        if (Math.abs(newVectorNormalized[i] - vector[i]) > tolerance) {
          converged = false;
          break;
        }
      }
      
      vector = newVectorNormalized;
      
      if (converged) {
        eigenvalues.push(eigenvalue);
        break;
      }
      
      if (iter === maxIterations - 1) {
        eigenvalues.push(eigenvalue);
      }
    }
    
    eigenvectors.push([...vector]);
    
    // 对于下一个成分，我们需要确保与之前的特征向量正交
    if (comp < Math.min(3, n) - 1) {
      // 简单的正交化（这里可以改进）
      for (let i = 0; i < n; i++) {
        vector[i] = Math.random();
      }
      norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      vector = vector.map(val => val / norm);
    }
  }
  
  return { eigenvalues, eigenvectors: transpose(eigenvectors) };
}

// 主要的PCA函数
export function performPCA(expressionData: ExpressionData, nComponents: number = 3): PCAResult {
  const { data, sampleNames, featureNames } = expressionData;
  
  // 标准化数据
  const standardizedData = standardizeData(data);
  
  // 计算协方差矩阵
  const covMatrix = covarianceMatrix(standardizedData);
  
  // 特征值分解
  const { eigenvalues, eigenvectors } = eigenDecomposition(covMatrix);
  
  // 限制成分数量
  const actualComponents = Math.min(nComponents, eigenvalues.length);
  
  // 计算PCA得分：X * V
  const scores = matrixMultiply(standardizedData, 
    eigenvectors.slice(0, actualComponents).map((col, i) => 
      eigenvectors.map(row => row[i])
    ).map(col => col.slice(0, actualComponents))
  );
  
  // 计算解释方差
  const totalVariance = eigenvalues.reduce((sum, val) => sum + val, 0);
  const explainedVariance = eigenvalues.slice(0, actualComponents);
  const explainedVarianceRatio = explainedVariance.map(val => val / totalVariance);
  
  return {
    scores: scores,
    loadings: eigenvectors.slice(0, actualComponents).map((col, i) => 
      eigenvectors.map(row => row[i])
    ),
    explainedVariance,
    explainedVarianceRatio,
    featureNames,
    sampleNames
  };
}