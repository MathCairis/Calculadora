/* STREAMING_CHUNK:Defining Calculator Logic Class... */
class Calculator {
constructor(expressionElem, resultElem, historyListElem) {
this.expressionElem = expressionElem;
this.resultElem = resultElem;
this.historyListElem = historyListElem;

    this.currentInput = '0';
    this.expression = '';
    this.shouldResetInput = false;
    this.history = [];

    this.updateDisplay();
}

/* STREAMING_CHUNK:Formatting Display Methods... */
updateDisplay() {
    this.resultElem.textContent = this.formatNumber(this.currentInput);
    this.expressionElem.textContent = this.formatExpression(this.expression);
    
    if (this.currentInput === 'Erro: Divisão por 0' || this.currentInput === 'Erro de Sintaxe') {
        this.resultElem.classList.add('error');
    } else {
        this.resultElem.classList.remove('error');
    }
}

formatNumber(numStr) {
    if (isNaN(numStr) || numStr === 'Erro: Divisão por 0' || numStr === 'Erro de Sintaxe') {
        return numStr;
    }
    const parts = numStr.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return parts.join(',');
}

formatExpression(exp) {
    return exp
        .replace(/\*/g, ' × ')
        .replace(/\//g, ' ÷ ')
        .replace(/\+/g, ' + ')
        .replace(/\-/g, ' − ');
}

/* STREAMING_CHUNK:Handling Inputs and Operators... */
appendNumber(number) {
    if (this.currentInput === '0' || this.shouldResetInput || this.isErrorState()) {
        this.currentInput = number;
        this.shouldResetInput = false;
    } else {
        if (this.currentInput.replace('.', '').length < 12) {
            this.currentInput += number;
        }
    }
    this.updateDisplay();
}

appendDecimal() {
    if (this.shouldResetInput || this.isErrorState()) {
        this.currentInput = '0.';
        this.shouldResetInput = false;
    } else if (!this.currentInput.includes('.')) {
        this.currentInput += '.';
    }
    this.updateDisplay();
}

setOperator(operator) {
    if (this.isErrorState()) return;

    if (this.shouldResetInput) {
        this.expression = this.currentInput + ' ' + operator + ' ';
        this.shouldResetInput = false;
    } else {
        this.expression += this.currentInput + ' ' + operator + ' ';
    }
    this.currentInput = '0';
    this.updateDisplay();
}

toggleSign() {
    if (this.isErrorState() || this.currentInput === '0') return;
    
    if (this.currentInput.startsWith('-')) {
        this.currentInput = this.currentInput.slice(1);
    } else {
        this.currentInput = '-' + this.currentInput;
    }
    this.updateDisplay();
}

/* STREAMING_CHUNK:Applying Relative Percentage Logic... */
applyPercent() {
    if (this.isErrorState()) return;

    const currentValue = parseFloat(this.currentInput);
    if (isNaN(currentValue)) return;

    if (this.expression !== '') {
        const operatorMatch = this.expression.trim().match(/[\+\-\*\/]$/);
        
        if (operatorMatch) {
            const operator = operatorMatch[0];
            const baseExpr = this.expression.trim().slice(0, -1).trim();
            
            try {
                const baseValue = baseExpr === '' ? 0 : this.evaluateSafe(baseExpr);

                if (operator === '+' || operator === '-') {
                    const relativePercent = (baseValue * currentValue) / 100;
                    this.currentInput = parseFloat(relativePercent.toFixed(8)).toString();
                } else {
                    this.currentInput = (currentValue / 100).toString();
                }
            } catch (e) {
                this.currentInput = (currentValue / 100).toString();
            }
        } else {
            this.currentInput = (currentValue / 100).toString();
        }
    } else {
        this.currentInput = (currentValue / 100).toString();
    }

    this.updateDisplay();
}

backspace() {
    if (this.shouldResetInput || this.isErrorState()) return;

    if (this.currentInput.length > 1) {
        this.currentInput = this.currentInput.slice(0, -1);
    } else {
        this.currentInput = '0';
    }
    this.updateDisplay();
}

clearAll() {
    this.currentInput = '0';
    this.expression = '';
    this.shouldResetInput = false;
    this.updateDisplay();
}

isErrorState() {
    return this.currentInput.startsWith('Erro');
}

/* STREAMING_CHUNK:Evaluating Expressions Safely... */
evaluateSafe(expr) {
    const tokens = [];
    let numberBuffer = '';

    for (let i = 0; i < expr.length; i++) {
        const char = expr[i];

        if ((char >= '0' && char <= '9') || char === '.') {
            numberBuffer += char;
        } else if (['+', '-', '*', '/'].includes(char)) {
            if (numberBuffer !== '') {
                tokens.push(parseFloat(numberBuffer));
                numberBuffer = '';
            } else if (char === '-' && (i === 0 || ['+', '-', '*', '/'].includes(expr[i - 1]))) {
                numberBuffer = '-';
                continue;
            }
            tokens.push(char);
        }
    }
    if (numberBuffer !== '') {
        tokens.push(parseFloat(numberBuffer));
    }

    if (tokens.length === 0) return 0;

    const intermediateTokens = [];
    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];
        if (token === '*' || token === '/') {
            const prevNum = intermediateTokens.pop();
            const nextNum = tokens[i + 1];

            if (nextNum === undefined || isNaN(nextNum)) {
                throw new Error('Sintaxe');
            }

            if (token === '/') {
                if (nextNum === 0) {
                    throw new Error('DivZero');
                }
                intermediateTokens.push(prevNum / nextNum);
            } else {
                intermediateTokens.push(prevNum * nextNum);
            }
            i += 2;
        } else {
            intermediateTokens.push(token);
            i++;
        }
    }

