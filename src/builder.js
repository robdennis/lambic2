import React from 'react';
import { Mana } from "@saeris/react-mana"
import ReactTooltip from 'react-tooltip'
import Img from 'react-image'


class Builder extends React.Component {
    constructor(props) {
        super(props);

        this.state = {cards: []};
    }

    componentDidMount() {
        fetch('/cards.json')
            .then(response=>response.json())
            .then(cards=>this.setState({cards}))

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

    getImages(card) {
        if ('image_uris' in card) {
            return [<Img src={card['image_uris']['normal']} height='530'/>];
        }

        else if ('card_faces' in card) {
            return card['card_faces'].filter((face => face['image_uris'])).map((face, _) => {
                return <Img src={face['image_uris']['normal']} height='530'/>;
            })
        }

        return 'UNKNOWN IMAGE URI FORMAT'
    }


    render() {
        const cards = this.state.cards.map((card, _) => {
            return (
                <li key={card['id']} data-tip data-for={card['id']}>
                    {card['name']} - {this.renderMana(card)}
                    <ReactTooltip id={card['id']} place='bottom'>
                        {this.getImages(card)}
                    </ReactTooltip>
                </li>

            );
        });

        return (
            <div>
                <ol>
                    { cards }
                </ol>
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

export default Builder;
