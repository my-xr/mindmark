const fs=require('fs');
const path='apps/mindmark-web/src/components/review/LectureDraftCard.vue';
const s=fs.readFileSync(path,'utf8');
console.log('contains good snippets', ['Provider','置信度','教师可编辑讲评稿','生成时间'].map(x=>[x,s.includes(x)]));
console.log('contains mojibake', ['璁茶瘎','鐢熸垚','瀵煎嚭','纭'].map(x=>[x,s.includes(x)]));
