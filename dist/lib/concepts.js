"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const moment = require('moment');
const _ = require('lodash');
const stopwords = require('stopwords-fr'); // array of stopwords
const Clarifai = require('clarifai');
const mapSaves = (iterable, action) => __awaiter(void 0, void 0, void 0, function* () {
    let i = 0;
    let results = [];
    for (const x of iterable) {
        const iter = (yield action(x, i++));
        results.push(iter);
    }
    return results;
});
export class Concepts {
    constructor(options) {
        this.options = options || {};
        // output classifications
        this.classifications = { graph: [] };
        this.graph = { best: {}, worth: {} };
        this.concepts = {};
        this.products = [];
        this.predicts = [];
        this.today = new Date();
    }
    save(filename, elems) {
        var fs = require('fs');
        var content = JSON.stringify(elems || this.products, null, 2);
        fs.writeFile(filename, content, 'utf8', function (err) {
            if (err) {
                return console.log(err);
            }
        });
    }
    buildLexico(products) {
        let tags = {};
        products.forEach(product => {
            product.tags.forEach(tag => {
                if (!tags[tag]) {
                    tags[tag] = 0;
                }
                tags[tag]++;
            });
        });
        return tags;
    }
    lexical(products) {
        let tags = [];
        products.forEach(product => {
            let words = this.stringToWorlds(product.title);
            tags = tags
                .concat(words.filter(word => stopwords.indexOf(word) == -1))
                .filter((v, i, a) => a.indexOf(v) === i).sort();
        });
        return tags;
    }
    stringToWorlds(text) {
        return text
            .toLowerCase()
            .replace(/[/|&;$%@"'!<>()+-.–│,“«»]/g, " ")
            .replace(/(l'|d'|l’|d’)/g, "")
            .split(' ').filter(word => word.length > 2);
    }
    //
    // detect classification
    detection(products) {
        // api key (scope=all)
        var today = Date.now();
        var key = this.options.key || 'd45ec8c49d63443aa2375e5eb2a18a51';
        var app = new Clarifai.App({
            apiKey: key
        });
        // reset
        this.predicts = this.products = [];
        var $this = this;
        //
        // 
        return mapSaves(products, (product, i) => {
            return app.models.predict(Clarifai.FOOD_MODEL, 'https:' + product.photo, { language: 'en' }).then((res) => {
                console.log('-- detect', i, product.sku, product.title);
                return res.outputs[0].data.concepts;
            }).catch((err) => {
                console.log('-- ERR', err);
                return [];
            });
        }).then((predicts) => {
            predicts.forEach(function (concepts, i) {
                var tags = concepts.filter((concept) => (concept.value > 0.95)).map((e) => e.name);
                $this.predicts.push({
                    sku: products[i].sku,
                    title: products[i].title,
                    image: products[i].photo,
                    categories: products[i].categories,
                    tags: tags,
                    updated: today
                });
            });
            return $this.predicts;
        });
    }
    //
    //
    buildIndex(products, score) {
        score = score || .8;
        this.products = products || this.products;
        var prod_sz = this.products.length;
        //
        // already done
        if (typeof this.products[1].tags[0] === 'string') {
            //
            // compute tags freq
            this.products.forEach(prod => {
                prod.tags.forEach(tag => {
                    if (!this.concepts[tag]) {
                        this.concepts[tag] = 0;
                    }
                    this.concepts[tag]++;
                });
            });
            // https://fr.wikipedia.org/wiki/TF-IDF
            // IDF
            // fréquence inverse de produit log(P/{pi;tag€pi})
            // P = this.products.length
            // {pi;tag€pi} = nb de produit ou le tag apparaît
            Object.keys(this.concepts).map(tag => {
                this.concepts[tag] = Math.log(prod_sz / this.concepts[tag]);
            });
            // TF
            // tag vs le nombre de tags dans un produit 1/N
            this.products.forEach(prod => {
                //
                // sorting tag based on score
                prod.tags = prod.tags.map(tag => {
                    return { name: tag, score: this.concepts[tag] * 1 / prod.tags.length };
                }).sort((a, b) => {
                    return b.score - a.score;
                });
            });
        }
        //
        // build graph between products
        this.products.forEach(prod => {
            //
            // graph best concetp with the product
            prod.tags = prod.tags.filter(tag => tag.score > score);
            prod.tags.forEach(tag => {
                if (!this.graph.best[tag.name]) {
                    this.graph.best[tag.name] = [];
                }
                this.graph.best[tag.name].push({
                    product: prod,
                    score: tag.score
                });
            });
        });
        return this.products;
    }
    //
    // return connected products with this one
    similar(product, score) {
        score = score || 0.8;
        let linked = [];
        if (!product.tags.length)
            return linked;
        product.tags.forEach(tag => {
            if (tag.score < score) {
                return;
            }
            linked = _.uniq(linked.concat(this.graph.best[tag.name]));
        });
        return linked;
    }
    getGraph() {
        return this.graph;
    }
    //
    // return 
    //
    // 
    classification() {
        this.products.forEach((product) => {
            if (!this.classifications[product.categories]) {
                this.classifications[product.categories] = {};
            }
            product.tags.forEach((tag) => {
                if (!this.classifications[product.categories][tag.name]) {
                    //
                    // TODO category should not be null
                    if (!product.categories)
                        return;
                    this.classifications.graph.push({ node: product.categories, vertex: tag.name });
                    this.classifications[product.categories][tag.name] = 0;
                }
                this.classifications[product.categories][tag.name]++;
            });
        });
        Object.keys(this.classifications).forEach((category) => {
            Object.keys(this.classifications[category]).sort((a, b) => {
                return this.classifications[category][b] - this.classifications[category][a];
            });
        });
        return this.classifications;
    }
}
module.exports = Concepts;
