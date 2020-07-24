"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineIndex = void 0;
var assert = require('assert');
var _ = require('lodash');
var fs = require('fs');
var sylvester = require('sylvester');
//
// vector, matrix and geometry library
// http://sylvester.jcoglan.com/
//
// machine learning
// var jonfon = require('jonfon');
// var Model = jonfon.Model;
class MachineIndex {
    constructor(options) {
        // model
        this.timestamp = options.timestamp;
        this.domain = options.domain || 'karibou.ch';
        this.file = "-model.json";
        this.model = options.model;
        this.likely = options.likely;
        this.rating = options.rating || {};
        this.products = options.products || [];
        this.vendors;
        this.categories;
        this.path = options.path;
        if (this.likely) {
            this.model = new this.likely.Model(sylvester.Matrix.create(options.model.input), options.model.rowLabels, options.model.colLabels);
            this.model.input = sylvester.Matrix.create(options.model.input);
            this.model.estimated = sylvester.Matrix.create(options.model.estimated);
        }
        console.log('--- DATE', this.timestamp);
        // console.log('--- CF likely',(!!this.likely));
        // console.log('--- CF jonfon',(!!this.model));
        console.log('--- model      size', this.humanSz(JSON.stringify(this.model || '').length));
        console.log('--- rating     size', this.humanSz(JSON.stringify(this.rating).length));
        console.log('--- product    size', this.humanSz(JSON.stringify(this.products).length), this.products.length);
        assert(this.domain);
        assert(options.products);
        this.getCategories();
        this.getVendors();
    }
    addInMemory(product) {
        Object.keys(this.rating).forEach(user => {
            this.rating[user].push({
                item: product.sku, score: 0.1, sum: 1
            });
        });
    }
    humanSz(bytes) {
        var thresh = 1024;
        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }
        var units = ['kb', 'Mb', 'Gb', 'Tb', 'Pb', 'Eb', 'Zb', 'Yb'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);
        return bytes.toFixed(1) + ' ' + units[u];
    }
    getCategories() {
        if (this.categories) {
            return Object.keys(this.categories).sort();
        }
        this.categories = {};
        this.products.forEach(prod => {
            this.categories[prod.categories] = [];
        });
        return Object.keys(this.categories).sort();
    }
    getCategorySku(category) {
        if (!this.categories[category].length) {
            this.categories[category] = this.products.filter(product => product.categories == category).map(product => product.sku);
        }
        return this.categories[category];
    }
    getMedianScore() {
    }
    getVendors() {
        if (this.vendors) {
            return Object.keys(this.vendors).sort();
        }
        this.vendors = {};
        this.products.forEach(prod => {
            this.vendors[prod.vendor] = [];
        });
        return Object.keys(this.vendors).sort();
    }
    getVendorSku(vendor) {
        if (!this.vendors[vendor] || !this.vendors[vendor].length) {
            this.vendors[vendor] = this.products.filter(product => product.vendor == vendor).map(product => product.sku);
        }
        return this.vendors[vendor];
    }
    static load(path, domain) {
        var content;
        try {
            content = fs.readFileSync(path + '/' + domain + "-model.json", { encoding: 'utf8' });
        }
        catch (e) {
            // throw new Error('Error reading file:'+path+'/'+domain+"-model.json");
            // Create an empty Index
            return new MachineIndex({
                model: {},
                products: [],
                rating: {},
                domain: domain
            });
        }
        content = JSON.parse(content);
        return new MachineIndex({
            path: path,
            timestamp: new Date(content.timestamp),
            likely: content.likely,
            model: content.model,
            products: content.products,
            rating: content.rating,
            domain: content.domain
        });
    }
    mapProduct(sku) {
        return this.products.find(p => p.sku == sku);
    }
    recommendations(user, n, params) {
        if (params.category) {
            this.getCategorySku(params.category);
            return this.model.recommendations(user, 1000).filter(reco => this.categories[params.category].indexOf(reco.item) > -1).slice(0, n || 20);
            // return this.model.recommendations(user,1000).filter(reco=>this.categories[category].indexOf(reco.item)>-1).slice(0,n||20);
        }
        if (params.vendor) {
            this.getVendorSku(params.vendor);
            return this.model.recommendations(user, 1000).filter(reco => this.vendors[params.vendor].indexOf(reco.item) > -1).slice(0, n || 20);
            // return this.model.recommendations(user,1000).filter(reco=>this.vendors[vendor].indexOf(reco.item)>-1).slice(0,n||20);
        }
        return this.model.recommendations(user, n).slice(0, n || 20);
    }
    reload() {
        let mi = MachineIndex.load(this.path, this.domain);
        if (mi.timestamp > this.timestamp) {
            Object.assign(this, mi);
        }
    }
    ratings(user, n, params) {
        //
        // default values
        n = n || 20;
        user = user || 'anonymous';
        params = params || {};
        //
        // initial values
        this.rating[user] = this.rating[user] || [];
        let result = this.rating[user].filter(reco => reco);
        //
        // popular by category
        if (params.category) {
            this.getCategorySku(params.category);
            result = result.filter(reco => this.categories[params.category].indexOf(reco.item) > -1);
        }
        //
        // popular by vendor
        if (params.vendor) {
            this.getVendorSku(params.vendor);
            result = result.filter(reco => this.vendors[params.vendor].indexOf(reco.item) > -1);
        }
        //
        // constrains by HUBs of vendors
        if (params.vendors && params.vendors.length) {
            result = result.filter(elem => {
                return params.vendors.some(vendor => this.getVendorSku(vendor).indexOf(elem.item) > -1);
            });
        }
        //
        // window of sorted results
        result = result.sort(this.sortByScore).slice(0, n);
        //
        // pad cell with anonymous ratings
        if (params.pad &&
            result.length < n &&
            user !== 'anonymous') {
            n = (n - result.length);
            //
            // merge anonymous data for missing score
            result = result.concat(this.ratings('anonymous', n, params));
            result = result.filter((elem, index, array) => array.findIndex(sub => sub.item == elem.item) === index);
        }
        return result;
    }
    sortByScore(a, b) {
        return b.score - a.score;
    }
    save(path) {
        var $this = this;
        var content = {
            timestamp: new Date(),
            likely: this.likely,
            products: this.products,
            domain: this.domain,
            model: this.model,
            rating: this.rating
        };
        return new Promise((resolve, reject) => {
            fs.writeFile(path + '/' + this.domain + this.file, JSON.stringify(content, null, 2), 'utf8', function (err) {
                if (err) {
                    return reject(err);
                }
                resolve($this);
            });
        });
    }
}
exports.MachineIndex = MachineIndex;
