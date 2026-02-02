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
const btn = document.getElementById('playBtn');
const result = document.getElementById('result');
btn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const resp = yield fetch('/api/number');
        const data = yield resp.json();
        result.textContent = `隨機數字是：${data.number}`;
    }
    catch (e) {
        result.textContent = '取得失敗';
    }
}));
