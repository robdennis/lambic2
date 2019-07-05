import React from 'react';
import { Mana } from "@saeris/react-mana"
import ReactTooltip from 'react-tooltip'
import Img from 'react-image'
import {card_db, pool_db} from './db'


class Builder extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            cards: [],
            pool: card_db.table('cards')
        };
    }

    setCards() {
        card_db.table('cards').toArray().then(
            (cards) => {
                console.log('set state on cards: ', cards);
                this.setState({cards})
            }
        )
    }

    componentDidMount() {
        card_db.table('cards').count().then((count) => {
            console.log('cards in database: ', count);
            if (count === 0) {
                console.log('fetching cards');
                fetch('/cards.json')
                    .then(response=>response.json())
                    .then((cards) => {
                        return this.state.cards.bulkAdd(cards)
                    }).then((lastKey) => {
                    console.log('finished adding to cards db');
                }).then(() => this.setState);
            }
            else {
                console.log('not fetching cards; relying on cache');
                this.setCards()
            }
        })
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

    renderCards(cards) {
        return cards.map((card, _) => {
            return (
                <li key={card['id']} data-tip data-for={card['id']}>
                    {card['name']} - {this.renderMana(card)}
                    <ReactTooltip id={card['id']} place='bottom'>
                        {this.getImages(card)}
                    </ReactTooltip>
                </li>
            );
        });
    }

    render() {
        return (
            <div>
                <div className='cards'>
                    cards
                    <ol>
                        { this.renderCards(this.state.cards) }
                    </ol>
                </div>
                <div className='pool'>
                    pool
                    <ol>
                    </ol>
                </div>
            </div>
        );
    }
}

export default Builder;
