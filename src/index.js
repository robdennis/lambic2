import React from 'react';
import ReactDOM from 'react-dom';
import { Mana } from "@saeris/react-mana"
import './index.css';


function Square(props) {

    const content = (props.value ? <Mana symbol={props.value} cost shadow/>: null);

    return (
        <button className="square" onClick={props.onClick}>
            {content}
        </button>
    );
}

class Board extends React.Component {
    constructor(props) {
        super(props);

        this.state = {cards: []};
    }

    componentDidMount() {
        fetch('/cards.json')
            .then(response=>response.json())
            .then(cards=>this.setState({cards}))

    }

    renderSquare(i) {
        return (
            <Square
                value={this.props.squares[i]}
                onClick={() => this.props.onClick(i)}
            />
        );
    }

    renderMana(card) {
        const costs = this.splitManaCost(this.getManaCost(card));

        return costs.map((cost, _) => {
            return cost.map((symbol, _) => {
                return (
                    <Mana symbol={symbol} cost/>
                );
            });
        }).reduce((prev, curr) => {
            return [prev, ' // ', curr]
        });
    }

    splitManaCost(manaCosts) {

        return manaCosts.map((manaCost, _) => {
            // split a mana cost of the form "{U}{2/W}{X}" to an array of ["U", "2/W", "X"]
            if (!manaCost || manaCost.charAt(0) !== '{' || manaCost.charAt(manaCost.length-1) !== '}') {
                return [];
            }
            return manaCost.substr(1, manaCost.length-2).split('}{').map((cost, ) => {
                return cost.toLowerCase()
            })
        });
    }

    getManaCost(card) {
        if ('card_faces' in card) {
            return card['card_faces'].filter((face => face['mana_cost'])).map((face, _) => {
                return face['mana_cost']
            })
        }

        return [card['mana_cost']]
    }

    render() {
        const cards = this.state.cards.map((card, _) => {
            return (
                <li key={card['id']}>
                    {card['name']} - {this.renderMana(card)}
                </li>
            );
        });

        return (
            <div>
                cards:
                <ol>
                    { cards }
                </ol>
                <div className="board-row">
                    {this.renderSquare(0)}
                    {this.renderSquare(1)}
                    {this.renderSquare(2)}
                </div>
                <div className="board-row">
                    {this.renderSquare(3)}
                    {this.renderSquare(4)}
                    {this.renderSquare(5)}
                </div>
                <div className="board-row">
                    {this.renderSquare(6)}
                    {this.renderSquare(7)}
                    {this.renderSquare(8)}
                </div>
            </div>
        );
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            history: [{
                squares: Array(9).fill(null),
            }],
            stepNumber: 0,
            rIsNext: true,
        };
    }

    handleClick(i) {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        const current = history[history.length - 1];
        const squares = current.squares.slice();
        if (calculateWinner(squares) || squares[i]) {
            return;
        }
        squares[i] = (this.state.rIsNext ? "r" : "g");
        this.setState({
            history: history.concat([{
                squares: squares,
            }]),
            stepNumber: history.length,
            rIsNext: !this.state.rIsNext,
        });
    }

    jumpTo(step) {
        this.setState({
            stepNumber: step,
            rIsNext: (step % 2) === 0,
        });
    }

    render() {
        const history = this.state.history;
        const current = history[this.state.stepNumber];
        const winner = calculateWinner(current.squares);
        const moves = history.map((step, move) => {
            const desc = move ?
                'Go to move #' + move :
                'Go to game start';
            return (
                <li key={move}>
                    <button onClick={() => this.jumpTo(move)}>{desc}</button>
                </li>
            );
        });

        let status;
        let symbol;
        if (winner) {
            status = 'Winner: ';
            symbol = winner;
        } else {
            status = 'Next player: ';
            symbol = (this.state.rIsNext ? "g" : "r");
        }

        return (
            <div className="game">
                <div className="game-board">
                    <Board
                        squares={current.squares}
                        onClick={(i) => this.handleClick(i)}
                    />
                </div>
                <div className="game-info">
                    <div>
                        <div>{status}</div>
                        <div><Mana symbol={symbol} shadow fixed size="2x"/></div>
                    </div>
                    <ol>{moves}</ol>
                </div>
            </div>
        );
    }
}


function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}

// ========================================

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);
