const fs=require('fs');
const path='apps/mindmark-web/src/components/review/LectureDraftCard.vue';
let s=fs.readFileSync(path,'utf8');
s=s.replace('</PageSection>`n</template>','</PageSection>\n</template>');
fs.writeFileSync(path,s,'utf8');
