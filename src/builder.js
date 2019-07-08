import React from 'react';
import { Mana } from "@saeris/react-mana"
import ReactTooltip from 'react-tooltip'
import Img from 'react-image'
import Dexie from 'dexie'
import {card_db, pool_db} from './db'
import CardSuggest from './card-suggest'

class Builder extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            cards: [],
            pool: []
        };


        this.clearCache = this.clearCache.bind(this);
        this.fillCache = this.fillCache.bind(this);
    }

    setCards(table, stateName) {
        console.log('setting this.state.' + stateName);
        table.table('cards').toArray().then(
            (cards) => {
                console.log('set state on cards: ', cards);
                this.setState({[stateName]: cards});
                console.log(this.state);
            }
        )
    }

    clearCache(table, stateName) {
        console.log('clearing cards for ', stateName);
        table.table('cards').clear().then(() => {
            console.log('finished clearing ', stateName);
            this.setCards(table, stateName);
        })
    }

    componentDidMount() {
        this.setCards(pool_db, 'pool');

        card_db.table('cards').count().then((count) => {
            console.log('cards in database: ', count);
            if (count === 0) {
                this.fillCache();
            }
            else {
                console.log('not fetching cards; relying on cache');
                this.setCards(card_db, 'cards');
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

    renderCards(cards, key) {
        return cards.map((card, _) => {
            return (
                <li key={card[key]} data-tip data-for={card['id']} className='card-list-entry'>
                    {card['name']} - {this.renderMana(card)}
                    <ReactTooltip id={card['id']} place='bottom'>
                        {this.getImages(card)}
                    </ReactTooltip>
                </li>
            );
        });
    }

    fillCache() {
        console.log('fetching cards');
        fetch('/cards.json')
            .then(response=>response.json())
            .then((cards) => {
                return card_db.table('cards').bulkAdd(cards)
                    .catch(Dexie.BulkError, function (e) {
                        console.log('Ignoring errors during filling cache.')
                    });
            }).then((lastKey) => {
            console.log('finished adding to cards db');
            this.setCards(card_db, 'cards');
        });
    }

    addToPool(event, { suggestion, suggestionValue, suggestionIndex, sectionIndex, method }) {
        console.log('adding to pool', suggestion);
        pool_db.table('cards').add(suggestion).then(() => {
            this.setState({'pool': this.state.pool.concat([suggestion])});
        })
    }

    render() {

        return (
            <div>
                <div className='cards'>
                    cards
                    <button className="clear-cache" onClick={() => this.clearCache(card_db, 'cards')}>
                        clear cache
                    </button>
                    <button className="fill-cache" onClick={this.fillCache}>
                        fill cache
                    </button>
                    <ol>
                        { this.renderCards(this.state.cards, 'id') }
                    </ol>
                </div>
                <div className='pool'>
                    pool
                    <button className="clear-pool" onClick={() => this.clearCache(pool_db, 'pool')}>
                        clear pool
                    </button>
                    <CardSuggest table={card_db.table('cards')}
                                 onSuggestionSelected={this.addToPool.bind(this)} />
                    <ol>
                        { this.renderCards(this.state.pool,  'pool_id') }
                    </ol>
                </div>
            </div>
        );
    }
}

export default Builder;
