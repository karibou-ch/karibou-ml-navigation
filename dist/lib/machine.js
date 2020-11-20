"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Machine = void 0;
var assert = require('assert');
const machine_index_1 = require("./machine-index");
//
// vector, matrix and geometry library
// http://sylvester.jcoglan.com/
//
// machine learning
// var jonfon = require('jonfon');
// var Engine = jonfon.Engine;
// var Strategy = jonfon.Strategy;
class Machine {
    constructor(options) {
        this.options = options || {};
        if (options.likely) {
            // TODO use a common interface for native implementation
            this.likely = require('likely');
        }
        // output classification
        this.today = new Date();
        // model
        this.domain = this.options.domain || 'karibou.ch';
        this.file = "-model.json";
        this.approach = 'UserKNN_Jaccard';
        this.users = [];
        this.orders = [];
        this.products = [];
        this.matrix = [];
        this.model;
        this.ratings = {};
        this.ratings['anonymous'] = [];
        this.maxScore = {};
        this.minScore = 100;
        this.initialBoost = {};
        //
        // remove jonfon
        // this.engine = new Engine();
        // this.engine.addStrategy(this.approach, new Strategy(this.approach));
    }
    getRatings(uid) {
        assert(uid);
        let row = this.users.findIndex(id => id == uid);
        // this.model.ratings(uid)  
        return this.matrix[row].map((col, i) => {
            return {
                item: this.products[i].sku, score: col
            };
        }).sort((a, b) => {
            return b.score - a.score;
        });
    }
    //
    // useful for new products that arent yet been purchased
    boost(product) {
        const sku = product.sku || product;
        let col = this.products.findIndex(product => product.sku == sku);
        if (col < 0) {
            return console.log('-- ERROR missing product', sku);
        }
        this.initialBoost[+sku] = true;
        const initialCount = (product.boost) ? 4 : (product.discount) ? 2 : 1;
        for (let row = 0; row < this.matrix.length; row++) {
            this.matrix[row][col] = initialCount;
        }
    }
    //
    // matrixCell('category','movie-name', 'user', 'score');
    // return matrix
    learn(user, product, score) {
        score = score || 1;
        // https://github.com/raghavgujjar/matrix#readme
        assert(product);
        assert(user);
        let uid = user.id || user;
        let pid = product.sku || product;
        let row = this.users.findIndex(id => id == uid);
        let col = this.products.findIndex(product => product.sku == pid);
        if (col < 0) {
            return console.log('-- ERROR missing product', pid);
        }
        if (row < 0) {
            return console.log('-- ERROR missing user', uid);
        }
        if (!this.matrix[row][col]) {
            this.matrix[row][col] = 0;
        }
        this.matrix[row][col] += score;
    }
    //
    // 
    setModel(users, products, orders) {
        // Init row/col labels
        this.users = users;
        this.orders = orders;
        this.products = products;
        // INIT Matrix
        // Array(9).fill().map(()=>Array(9).fill())
        this.matrix = [];
        for (var i = 0; i < this.users.length; i++) {
            // FIXME remove fill(0) when using jonfon !!
            this.matrix[i] = new Array(this.products.length).fill(0);
        }
        // make a Matrix Object
        //this.matrix=matrix(matrix);
    }
    //
    // compute attenuation by time
    dimmerSum(orders, sku) {
        let today = Date.now();
        let onemonth = 86400000 * 30;
        //
        // for each orders
        let score = orders.filter(order => order.items.some(item => item.sku == sku)).reduce((sum, order) => {
            //
            // get order date
            const when = order.shipping.when.$date ? new Date(order.shipping.when.$date) : new Date(order.shipping.when);
            //
            // count sku (item freq) vs items count
            let countBuy = order.items.filter(item => item.sku == sku).length;
            //
            // time lapse in months
            let timeInMonth = ((today - when.getTime()) / onemonth);
            //
            // compute attenuation
            let boost = 1 / (Math.pow(timeInMonth + 1.0, 4) * 0.15) + 0.01;
            // if(sku==1002028){
            //   console.log('- attenuation',timeInMonth.toFixed(2), boost.toFixed(2), countBuy,sum); //countBuy,countBuy*boost+sum,
            // }
            return countBuy * boost + sum;
        }, 0);
        return score;
    }
    //
    // index products by 
    // log(Fp)*|p€O|/|O|
    // dimming is made when calling learn(...)
    index(uid) {
        // total orders for this user
        //
        // one month => 24h * 30
        let onemonth = 86400000 * 30;
        let today = Date.now();
        let orders = this.orders.filter(o => o.customer.id == uid);
        let row = this.users.findIndex(id => id == uid);
        //
        // simple check
        orders.forEach(order => {
            assert(order.customer.id == uid);
        });
        // console.log('-- train',this.matrix[row].length,this.matrix[row].filter(o=>o).length)
        // total order by products
        // if(uid=='739049451726747'){
        //   console.log('-- products',this.matrix[row].length,this.products.length,this.matrix[row].filter(elem=>elem).length)
        // }
        this.ratings[uid] = this.matrix[row].map((prodFreq, i) => {
            prodFreq = prodFreq || 0.01;
            //
            // get product SKU
            const sku = this.products[i].sku;
            const category = this.products.find(product => product.sku == sku).categories;
            if (!this.maxScore[category]) {
                this.maxScore[category] = 2;
            }
            // get attenuation(sum)
            let dimmedSum = this.dimmerSum(orders, sku);
            let orderItemCount = orders.filter(order => order.items.some(item => item.sku == sku)).length + 1;
            //  
            // compute the score
            let score = 0.0;
            //
            // case of new products, or updated product
            //
            //
            // https://github.com/karibou-ch/karibou-ml-userx/
            // CU : nombre total de commandes pour un utilisateur
            // CUp: nombre de commandes de l'utilisateur où le produit p_{i} apparaît      
            // ∑O    => count orders for one user
            // ∑(p ⊂ O)  => count orders for one product
            // fP     => freqency product for all orders (freq is >= of p⊂O)
            // log(CUp x Fa)/ CU x Fp
            if (prodFreq && orders.length) {
                score = (dimmedSum * (prodFreq / orderItemCount));
            }
            // FIXME initial boost score should be smarter
            if (this.initialBoost[+sku]) {
                score = this.maxScore[category] * 0.1 * prodFreq;
            }
            // 1000018, /** beurre */
            // 1001829, /** lait */
            // 1000053, /** baguette */
            // 1001861, /** tomatte coeur */
            // 1002395, /** pêche blanche */
            // 1002412, /** pain levain */
            // 1001884, /** poire conf */
            // 1002028, /** passion */
            // 1002584, /** tresse */
            // if([1002028,1001861,1002584].indexOf(sku)>-1){
            //   console.log('---        sku, dimmedSum, COp Fp score')
            //   console.log('-- created',sku,dimmedSum.toFixed(2),(prodFreq/orderItemCount).toFixed(2), score.toFixed(2));
            // }
            if (score > this.maxScore[category]) {
                this.maxScore[category] = score;
            }
            if (score < this.minScore[category]) {
                this.minScore[category] = score;
            }
            return {
                item: sku,
                score: score,
                sum: prodFreq || 0
            };
        });
        //
        // anonymous rating is the sum(score) of all users
        if (!this.ratings['anonymous'].length) {
            this.ratings['anonymous'] = this.products.map(product => {
                return {
                    item: product.sku,
                    score: 0.01,
                    sum: 0
                };
            });
        }
        //
        // anonymous score
        this.ratings[uid].forEach((elem, i) => {
            let row = this.ratings['anonymous'].findIndex($elem => $elem.item == elem.item);
            this.ratings['anonymous'][row].score = (this.ratings['anonymous'][row].score + elem.score) / 2;
            this.ratings['anonymous'][row].sum = (this.ratings['anonymous'][row].sum + elem.sum) / 2;
        });
        //
        // sort user
        this.ratings[uid] = this.ratings[uid].sort((a, b) => {
            return b.score - a.score;
        });
    }
    indexAnonymous() {
        // make sure anonymous doesn't outperform any uid
        this.ratings['anonymous'] = this.ratings['anonymous'].map(elem => {
            elem.score = elem.score / this.users.length;
            return elem;
        }).sort((a, b) => {
            return b.score - a.score;
        });
        // [0,1,2,3,4,5,6].forEach(i=>{
        //   console.log('----- anonyous',this.ratings['anonymous'][i].score,this.ratings['anonymous'][i].item)
        // });
    }
    train() {
        if (this.likely) {
            console.log('--- build likely');
            this.model = this.likely.buildModel(this.matrix, this.users, this.products.map(product => product.sku));
        }
        else {
            // console.log('--- build jonfon')
            // this.engine.addModel(this.domain, this.matrix, this.users, this.products.map(product=>product.sku));
            // this.engine.process(this.approach, this.domain,{similarity: 'pearson',threshold:.1});
            // this.model=this.engine.getModel(this.domain);  
        }
        this.users.forEach(this.index.bind(this));
        this.indexAnonymous();
        return new machine_index_1.MachineIndex({
            products: this.products,
            rating: this.ratings,
            model: this.model,
            domain: this.domain,
            likely: this.likely,
            timestamp: Date.now()
        });
    }
}
exports.Machine = Machine;