    if (intermediateTokens.length === 0) return 0;
    let result = intermediateTokens[0];

    for (let j = 1; j < intermediateTokens.length; j += 2) {
        const op = intermediateTokens[j];
        const nextVal = intermediateTokens[j + 1];

        if (nextVal === undefined || isNaN(nextVal)) {
            throw new Error('Sintaxe');
        }

        if (op === '+') {
            result += nextVal;
        } else if (op === '-') {
            result -= nextVal;
        }
    }

    return result;
}

calculate() {
    if (this.isErrorState()) return;

    const fullExpression = this.expression + this.currentInput;

    if (!/[\+\-\*\/]/.test(fullExpression)) return;

    try {
        const rawResult = this.evaluateSafe(fullExpression);
        const formattedResult = parseFloat(rawResult.toFixed(8)).toString();

        this.addToHistory(fullExpression, formattedResult);

        this.expression = '';
        this.currentInput = formattedResult;
        this.shouldResetInput = true;

    } catch (error) {
        if (error.message === 'DivZero') {
            this.currentInput = 'Erro: Divisão por 0';
        } else {
            this.currentInput = 'Erro de Sintaxe';
        }
        this.expression = '';
        this.shouldResetInput = true;
    }

    this.updateDisplay();
}

/* STREAMING_CHUNK:Managing History Panel... */
addToHistory(exp, res) {
    this.history.unshift({ exp, res });
    if (this.history.length > 20) this.history.pop();
    this.renderHistory();
}

clearHistory() {
    this.history = [];
    this.renderHistory();
}

renderHistory() {
    this.historyListElem.innerHTML = '';

    if (this.history.length === 0) {
        this.historyListElem.innerHTML = '<li class="history-empty">Nenhum cálculo recente</li>';
        return;
    }

    this.history.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `
            <span class="history-item-exp">${this.formatExpression(item.exp)} =</span>
            <span class="history-item-res">${this.formatNumber(item.res)}</span>
        `;
        li.addEventListener('click', () => {
            this.currentInput = item.res;
            this.expression = '';
            this.shouldResetInput = true;
            this.updateDisplay();
        });
        this.historyListElem.appendChild(li);
    });
}


}

/* STREAMING_CHUNK:Initializing Application and Event Listeners... */
window.onload = function () {
const expressionDisplay = document.getElementById('expressionDisplay');
const resultDisplay = document.getElementById('resultDisplay');
const historyList = document.getElementById('historyList');
const historyPanel = document.getElementById('historyPanel');
const historyToggleBtn = document.getElementById('historyToggleBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const calculator = new Calculator(expressionDisplay, resultDisplay, historyList);

historyToggleBtn.addEventListener('click', () => {
    historyPanel.classList.toggle('open');
    historyToggleBtn.classList.toggle('active');
});

clearHistoryBtn.addEventListener('click', () => {
    calculator.clearHistory();
});

document.querySelector('.keypad').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn) return;

    const action = btn.dataset.action;
    const value = btn.dataset.value;

    switch (action) {
        case 'number':
            calculator.appendNumber(value);
            break;
        case 'decimal':
            calculator.appendDecimal();
            break;
        case 'operator':
            calculator.setOperator(value);
            break;
        case 'calculate':
            calculator.calculate();
            break;
        case 'clear':
            calculator.clearAll();
            break;
        case 'backspace':
            calculator.backspace();
            break;
        case 'percent':
            calculator.applyPercent();
            break;
        case 'toggle-sign':
            calculator.toggleSign();
            break;
    }
});

document.addEventListener('keydown', (e) => {
    let key = e.key;

    if (key === 'Enter') key = 'Enter';
    if (key === 'Escape') key = 'Escape';
    if (key === ',') key = '.';

    let targetBtn = null;
    if (key === 'Enter') {
        targetBtn = document.querySelector('[data-action="calculate"]');
    } else if (key === 'Escape') {
        targetBtn = document.querySelector('[data-action="clear"]');
    } else if (key === 'Backspace') {
        targetBtn = document.querySelector('[data-action="backspace"]');
    } else {
        targetBtn = document.querySelector(`[data-key="${key}"]`);
    }

    if (targetBtn) {
        targetBtn.classList.add('active-key');
        setTimeout(() => targetBtn.classList.remove('active-key'), 120);
    }

    if (!isNaN(key) && key !== ' ') {
        calculator.appendNumber(key);
    } else if (key === '.') {
        calculator.appendDecimal();
    } else if (['+', '-', '*', '/'].includes(key)) {
        calculator.setOperator(key);
    } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculator.calculate();
    } else if (key === 'Backspace') {
        calculator.backspace();
    } else if (key === 'Escape') {
        calculator.clearAll();
    } else if (key === '%') {
        calculator.applyPercent();
    }
});


};