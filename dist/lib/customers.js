"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customers = void 0;
const moment_1 = __importDefault(require("moment"));
class Customers {
    constructor(orders) {
        this.today = (0, moment_1.default)();
        this.oneYear = (0, moment_1.default)(this.today).subtract(12, "months");
        this.oneSemester = (0, moment_1.default)(this.today).subtract(6, "months");
        this.oneQuarter = (0, moment_1.default)(this.today).subtract(3, "months");
        this.oneMonth = (0, moment_1.default)(this.today).subtract(1, "months");
        this.orders = [];
        this.computed = {};
        this.orders = orders;
    }
    allUsers() {
        return this.orders.map(o => o.customer);
    }
    init(id, pseudo) {
        if (!this.computed[id]) {
            this.computed[id] = {};
            this.computed[id].pseudo = pseudo;
        }
        //
        //
        if (this.computed[id].orders) {
            return this.computed[id].orders;
        }
        //
        //
        return this.computed[id].orders = this.orders.filter(o => o.customer.id === id);
    }
    getAll() {
        //
        // total:81,year:31,semester:18,quarter:6,month:0
        // x1+x2+x3+x4+x5
        if (!this._all) {
            this._all = Object.keys(this.computed).
                sort((a, b) => this.computed[b].score - this.computed[a].score);
        }
        return this._all;
    }
    get(id) {
        if (!this.computed[id]) {
            return {};
        }
        return {
            score: this.computed[id].score,
            pseudo: this.computed[id].pseudo,
            freqs: this.computed[id].freqs,
            issues: this.computed[id].issues
        };
    }
    //
    // scoring a customer based on sum of frequency orders 
    score(id) {
        var cid = this.computed[id];
        return cid.freqs.past + cid.freqs.year * 2 + cid.freqs.semester * 3 + cid.freqs.quarter * 5 + cid.freqs.month * 6;
    }
    compute(id, pseudo) {
        //
        //
        this.init(id, pseudo);
        //
        // compute frequencies
        var freqs = this.computed[id].freqs = {
            total: this.computed[id].orders.length,
            year: 0,
            semester: 0,
            quarter: 0,
            month: 0,
            last: (0, moment_1.default)(this.today).subtract(10, "years"),
            past: 0
        };
        this.computed[id].orders.forEach(o => {
            // console.log('---',o.shipping.when.$date)
            var when = (0, moment_1.default)(o.shipping.when.$date);
            if (when.isAfter(this.oneYear)) {
                freqs.year++;
            }
            if (when.isAfter(this.oneSemester)) {
                freqs.semester++;
            }
            if (when.isAfter(this.oneQuarter)) {
                freqs.quarter++;
            }
            if (when.isAfter(this.oneMonth)) {
                freqs.month++;
            }
            if (when.isAfter(freqs.last)) {
                freqs.last = when;
            }
        });
        freqs.past = this.computed[id].orders.length - freqs.year;
        //FIXME last type of Moment or string
        //freqs.last=freqs.last.format();
        //
        // compute issue
        var issues = this.computed[id].issues = { total: 0 };
        this.computed[id].orders.forEach(o => {
            o.items.forEach(item => {
                if (!item.issue.name) {
                    return;
                }
                if (issues[item.vendor]) {
                    issues[item.vendor]++;
                }
                else
                    issues[item.vendor] = 1;
                issues.total++;
            });
        });
        this.computed[id].score = this.score(id);
        return this.get(id);
    }
}
exports.Customers = Customers;
