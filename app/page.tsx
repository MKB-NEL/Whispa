'use client';

import { useState, useCallback, useEffect } from 'react';

type Operation = '+' | '-' | '×' | '÷' | '=' | 'C' | '±' | '%' | '.' | '⌫';
type CalculatorState = {
  current: string;
  previous: string;
  operation: Operation | null;
  resetNext: boolean;
};

export default function Calculator() {
  const [state, setState] = useState<CalculatorState>({
    current: '0',
    previous: '',
    operation: null,
    resetNext: false,
  });
  const [history, setHistory] = useState<string[]>([]);

  const formatNum = (num: string) => {
    if (num === 'Error') return 'Error';
    const parts = num.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const parseNum = (val: string) => parseFloat(val.replace(/,/g, ''));

  const calculate = (a: number, b: number, op: Operation) => {
    let result: number;
    switch (op) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '×': result = a * b; break;
      case '÷': 
        if (b === 0) return 'Error';
        result = a / b; 
        break;
      default: return b.toString();
    }
    if (!Number.isInteger(result)) result = parseFloat(result.toPrecision(12));
    if (!isFinite(result)) return 'Error';
    return result.toString();
  };

  const handleInput = useCallback((value: string | number) => {
    if (typeof value === 'number') {
      setState(prev => {
        if (prev.resetNext) {
          return { ...prev, current: value.toString(), resetNext: false };
        }
        const curr = prev.current.replace(/,/g, '');
        if (curr === '0' && value === 0) return prev;
        if (curr === '0') return { ...prev, current: value.toString() };
        if (curr.length >= 15) return prev;
        return { ...prev, current: curr + value.toString() };
      });
      return;
    }

    setState(prev => {
      const currentNum = parseNum(prev.current);
      const prevNum = prev.previous ? parseNum(prev.previous) : 0;

      if (value === '=') {
        if (!prev.operation) return { ...prev, resetNext: true };
        const result = calculate(prevNum, currentNum, prev.operation);
        setHistory(h => [...h, `${formatNum(prev.previous)} ${prev.operation} ${formatNum(prev.current)} = ${formatNum(result)}`].slice(-10));
        return { current: result, previous: '', operation: null, resetNext: true };
      }

      if (value === 'C') {
        return { current: '0', previous: '', operation: null, resetNext: false };
      }

      if (value === '%') {
        return { ...prev, current: (currentNum / 100).toString(), resetNext: true };
      }

      if (value === '±') {
        return { ...prev, current: (currentNum * -1).toString() };
      }

      if (value === '⌫') {
        const curr = prev.current.replace(/,/g, '');
        return { ...prev, current: curr.length <= 1 ? '0' : curr.slice(0, -1) };
      }

      if (value === '.') {
        if (prev.current.includes('.')) return prev;
        return { ...prev, current: prev.current + '.' };
      }

      if (prev.operation && !prev.resetNext) {
        const result = calculate(prevNum, currentNum, prev.operation);
        return { ...prev, current: result, previous: result, operation: value, resetNext: true };
      }

      return { ...prev, previous: prev.current, operation: value, resetNext: true };
    });
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (key >= '0' && key <= '9') handleInput(parseInt(key));
      else if (key === '.') handleInput('.');
      else if (['+', '-'].includes(key)) { e.preventDefault(); handleInput(key); }
      else if (key === '*') { e.preventDefault(); handleInput('×'); }
      else if (key === '/') { e.preventDefault(); handleInput('÷'); }
      else if (key === 'Enter' || key === '=') { e.preventDefault(); handleInput('='); }
      else if (key === 'Backspace') handleInput('⌫');
      else if (key === 'Escape' || key === 'c') handleInput('C');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleInput]);

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  const getVariant = (label: string) => {
    if (['÷', '×', '-', '+', '='].includes(label)) return 'operation';
    if (['C', '±', '%'].includes(label)) return 'function';
    return 'number';
  };

  const getColor = (variant: string) => {
    switch (variant) {
      case 'operation': return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'function': return 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white';
      default: return 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 transition-colors">
        {history.length > 0 && (
          <div className="text-right text-xs text-gray-400 dark:text-gray-500 mb-1 truncate">
            {history[history.length - 1]}
          </div>
        )}

        <div className="mb-4 text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400 h-6">
            {state.operation ? `${formatNum(state.previous)} ${state.operation}` : ''}
          </div>
          <div className="text-4xl font-bold font-mono text-gray-900 dark:text-white overflow-x-auto whitespace-nowrap scrollbar-hide">
            {state.current === 'Error' ? 'Error' : formatNum(state.current)}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {buttons.map((row, i) => 
            row.map((label, j) => {
              const variant = getVariant(label);
              const isZero = label === '0';
              return (
                <button
                  key={`${i}-${j}`}
                  onClick={() => handleInput(label)}
                  className={`
                    ${getColor(variant)}
                    ${isZero ? 'col-span-2' : ''}
                    rounded-lg font-semibold text-xl h-14
                    transition-all duration-150 active:scale-95
                    focus:outline-none focus:ring-2 focus:ring-blue-400
                  `}
                >
                  {label}
                </button>
              );
            })
          )}
        </div>

        <div className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
          ⌨️ Keyboard supported
        </div>
      </div>
    </div>
  );
}
